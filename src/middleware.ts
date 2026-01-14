/**
 * Astro Middleware
 * Handles visitor intelligence, performance monitoring, and security headers
 */

import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;

  // Track high-value visitors on key pages (async, non-blocking)
  const isKeyPage = ['/pricing', '/demo', '/contact'].some(path => url.pathname.includes(path));
  if (isKeyPage && import.meta.env.CLEARBIT_SECRET_KEY) {
    // Fire and forget - don't block the response
    trackVisitor(request).catch(console.error);
  }

  // Get response
  const response = await next();

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Add performance headers
  response.headers.set('X-Response-Time', Date.now().toString());

  return response;
});

/**
 * Non-blocking visitor tracking
 */
async function trackVisitor(request: Request) {
  try {
    await fetch(new URL('/api/track-visitor', request.url).href, {
      method: 'POST',
      headers: {
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'CF-Connecting-IP': request.headers.get('cf-connecting-ip') || '',
        'User-Agent': request.headers.get('user-agent') || '',
      },
    });
  } catch (error) {
    // Silently fail - don't impact user experience
    console.error('Visitor tracking failed:', error);
  }
}
