/**
 * Collaborative Paint Server - Entry point
 *
 * Responsibilities:
 * - Initialize server components
 * - Load plugins
 * - Start HTTP/WebSocket server
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import MiddlewareManager from './core/MiddlewareManager.js';
import SessionStore from './core/SessionStore.js';
import { setupRoutes } from './routes.js';
import { setupSocketHandlers } from './handlers/SocketHandlers.js';
import pluginConfig from './config/plugins.js';

// ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize core components
const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const middleware = new MiddlewareManager();
const sessionStore = new SessionStore();

// Set up HTTP routes
setupRoutes(app, middleware, sessionStore, __dirname);

// Load plugins
loadPlugins(middleware, pluginConfig);

// Set up WebSocket handlers
setupSocketHandlers(io, middleware, sessionStore, generateSessionId);

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);

// Add a small delay to ensure plugins are loaded
setTimeout(() => {
  httpServer.listen(PORT, () => {
    printServerInfo(PORT, middleware);
  });
}, 100);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

/**
 * Load plugin modules dynamically
 * Tries both .ts (development) and .js (production) extensions
 */
async function loadPlugins(middleware: MiddlewareManager, pluginConfig: any[]): Promise<void> {
  for (const { hook, plugin: pluginPath } of pluginConfig) {
    // Try loading with different extensions
    const extensions = ['.ts', '.js'];
    let loaded = false;

    for (const ext of extensions) {
      try {
        const fullPath = pluginPath + ext;
        const module = await import(fullPath);
        const pluginFn = module.default;
        middleware.use(hook as any, pluginFn);
        loaded = true;
        break;
      } catch (error) {
        // Continue trying other extensions
        continue;
      }
    }

    if (!loaded) {
      console.error(`[Server] Failed to load plugin ${pluginPath} with any extension`);
    }
  }
}

/**
 * Generate random session ID
 */
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Print server startup information
 */
function printServerInfo(port: number, middleware: MiddlewareManager): void {
  console.log(`\n🎨 Collaborative Paint Server (TypeScript)`);
  console.log(`📡 Server running on http://localhost:${port}`);
  console.log(`🔌 WebSocket ready`);
  console.log(`🔧 Plugins loaded:`);
  console.log(`   - stroke:before: ${middleware.getPluginCount('stroke:before')}`);
  console.log(`   - stroke:after: ${middleware.getPluginCount('stroke:after')}`);
  console.log(`   - user:join: ${middleware.getPluginCount('user:join')}`);
  console.log(`   - session:create: ${middleware.getPluginCount('session:create')}`);
  console.log();
}
