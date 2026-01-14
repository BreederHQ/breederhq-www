/**
 * Middleware
 * Adds security headers to all responses
 * Note: Visitor tracking is handled client-side via TrackingInit.astro
 */

import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // Get the response
  const response = await next();

  // Clone response to modify headers
  const newResponse = new Response(response.body, response);

  // Add security headers
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newResponse.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  return newResponse;
});
