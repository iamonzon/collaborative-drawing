/**
 * Stroke Logging Plugin
 *
 * Demonstrates: stroke:after hook
 * Purpose: Log stroke events for analytics/debugging
 */

import { MiddlewarePlugin } from '../../shared/types.js';

const logStroke: MiddlewarePlugin = (context) => {
  const { stroke, userId, sessionId } = context;

  if (!stroke) return;

  // Log stroke details
  console.log(`[LogPlugin] Stroke logged:`, {
    strokeId: stroke.id,
    userId,
    sessionId,
    tool: stroke.tool,
    pointCount: stroke.points.length,
    timestamp: stroke.serverTimestamp,
    color: stroke.color || 'default'
  });

  // In production, this could:
  // - Send to analytics service (e.g., Mixpanel, Segment)
  // - Write to database for historical analysis
  // - Send to logging service (e.g., DataDog, CloudWatch)
  // - Track metrics (strokes per session, popular tools, etc.)
};

export default logStroke;
