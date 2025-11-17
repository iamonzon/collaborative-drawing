/**
 * Stroke Validation Plugin
 *
 * Demonstrates: stroke:before hook
 * Purpose: Validate stroke data before broadcasting
 */

import { MiddlewarePlugin, MiddlewareContext } from '../../shared/types.js';

// Validation constraints
const CONSTRAINTS = {
  MIN_POINTS: 2,
  MIN_LINE_WIDTH: 1,
  MAX_LINE_WIDTH: 50,
  MIN_COORDINATE: 0,
  MAX_COORDINATE: 10000,
  COLOR_REGEX: /^#[0-9A-Fa-f]{6}$/
} as const;

/**
 * Helper to fail validation with error message
 */
function fail(context: MiddlewareContext, error: string): void {
  context.stopped = true;
  context.error = error;
}

const validateStroke: MiddlewarePlugin = (context) => {
  const { stroke } = context;

  // Check stroke exists
  if (!stroke) {
    return fail(context, 'No stroke provided');
  }

  // Validate required fields
  if (!stroke.id) {
    return fail(context, 'Stroke missing ID');
  }

  if (!stroke.tool) {
    return fail(context, 'Stroke missing tool type');
  }

  if (!stroke.points || !Array.isArray(stroke.points)) {
    return fail(context, 'Stroke missing points array');
  }

  // Validate minimum points
  if (stroke.points.length < CONSTRAINTS.MIN_POINTS) {
    return fail(context, `Stroke must have at least ${CONSTRAINTS.MIN_POINTS} points`);
  }

  // Validate each point
  for (const point of stroke.points) {
    if (typeof point.x !== 'number' || typeof point.y !== 'number') {
      return fail(context, 'Invalid point format');
    }

    if (point.x < CONSTRAINTS.MIN_COORDINATE || point.x > CONSTRAINTS.MAX_COORDINATE ||
        point.y < CONSTRAINTS.MIN_COORDINATE || point.y > CONSTRAINTS.MAX_COORDINATE) {
      console.warn(`[ValidatePlugin] Point coordinates out of bounds: ${point.x}, ${point.y}`);
      return fail(context, `Point coordinates must be between ${CONSTRAINTS.MIN_COORDINATE} and ${CONSTRAINTS.MAX_COORDINATE}`);
    }
  }

  // Validate optional fields
  if (stroke.color && !CONSTRAINTS.COLOR_REGEX.test(stroke.color)) {
    return fail(context, 'Invalid color format (must be hex: #RRGGBB)');
  }

  if (stroke.lineWidth && (stroke.lineWidth < CONSTRAINTS.MIN_LINE_WIDTH || stroke.lineWidth > CONSTRAINTS.MAX_LINE_WIDTH)) {
    return fail(context, `Line width must be between ${CONSTRAINTS.MIN_LINE_WIDTH} and ${CONSTRAINTS.MAX_LINE_WIDTH}`);
  }

  // Validation passed
  console.log(`[ValidatePlugin] Stroke ${stroke.id} validated successfully`);
};

export default validateStroke;
