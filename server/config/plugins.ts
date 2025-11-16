/**
 * Plugin Configuration
 *
 * Adding a new plugin requires:
 * 1. Create the plugin file in server/plugins/
 * 2. Add ONE LINE to this config
 * 3. Restart server
 * 4. Done! Core code unchanged.
 */

import { PluginConfig } from '../../shared/types.js';

const pluginConfig: PluginConfig[] = [
  // stroke:before hooks - Execute BEFORE broadcasting (validation, filtering)
  {
    hook: 'stroke:before',
    plugin: './plugins/validateStroke'
  },
  {
    hook: 'stroke:before',
    plugin: './plugins/rateLimitCheck'
  },

  // stroke:after hooks - Execute AFTER broadcasting (logging, notifications)
  {
    hook: 'stroke:after',
    plugin: './plugins/logStroke'
  },

  // To add a new plugin:
  // 1. Create server/plugins/myNewPlugin.ts
  // 2. Add: { hook: 'stroke:after', plugin: './plugins/myNewPlugin' }
  // 3. Restart server
  // 4. Done!

  // Available hooks:
  // - 'stroke:before'   → Before broadcasting stroke
  // - 'stroke:after'    → After broadcasting stroke
  // - 'user:join'       → When user connects
  // - 'session:create'  → When session created
];

export default pluginConfig;
