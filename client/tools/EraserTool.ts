/**
 * EraserTool - Eraser tool plugin
 *
 * Demonstrates: Another tool plugin extending BaseTool
 * Added without modifying CanvasController
 */

import BaseTool, { DrawContext } from './BaseTool.js';
import { Point, Stroke, ClientEvents } from '../../shared/types.js';

class EraserTool extends BaseTool {
  private lineWidth: number = 20; // Eraser is wider than pen

  /**
   * Set eraser width
   * @param width - Eraser width in pixels
   */
  setLineWidth(width: number): void {
    this.lineWidth = width;
  }

  /**
   * Start erasing
   */
  onMouseDown(point: Point, context: DrawContext): void {
    this.currentStroke = {
      id: this.generateId(),
      tool: 'eraser',
      lineWidth: this.lineWidth,
      points: [point],
      userId: '' // Will be set by server
    };
  }

  /**
   * Continue erasing
   */
  onMouseMove(point: Point, context: Partial<DrawContext>): void {
    if (!this.currentStroke || !context.ctx) return;

    this.currentStroke.points.push(point);

    // Erase immediately for smooth feedback
    const points = this.currentStroke.points;
    if (points.length >= 2) {
      const prevPoint = points[points.length - 2];
      context.ctx.globalCompositeOperation = 'destination-out';
      context.ctx.lineWidth = this.lineWidth;
      context.ctx.beginPath();
      context.ctx.moveTo(prevPoint.x, prevPoint.y);
      context.ctx.lineTo(point.x, point.y);
      context.ctx.stroke();
      context.ctx.globalCompositeOperation = 'source-over';
    }
  }

  /**
   * Complete erasing
   */
  onMouseUp(point: Point, context: DrawContext): void {
    if (!this.currentStroke) return;

    // Add final point only if it's different from the last point
    const points = this.currentStroke.points;
    const lastPoint = points[points.length - 1];
    if (!lastPoint || lastPoint.x !== point.x || lastPoint.y !== point.y) {
      this.currentStroke.points.push(point);
    }

    // Emit stroke:complete event (eraser strokes are also strokes!)
    context.emit(ClientEvents.STROKE_COMPLETE, this.currentStroke);

    // Clear current stroke
    this.currentStroke = null;
  }

  /**
   * Render eraser stroke (by erasing)
   */
  render(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
    if (!stroke.points || stroke.points.length < 2) return;

    // Save current composite operation
    const previousOperation = ctx.globalCompositeOperation;

    // Use destination-out to erase
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = stroke.lineWidth || 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    ctx.stroke();

    // Restore composite operation
    ctx.globalCompositeOperation = previousOperation;
  }
}

export default EraserTool;
