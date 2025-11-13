/**
 * Webhook Notification Plugin
 *
 * Demonstrates: stroke:after hook
 * Purpose: Send webhook notifications for stroke events
 *
 * Enable by setting WEBHOOK_URL environment variable
 */

import { MiddlewarePlugin } from '../../shared/types.js';

const WEBHOOK_URL = process.env.WEBHOOK_URL;

const webhookNotify: MiddlewarePlugin = async (context) => {
  // Only run if webhook URL is configured
  if (!WEBHOOK_URL) {
    return;
  }

  const { stroke, userId, sessionId } = context;

  if (!stroke) return;

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'stroke_created',
        data: {
          strokeId: stroke.id,
          userId,
          sessionId,
          tool: stroke.tool,
          pointCount: stroke.points.length,
          timestamp: stroke.serverTimestamp
        }
      })
    });

    if (response.ok) {
      console.log(`[WebhookPlugin] Notification sent for stroke ${stroke.id}`);
    } else {
      console.error(`[WebhookPlugin] Failed to send webhook: ${response.status}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WebhookPlugin] Error sending webhook:`, errorMessage);
    // Don't stop the chain on webhook failure
  }
};

export default webhookNotify;
