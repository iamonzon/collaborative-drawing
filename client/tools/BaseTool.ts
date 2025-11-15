/**
 * BaseTool - Interface for all drawing tool plugins
 *
 * This defines the contract that all tools must implement.
 * Tools are TRUE plugins - they extend this base without modifying core.
 */

import { Point, Stroke } from '../../shared/types.js';

export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  emit: (event: string, data: any) => void;
}

abstract class BaseTool {
  protected currentStroke: Stroke | null = null;

  /**
   * Called when mouse/touch down begins a stroke
   * @param point - {x, y} coordinates
   * @param context - {ctx, canvas, emit}
   */
  abstract onMouseDown(point: Point, context: DrawContext): void;

  /**
   * Called when mouse/touch moves during a stroke
   * @param point - {x, y} coordinates
   * @param context - {ctx, canvas}
   */
  abstract onMouseMove(point: Point, context: Partial<DrawContext>): void;

  /**
   * Called when mouse/touch up ends a stroke
   * @param point - {x, y} coordinates
   * @param context - {ctx, canvas, emit}
   */
  abstract onMouseUp(point: Point, context: DrawContext): void;

  /**
   * Render a completed stroke on the canvas
   * @param ctx - Canvas context
   * @param stroke - Stroke data
   */
  abstract render(ctx: CanvasRenderingContext2D, stroke: Stroke): void;

  /**
   * Get the current stroke being drawn
   * @returns Current stroke
   */
  getCurrentStroke(): Stroke | null {
    return this.currentStroke;
  }

  /**
   * Generate a unique ID for a stroke
   * @returns UUID
   */
  protected generateId(): string {
    return crypto.randomUUID();
  }
}

export default BaseTool;
