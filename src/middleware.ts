import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Upstash Redis for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Configure rate limit: 5 requests per hour per IP
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true, // Enable analytics to track rate limit usage
});

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
    // Check authentication for protected routes
    if (isProtectedRoute(req)) await auth.protect();
    
    // Apply rate limiting to expensive routes
    if (isRateLimitedRoute(req)) {
        // Get IP address (fallback to "anonymous" if not available)
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   "anonymous";
        
        const { success, limit, reset, remaining } = await ratelimit.limit(ip);
        
        if (!success) {
            console.warn(`Rate limit exceeded for IP: ${ip}`);
            return NextResponse.json(
                { 
                    error: "Rate limit exceeded. You can analyze up to 5 documents per hour.",
                    limit,
                    reset,
                    remaining: 0
                }, 
                { 
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': reset.toString(),
                    }
                }
            );
        }
        
        // Add rate limit headers to successful responses
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', reset.toString());
        return response;
    }
    
    // Continue for non-rate-limited routes
    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
