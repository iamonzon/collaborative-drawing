/**
 * PenTool - Drawing tool plugin
 *
 * Demonstrates: Tool plugin extending BaseTool
 * Can be added without modifying CanvasController
 */

import BaseTool, { DrawContext } from './BaseTool.js';
import { Point, Stroke } from '../../shared/types.js';

class PenTool extends BaseTool {
  private color: string = '#000000';
  private lineWidth: number = 2;

  /**
   * Set pen color
   * @param color - Hex color code
   */
  setColor(color: string): void {
    this.color = color;
  }

  /**
   * Set line width
   * @param width - Line width in pixels
   */
  setLineWidth(width: number): void {
    this.lineWidth = width;
  }

  /**
   * Start a new stroke
   */
  onMouseDown(point: Point, context: DrawContext): void {
    this.currentStroke = {
      id: this.generateId(),
      tool: 'pen',
      color: this.color,
      lineWidth: this.lineWidth,
      points: [point],
      userId: '' // Will be set by server
    };
  }

  /**
   * Add point to current stroke
   */
  onMouseMove(point: Point, context: Partial<DrawContext>): void {
    if (!this.currentStroke || !context.ctx) return;

    this.currentStroke.points.push(point);

    // Draw line segment immediately for smooth feedback
    const points = this.currentStroke.points;
    if (points.length >= 2) {
      const prevPoint = points[points.length - 2];
      context.ctx.strokeStyle = this.color;
      context.ctx.lineWidth = this.lineWidth;
      context.ctx.beginPath();
      context.ctx.moveTo(prevPoint.x, prevPoint.y);
      context.ctx.lineTo(point.x, point.y);
      context.ctx.stroke();
    }
  }

  /**
   * Complete stroke and emit event
   */
  onMouseUp(point: Point, context: DrawContext): void {
    if (!this.currentStroke) return;

    // Add final point only if it's different from the last point
    const points = this.currentStroke.points;
    const lastPoint = points[points.length - 1];
    if (!lastPoint || lastPoint.x !== point.x || lastPoint.y !== point.y) {
      this.currentStroke.points.push(point);
    }

    // Emit stroke:complete event
    context.emit('stroke:complete', this.currentStroke);

    // Clear current stroke
    this.currentStroke = null;
  }

  /**
   * Render a completed stroke
   */
  render(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
    if (!stroke.points || stroke.points.length < 2) return;

    ctx.strokeStyle = stroke.color || '#000000';
    ctx.lineWidth = stroke.lineWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    ctx.stroke();
  }
}

export default PenTool;
