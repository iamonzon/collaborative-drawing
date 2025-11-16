/**
 * ToolRegistry - Frontend plugin system for drawing tools
 *
 * This is TRUE plugin architecture:
 * - Tools register themselves
 * - Core canvas controller is tool-agnostic
 * - Can add new tools without touching core
 * - Runtime tool switching
 */

import BaseTool from '../tools/BaseTool.js';

type ToolConstructor = new () => BaseTool;

class ToolRegistry {
  private tools: Map<string, ToolConstructor>;
  private currentTool: BaseTool | null;

  constructor() {
    this.tools = new Map();
    this.currentTool = null;
  }

  /**
   * Register a new tool plugin
   * @param name - Tool name (e.g., 'pen', 'eraser')
   * @param ToolClass - Tool class extending BaseTool
   */
  register(name: string, ToolClass: ToolConstructor): void {
    this.tools.set(name, ToolClass);
    console.log(`[ToolRegistry] Registered tool: ${name}`);
  }

  /**
   * Get list of all registered tool names
   * @returns Tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if a tool is registered
   * @param name - Tool name
   * @returns True if tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Create an instance of a tool
   * @param name - Tool name
   * @returns Tool instance
   */
  use(name: string): BaseTool {
    const ToolClass = this.tools.get(name);
    if (!ToolClass) {
      throw new Error(`Tool not found: ${name}. Available tools: ${this.getToolNames().join(', ')}`);
    }

    if (this.currentTool && this.currentTool.constructor.name === ToolClass.name) {
      // Tool is already active, just return it
      return this.currentTool;
    }

    this.currentTool = new ToolClass();
    console.log(`[ToolRegistry] Switched to tool: ${name}`);
    return this.currentTool;
  }

  /**
   * Get the current active tool
   * @returns Current tool instance
   */
  getCurrentTool(): BaseTool | null {
    return this.currentTool;
  }

  /**
   * Get a tool instance for rendering (doesn't change current tool)
   * @param name - Tool name
   * @returns New tool instance
   */
  getToolForRendering(name: string): BaseTool {
    const ToolClass = this.tools.get(name);
    if (!ToolClass) {
      throw new Error(`Tool not found: ${name}. Available tools: ${this.getToolNames().join(', ')}`);
    }
    return new ToolClass();
  }

  /**
   * Get count of registered tools
   * @returns Number of tools
   */
  getToolCount(): number {
    return this.tools.size;
  }
}

export default ToolRegistry;
