/**
 * HTTP Routes - Express routes configuration
 *
 * Responsibilities:
 * - Health check endpoint
 * - Static file serving
 */

import express, { Application } from 'express';
import path from 'path';
import MiddlewareManager from './core/MiddlewareManager.js';
import SessionStore from './core/SessionStore.js';

export function setupRoutes(
  app: Application,
  middleware: MiddlewareManager,
  sessionStore: SessionStore,
  dirname: string
): void {
  // Determine if we're running from source (tsx) or compiled (node dist/)
  const isCompiled = dirname.includes('/dist/server') || dirname.includes('\\dist\\server');
  const levelsUp = isCompiled ? '../..' : '..';

  // Serve static files from dist-client directory (compiled TypeScript)
  app.use(express.static(path.join(dirname, levelsUp, 'dist-client')));
  app.use(express.static(path.join(dirname, levelsUp, 'client'))); // For CSS and other static assets
  app.use('/shared', express.static(path.join(dirname, levelsUp, 'shared')));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      sessions: sessionStore.getSessionCount(),
      plugins: {
        'stroke:before': middleware.getPluginCount('stroke:before'),
        'stroke:after': middleware.getPluginCount('stroke:after'),
        'user:join': middleware.getPluginCount('user:join'),
        'session:create': middleware.getPluginCount('session:create')
      }
    });
  });

  // Serve index.html for root and session routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(dirname, levelsUp, 'client/index.html'));
  });
}
