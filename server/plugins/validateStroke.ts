/**
 * Stroke Validation Plugin
 *
 * Demonstrates: stroke:before hook
 * Purpose: Validate stroke data before broadcasting
 */

import { MiddlewarePlugin } from '../../shared/types.js';

const validateStroke: MiddlewarePlugin = (context) => {
  const { stroke } = context;

  if (!stroke) {
    context.stopped = true;
    context.error = 'No stroke provided';
    return;
  }

  // Check if stroke has required fields
  if (!stroke.id) {
    context.stopped = true;
    context.error = 'Stroke missing ID';
    return;
  }

  if (!stroke.tool) {
    context.stopped = true;
    context.error = 'Stroke missing tool type';
    return;
  }

  if (!stroke.points || !Array.isArray(stroke.points)) {
    context.stopped = true;
    context.error = 'Stroke missing points array';
    return;
  }

  // Validate minimum points (need at least 2 points for a stroke)
  if (stroke.points.length < 2) {
    context.stopped = true;
    context.error = 'Stroke must have at least 2 points';
    return;
  }

  // Validate point structure
  for (const point of stroke.points) {
    if (typeof point.x !== 'number' || typeof point.y !== 'number') {
      context.stopped = true;
      context.error = 'Invalid point format';
      return;
    }

    // Validate point is within reasonable canvas bounds (0-10000)
    if (point.x < 0 || point.x > 10000 || point.y < 0 || point.y > 10000) {
      context.stopped = true;
      context.error = 'Point coordinates out of bounds';
      return;
    }
  }

  // Validate color if present
  if (stroke.color && !/^#[0-9A-Fa-f]{6}$/.test(stroke.color)) {
    context.stopped = true;
    context.error = 'Invalid color format (must be hex: #RRGGBB)';
    return;
  }

  // Validate line width
  if (stroke.lineWidth && (stroke.lineWidth < 1 || stroke.lineWidth > 50)) {
    context.stopped = true;
    context.error = 'Line width must be between 1 and 50';
    return;
  }

  // Validation passed
  console.log(`[ValidatePlugin] Stroke ${stroke.id} validated successfully`);
};

export default validateStroke;
