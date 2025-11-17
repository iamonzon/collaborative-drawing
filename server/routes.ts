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

/**
 * Format uptime in human-readable format
 * @param seconds - Uptime in seconds
 * @returns Human-readable string (e.g., "2h 15m 30s")
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

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
    const now = new Date();
    const uptimeSeconds = process.uptime();
    const startTime = new Date(now.getTime() - uptimeSeconds * 1000);

    res.json({
      status: 'ok',
      start_time: startTime.toISOString(),
      current_time: now.toISOString(),
      uptime_seconds: Math.floor(uptimeSeconds),
      uptime_human: formatUptime(uptimeSeconds),
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
