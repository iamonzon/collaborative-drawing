/**
 * Shared type definitions and message formats
 * Used by both client and server
 */

/**
 * Message types for client-server communication
 */
export const MessageTypes = {
  // Client -> Server
  CREATE_SESSION: 'create_session',
  JOIN_SESSION: 'join_session',
  STROKE: 'stroke',
  SYNC_REQUEST: 'sync_request',

  // Server -> Client
  SESSION_CREATED: 'session_created',
  SESSION_JOINED: 'session_joined',
  STROKE_BROADCAST: 'stroke_broadcast',
  SYNC_RESPONSE: 'sync_response',
  ERROR: 'error',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left'
} as const;

export type MessageType = typeof MessageTypes[keyof typeof MessageTypes];

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
