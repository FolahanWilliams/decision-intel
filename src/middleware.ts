import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/documents(.*)',
    '/api/upload',
    '/api/stats',
    '/api/analyze(.*)',
    '/api/insights',
    '/api/trends(.*)',
    '/api/audit',
    '/api/documents(.*)',
    '/api/search'
]);

// Routes that should be rate limited (expensive AI operations)
const isRateLimitedRoute = createRouteMatcher([
    '/api/analyze',
    '/api/analyze/stream',
    '/api/analyze/simulate',
    '/api/upload'
]);

export default clerkMiddleware(async (auth, req) => {
    try {
        // Check authentication for protected routes
        if (isProtectedRoute(req)) await auth.protect();
        
        // Apply rate limiting to expensive routes using Postgres
        if (isRateLimitedRoute(req)) {
            try {
                // Get IP address (fallback to "anonymous" if not available)
                const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                           req.headers.get('x-real-ip') || 
                           "anonymous";
                
                const route = req.nextUrl.pathname;
                const result = await checkRateLimit(ip, route);
                
                if (!result.success) {
                    console.warn(`Rate limit exceeded for IP: ${ip} on route: ${route}`);
                    return NextResponse.json(
                        { 
                            error: "Rate limit exceeded. You can analyze up to 5 documents per hour.",
                            limit: result.limit,
                            reset: result.reset,
                            remaining: 0
                        }, 
                        { 
                            status: 429,
                            headers: {
                                'X-RateLimit-Limit': result.limit.toString(),
                                'X-RateLimit-Remaining': '0',
                                'X-RateLimit-Reset': result.reset.toString(),
                            }
                        }
                    );
                }
                
                // Add rate limit headers to successful responses
                const response = NextResponse.next();
                response.headers.set('X-RateLimit-Limit', result.limit.toString());
                response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
                response.headers.set('X-RateLimit-Reset', result.reset.toString());
                return response;
            } catch (rateLimitError) {
                console.error('Rate limiting error:', rateLimitError);
                // Continue without rate limiting if there's an error
                return NextResponse.next();
            }
        }
        
        // Continue for non-rate-limited routes
        return NextResponse.next();
    } catch (error) {
        console.error('Middleware error:', error);
        return NextResponse.next();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};