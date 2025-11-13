/**
 * Rate Limiting Plugin
 *
 * Demonstrates: stroke:before hook
 * Purpose: Prevent users from sending too many strokes too quickly
 */

import { MiddlewarePlugin } from '../../shared/types.js';

// In-memory rate limit tracking (in production, use Redis)
const userStrokeCounts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_STROKES_PER_WINDOW = 100; // 100 strokes per second

const rateLimitCheck: MiddlewarePlugin = (context) => {
  const { userId } = context;
  const now = Date.now();

  // Get or initialize user's stroke history
  if (!userStrokeCounts.has(userId)) {
    userStrokeCounts.set(userId, []);
  }

  const userStrokes = userStrokeCounts.get(userId)!;

  // Remove strokes outside the current window
  const recentStrokes = userStrokes.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );

  // Check if user has exceeded the rate limit
  if (recentStrokes.length >= MAX_STROKES_PER_WINDOW) {
    context.stopped = true;
    context.error = 'Rate limit exceeded. Please slow down.';
    console.log(`[RateLimitPlugin] User ${userId} exceeded rate limit`);
    return;
  }

  // Add current stroke timestamp
  recentStrokes.push(now);
  userStrokeCounts.set(userId, recentStrokes);

  console.log(`[RateLimitPlugin] User ${userId}: ${recentStrokes.length}/${MAX_STROKES_PER_WINDOW} strokes in window`);
};

// Cleanup old data periodically (every 10 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [userId, strokes] of userStrokeCounts.entries()) {
    const recentStrokes = strokes.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW
    );

    if (recentStrokes.length === 0) {
      userStrokeCounts.delete(userId);
    } else {
      userStrokeCounts.set(userId, recentStrokes);
    }
  }
}, 10000);

export default rateLimitCheck;
