/**
 * MiddlewareManager - Core hook system for plugin architecture
 *
 * Provides extension points where multiple plugins can attach without knowing about each other.
 * This is TRUE plugin architecture - not just swappable implementations.
 */

import { MiddlewarePlugin, MiddlewareContext } from '../../shared/types.js';

type HookName = 'stroke:before' | 'stroke:after' | 'user:join' | 'session:create';

class MiddlewareManager {
  private hooks: Record<HookName, MiddlewarePlugin[]>;

  constructor() {
    // Define available hooks that plugins can attach to
    this.hooks = {
      'stroke:before': [],   // Before broadcasting stroke (validation, rate limiting)
      'stroke:after': [],    // After broadcasting stroke (logging, webhooks)
      'user:join': [],       // When user connects (notifications, analytics)
      'session:create': []   // When session created (integrations, setup)
    };
  }

  /**
   * Register a plugin function to a specific hook
   * @param hook - Hook name
   * @param pluginFn - Plugin function to execute
   */
  use(hook: HookName, pluginFn: MiddlewarePlugin): void {
    if (!this.hooks[hook]) {
      throw new Error(`Invalid hook: ${hook}. Available hooks: ${Object.keys(this.hooks).join(', ')}`);
    }
    this.hooks[hook].push(pluginFn);
    console.log(`[MiddlewareManager] Registered plugin for hook: ${hook}`);
  }

  /**
   * Execute all plugins attached to a hook in sequence
   * @param hook - Hook name to execute
   * @param context - Context object passed to all plugins
   * @returns Modified context
   */
  async execute(hook: HookName, context: MiddlewareContext): Promise<MiddlewareContext> {
    if (!this.hooks[hook]) {
      throw new Error(`Invalid hook: ${hook}`);
    }

    // Execute plugins in sequence (they can modify context)
    for (const plugin of this.hooks[hook]) {
      try {
        await plugin(context);

        // If a plugin sets stopped=true, break the chain
        if (context.stopped) {
          console.log(`[MiddlewareManager] Hook ${hook} stopped by plugin`);
          break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[MiddlewareManager] Error in hook ${hook}:`, errorMessage);
        context.error = errorMessage;
        context.stopped = true;
        break;
      }
    }

    return context;
  }

  /**
   * Get the number of plugins registered for a hook
   * @param hook - Hook name
   * @returns Number of plugins
   */
  getPluginCount(hook: HookName): number {
    return this.hooks[hook]?.length || 0;
  }

}

export default MiddlewareManager;
