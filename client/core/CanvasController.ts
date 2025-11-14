/**
 * CanvasController - Tool-agnostic canvas management
 *
 * Key architectural point:
 * - This controller doesn't know about specific tools (pen, eraser, etc.)
 * - It delegates all drawing logic to the current tool from ToolRegistry
 * - This enables the plugin architecture for tools
 */

import ToolRegistry from './ToolRegistry.js';
import { Stroke, Point } from '../../shared/types.js';

class CanvasController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private toolRegistry: ToolRegistry;
  private isDrawing: boolean;
  private strokes: Stroke[]; // All strokes in the session
  private currentStroke: Stroke | null;

  constructor(canvas: HTMLCanvasElement, toolRegistry: ToolRegistry) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2d context');
    }
    this.ctx = ctx;
    this.toolRegistry = toolRegistry;
    this.isDrawing = false;
    this.strokes = [];
    this.currentStroke = null;

    // Set up canvas
    this.setupCanvas();
    this.attachEventListeners();
  }

  /**
   * Setup canvas size and properties
   */
  private setupCanvas(): void {
    // Make canvas fill its container
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Set canvas properties
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * Resize canvas to fill container
   */
  private resizeCanvas(): void {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // Redraw all strokes after resize
    this.redrawCanvas();
  }

  /**
   * Attach mouse event listeners
   */
  private attachEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Touch support for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });
  }

  /**
   * Get mouse position relative to canvas
   */
  private getMousePos(event: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  /**
   * Mouse down handler - delegates to current tool
   */
  private handleMouseDown(event: MouseEvent): void {
    const tool = this.toolRegistry.getCurrentTool();
    if (!tool) {
      console.warn('[CanvasController] No tool selected');
      return;
    }

    this.isDrawing = true;
    const point = this.getMousePos(event);

    // Delegate to tool
    const context = {
      ctx: this.ctx,
      canvas: this.canvas,
      emit: (event: string, data: any) => this.emit(event, data)
    };

    tool.onMouseDown(point, context);
    this.currentStroke = tool.getCurrentStroke();
  }

  /**
   * Mouse move handler - delegates to current tool
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDrawing) return;

    const tool = this.toolRegistry.getCurrentTool();
    if (!tool) return;

    const point = this.getMousePos(event);

    const context = {
      ctx: this.ctx,
      canvas: this.canvas
    };

    // Tool handles incremental drawing in onMouseMove
    tool.onMouseMove(point, context);
  }

  /**
   * Mouse up handler - delegates to current tool
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isDrawing) return;

    const tool = this.toolRegistry.getCurrentTool();
    if (!tool) return;

    this.isDrawing = false;
    const point = this.getMousePos(event);

    const context = {
      ctx: this.ctx,
      canvas: this.canvas,
      emit: (event: string, data: any) => this.emit(event, data)
    };

    tool.onMouseUp(point, context);
    this.currentStroke = null;
  }

  /**
   * Mouse leave handler
   */
  private handleMouseLeave(event: MouseEvent): void {
    if (this.isDrawing) {
      this.handleMouseUp(event);
    }
  }

  /**
   * Add a stroke from remote user and render it
   */
  addStroke(stroke: Stroke): void {
    // Deduplicate strokes by ID
    if (this.strokes.some(s => s.id === stroke.id)) {
      return;
    }

    this.strokes.push(stroke);

    // Sort by server timestamp for correct ordering
    this.strokes.sort((a, b) => (a.serverTimestamp || 0) - (b.serverTimestamp || 0));

    this.redrawCanvas();
  }

  /**
   * Add multiple strokes (for sync)
   */
  addStrokes(strokes: Stroke[]): void {
    strokes.forEach(stroke => this.addStroke(stroke));
  }

  /**
   * Redraw entire canvas
   */
  redrawCanvas(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render all strokes using their respective tools
    for (const stroke of this.strokes) {
      // Get the tool that created this stroke
      const toolName = stroke.tool;
      if (this.toolRegistry.hasTool(toolName)) {
        // Create a temporary instance to render
        const tool = this.toolRegistry.use(toolName);
        tool.render(this.ctx, stroke);

        // Restore the current tool
        // Note: This is a simplification; in production you'd want better tool state management
      }
    }
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.strokes = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Event emitter for custom events
   */
  private emit(event: string, data: any): void {
    const customEvent = new CustomEvent(event, { detail: data });
    this.canvas.dispatchEvent(customEvent);
  }

  /**
   * Listen to custom events
   */
  on(event: string, handler: (data: any) => void): void {
    this.canvas.addEventListener(event, (e: Event) => {
      const customEvent = e as CustomEvent;
      handler(customEvent.detail);
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    window.removeEventListener('resize', () => this.resizeCanvas());
  }
}

export default CanvasController;
