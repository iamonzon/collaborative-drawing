/**
 * SocketHandlers - WebSocket event handlers
 *
 * Responsibilities:
 * - Handle socket events (create, join, stroke, sync, disconnect)
 * - Execute middleware hooks
 * - Broadcast messages to clients
 */

import { Server as SocketServer, Socket } from 'socket.io';
import MiddlewareManager from '../core/MiddlewareManager.js';
import SessionStore from '../core/SessionStore.js';
import {
  MessageTypes,
  Stroke,
  CreateSessionMessage,
  JoinSessionMessage,
  SyncRequestMessage,
  SessionCreatedResponse,
  SessionJoinedResponse,
  SyncResponse,
  ErrorMessage,
  ClearCanvasMessage
} from '../../shared/types.js';

export function setupSocketHandlers(
  io: SocketServer,
  middleware: MiddlewareManager,
  sessionStore: SessionStore,
  generateSessionId: () => string
): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Server] Client connected: ${socket.id}`);

    let currentSession: string | null = null;
    const userId = socket.id;

    // CREATE SESSION
    socket.on(MessageTypes.CREATE_SESSION, async (data: CreateSessionMessage, callback: (response: SessionCreatedResponse) => void) => {
      const sessionId = data.sessionId || generateSessionId();

      try {
        const session = sessionStore.create(sessionId);

        // Execute session:create hooks
        const context = {
          sessionId,
          session,
          userId,
          stopped: false,
          error: null
        };
        await middleware.execute('session:create', context);

        currentSession = sessionId;
        socket.join(sessionId);
        sessionStore.addUser(sessionId, userId);

        callback({ success: true, sessionId });
        console.log(`[Server] Session created: ${sessionId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        callback({ success: false, error: errorMessage });
      }
    });

    // JOIN SESSION
    socket.on(MessageTypes.JOIN_SESSION, async (data: JoinSessionMessage, callback: (response: SessionJoinedResponse) => void) => {
      const { sessionId } = data;
      const session = sessionStore.get(sessionId);

      if (!session) {
        callback({ success: false, error: 'Session not found' });
        return;
      }

      try {
        currentSession = sessionId;
        socket.join(sessionId);
        sessionStore.addUser(sessionId, userId);

        // Execute user:join hooks
        const context = {
          sessionId,
          userId,
          session,
          stopped: false,
          error: null
        };
        await middleware.execute('user:join', context);

        // Send existing strokes to new user
        callback({
          success: true,
          sessionId,
          strokes: session.strokes
        });

        // Notify other users
        socket.to(sessionId).emit(MessageTypes.USER_JOINED, { userId });

        console.log(`[Server] User ${userId} joined session ${sessionId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        callback({ success: false, error: errorMessage });
      }
    });

    // STROKE (main drawing event)
    socket.on(MessageTypes.STROKE, async (data: Stroke) => {
      if (!currentSession) {
        const errorMsg: ErrorMessage = { error: 'Not in a session' };
        socket.emit(MessageTypes.ERROR, errorMsg);
        return;
      }

      const stroke: Stroke = {
        ...data,
        userId,
        sessionId: currentSession
      };

      // Execute stroke:before hooks (validation, rate limiting)
      const context = {
        stroke,
        userId,
        sessionId: currentSession,
        stopped: false,
        error: null
      };

      await middleware.execute('stroke:before', context);

      // If a plugin stopped the chain, send error to client
      if (context.stopped) {
        const errorMsg: ErrorMessage = {
          error: context.error || 'Stroke rejected by middleware'
        };
        socket.emit(MessageTypes.ERROR, errorMsg);
        return;
      }

      // Add stroke to session (assigns serverTimestamp)
      try {
        sessionStore.addStroke(currentSession, stroke);

        // Broadcast to ALL clients in session (including sender for timestamp sync)
        // Note: Sender needs serverTimestamp for correct ordering
        io.to(currentSession).emit(MessageTypes.STROKE_BROADCAST, stroke);

        // Execute stroke:after hooks (logging)
        await middleware.execute('stroke:after', context);
      } catch (error) {
        console.error('[Server] Error processing stroke:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorMsg: ErrorMessage = { error: errorMessage };
        socket.emit(MessageTypes.ERROR, errorMsg);
      }
    });

    // SYNC REQUEST (for reconnection)
    socket.on(MessageTypes.SYNC_REQUEST, (data: SyncRequestMessage, callback: (response: SyncResponse) => void) => {
      const { sessionId, lastKnownTimestamp = 0 } = data;

      const session = sessionStore.get(sessionId);
      if (!session) {
        callback({ success: false, error: 'Session not found' });
        return;
      }

      const strokes = sessionStore.getStrokesAfter(sessionId, lastKnownTimestamp);
      callback({ success: true, strokes });

      console.log(`[Server] Sync request for session ${sessionId}, returned ${strokes.length} strokes`);
    });

    socket.on(MessageTypes.CLEAR_CANVAS, (data: ClearCanvasMessage) => {
      const { sessionId } = data

      const session = sessionStore.get(sessionId);
      if (!session) {
        const errorMsg: ErrorMessage = {
          error: `Invalid session id [${sessionId}] for clear canvas request`
        };
        socket.emit(MessageTypes.ERROR, errorMsg);
        return;
      }

      if (!session.users.has(userId)) {
        const errorMsg: ErrorMessage = {
          error: `User [${userId}] is not in session [${sessionId}]`
        };
        socket.emit(MessageTypes.ERROR, errorMsg);
        return;
      }

      console.log(`[Server] Clear canvas request for session [${sessionId}]`)

      session.strokes = [] // Empty strokes to ensure persistence after refresh

      socket.to(sessionId).emit(MessageTypes.CLEAR_CANVAS_BROADCAST, { sessionId })
    })

    // DISCONNECT
    socket.on('disconnect', () => {
      if (currentSession) {
        sessionStore.removeUser(currentSession, userId);
        socket.to(currentSession).emit(MessageTypes.USER_LEFT, { userId });
        console.log(`[Server] User ${userId} disconnected from session ${currentSession}`);
      }
      console.log(`[Server] Client disconnected: ${socket.id}`);
    });
  });
}
