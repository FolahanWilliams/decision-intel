import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

export default clerkMiddleware(async (auth, req) => {
    // auth.protect() throws a redirect response on auth failure.
    // Do NOT wrap in try/catch — catching and returning NextResponse.next()
    // would silently bypass authentication on protected routes.
    if (isProtectedRoute(req)) await auth.protect();
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
