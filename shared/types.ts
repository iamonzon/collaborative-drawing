/**
 * Shared type definitions and message formats
 * Used by both client and server
 */

/**
 * Socket.io message types for client-server communication
 * Use these constants for all socket.emit() and socket.on() calls
 */
export const MessageTypes = {
  // Client -> Server
  CREATE_SESSION: 'create_session',
  JOIN_SESSION: 'join_session',
  STROKE: 'stroke',
  SYNC_REQUEST: 'sync_request',
  CLEAR_CANVAS: 'clear_canvas',

  // Server -> Client
  SESSION_CREATED: 'session_created',
  SESSION_JOINED: 'session_joined',
  STROKE_BROADCAST: 'stroke_broadcast',
  SYNC_RESPONSE: 'sync_response',
  CLEAR_CANVAS_BROADCAST: 'clear_canvas_broadcast',
  ERROR: 'error',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left'
} as const;

export type MessageType = typeof MessageTypes[keyof typeof MessageTypes];

/**
 * Client-side Internal Application Events
 * Use these for internal application events (wsClient.emit/on, canvasController.emit/on)
 */
export const ClientEvents = {
  // WebSocketClient internal events
  STROKE: 'stroke',              // Stroke received from server
  CLEAR_CANVAS: 'clear_canvas',  // Clear canvas
  USER_JOINED: 'user_joined',    // User joined session
  USER_LEFT: 'user_left',        // User left session
  ERROR: 'error',                // Error from server
  STATE_CHANGE: 'state_change',  // Connection state changed

  // Tool events (from canvas tools)
  STROKE_COMPLETE: 'stroke:complete'  // Tool finished drawing stroke
} as const;

export type ClientEvent = typeof ClientEvents[keyof typeof ClientEvents];

/**
 * Socket.io native events (for reference only - use as strings)
 * These are built into socket.io and should NOT be replaced with constants
 */
export const SocketNativeEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  CONNECTION: 'connection'
} as const;

/**
 * Connection states for client
 */
export const ConnectionStates = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting'
} as const;

export type ConnectionState = typeof ConnectionStates[keyof typeof ConnectionStates];

/**
 * Point on canvas
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Stroke data structure
 */
export interface Stroke {
  id: string;              // UUID
  userId: string;          // User who drew it
  sessionId?: string;      // Session it belongs to
  serverTimestamp?: number; // Server-assigned timestamp (authoritative)
  tool: string;            // 'pen', 'eraser', etc.
  color?: string;          // Hex color code
  lineWidth?: number;      // Stroke width
  points: Point[];         // Stroke points
}

/**
 * Session data structure
 */
export interface Session {
  id: string;
  strokes: Stroke[];
  users: Set<string>;
  createdAt: number;
}

/**
 * Middleware context
 */
export interface MiddlewareContext {
  stroke?: Stroke;
  userId: string;
  sessionId: string;
  session?: Session;
  stopped: boolean;
  error?: string | null;
}

/**
 * Middleware plugin function type
 */
export type MiddlewarePlugin = (context: MiddlewareContext) => Promise<void> | void;

/**
 * Plugin configuration
 */
export interface PluginConfig {
  hook: string;
  plugin: string;
}

/**
 * Message payloads
 */
export interface CreateSessionMessage {
  sessionId?: string;
}

export interface JoinSessionMessage {
  sessionId: string;
}

export interface SyncRequestMessage {
  sessionId: string;
  lastKnownTimestamp?: number;
}

export interface ClearCanvasMessage {
  sessionId: string;
}

export interface SessionCreatedResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface SessionJoinedResponse {
  success: boolean;
  sessionId?: string;
  strokes?: Stroke[];
  error?: string;
}

export interface SyncResponse {
  success: boolean;
  strokes?: Stroke[];
  error?: string;
}

export interface ErrorMessage {
  error: string;
}

export interface UserJoinedMessage {
  userId: string;
}

export interface UserLeftMessage {
  userId: string;
}
