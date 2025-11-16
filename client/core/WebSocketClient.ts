/**
 * WebSocketClient - Handles client-server communication
 *
 * Features:
 * - Automatic reconnection
 * - Offline stroke queueing
 * - Sync on reconnect
 */

import {
  MessageTypes,
  ClientEvents,
  ConnectionStates,
  ConnectionState,
  Stroke,
  SessionCreatedResponse,
  SessionJoinedResponse,
  SyncResponse,
  UserJoinedMessage,
  UserLeftMessage,
  ErrorMessage,
  ClearCanvasMessage
} from '../../shared/types.js';

// Socket.io client types (loaded from CDN)
declare const io: any;

type EventHandler = (data: any) => void;

class WebSocketClient {
  private serverUrl: string;
  private socket: any | null;
  private state: ConnectionState;
  private eventHandlers: Map<string, EventHandler[]>;
  private offlineQueue: Stroke[];
  private lastKnownTimestamp: number;
  private currentSession: string | null;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.state = ConnectionStates.DISCONNECTED;
    this.eventHandlers = new Map();
    this.offlineQueue = [];
    this.lastKnownTimestamp = 0;
    this.currentSession = null;
  }

  /**
   * Connect to server
   */
  connect(): void {
    if (this.state === ConnectionStates.CONNECTED || this.state === ConnectionStates.CONNECTING) {
      return;
    }

    this.setState(ConnectionStates.CONNECTING);
    console.log('[WebSocketClient] Connecting to server...');

    // Socket.io client is loaded from CDN in HTML
    this.socket = io(this.serverUrl);

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocketClient] Connected');
      this.setState(ConnectionStates.CONNECTED);
      this.handleReconnection();
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocketClient] Disconnected');
      this.setState(ConnectionStates.DISCONNECTED);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[WebSocketClient] Connection error:', error.message);
      this.setState(ConnectionStates.DISCONNECTED);
    });

    // Message handlers
    this.socket.on(MessageTypes.STROKE_BROADCAST, (data: Stroke) => {
      this.lastKnownTimestamp = data.serverTimestamp || Date.now();
      this.emit(ClientEvents.STROKE, data);
    });

    this.socket.on(MessageTypes.CLEAR_CANVAS_BROADCAST, (data: ClearCanvasMessage) => {
      console.log(`[WebSocketClient] Clear canvas broadcast received for [${data.sessionId}]`)
      this.emit(ClientEvents.CLEAR_CANVAS, (data))
    })

    this.socket.on(MessageTypes.USER_JOINED, (data: UserJoinedMessage) => {
      this.emit(ClientEvents.USER_JOINED, data);
    });

    this.socket.on(MessageTypes.USER_LEFT, (data: UserLeftMessage) => {
      this.emit(ClientEvents.USER_LEFT, data);
    });

    this.socket.on(MessageTypes.ERROR, (data: ErrorMessage) => {
      console.error('[WebSocketClient] Server error:', data.error);
      this.emit(ClientEvents.ERROR, data);
    });
  }

  /**
   * Create a new session
   * @param sessionId - Optional session ID
   * @returns Result
   */
  createSession(sessionId: string | null = null): Promise<SessionCreatedResponse> {
    return new Promise((resolve, reject) => {
      this.socket.emit(MessageTypes.CREATE_SESSION, { sessionId }, (response: SessionCreatedResponse) => {
        if (response.success && response.sessionId) {
          this.currentSession = response.sessionId;
          this.lastKnownTimestamp = Date.now();
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to create session'));
        }
      });
    });
  }

  /**
   * Join an existing session
   * @param sessionId - Session ID
   * @returns Result with existing strokes
   */
  joinSession(sessionId: string): Promise<SessionJoinedResponse> {
    return new Promise((resolve, reject) => {
      this.socket.emit(MessageTypes.JOIN_SESSION, { sessionId }, (response: SessionJoinedResponse) => {
        if (response.success) {
          this.currentSession = sessionId;
          this.lastKnownTimestamp = Date.now();
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to join session'));
        }
      });
    });
  }

  /**
   * Send a stroke to the server
   * @param stroke - Stroke data
   */
  sendStroke(stroke: Stroke): void {
    if (this.state !== ConnectionStates.CONNECTED) {
      // Queue stroke for later if disconnected
      console.log('[WebSocketClient] Offline - queueing stroke');
      this.offlineQueue.push(stroke);
      return;
    }

    this.socket.emit(MessageTypes.STROKE, stroke);
  }

  clearCanvas(sessionId: string): void {
    this.socket.emit(MessageTypes.CLEAR_CANVAS, { sessionId })
  }

  /**
   * Request sync (get strokes since last known timestamp)
   * @returns Strokes
   */
  requestSync(): Promise<Stroke[]> {
    if (!this.currentSession) {
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      this.socket.emit(
        MessageTypes.SYNC_REQUEST,
        {
          sessionId: this.currentSession,
          lastKnownTimestamp: this.lastKnownTimestamp
        },
        (response: SyncResponse) => {
          if (response.success && response.strokes) {
            resolve(response.strokes);
          } else {
            reject(new Error(response.error || 'Sync failed'));
          }
        }
      );
    });
  }

  /**
   * Handle reconnection logic
   */
  async handleReconnection(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    console.log('[WebSocketClient] Handling reconnection...');

    // Rejoin session
    try {
      const response = await this.joinSession(this.currentSession);
      console.log('[WebSocketClient] Rejoined session');

      // Request sync for missed strokes
      const missedStrokes = await this.requestSync();
      if (missedStrokes.length > 0) {
        console.log(`[WebSocketClient] Received ${missedStrokes.length} missed strokes`);
        missedStrokes.forEach(stroke => this.emit(ClientEvents.STROKE, stroke));
      }

      // Send queued strokes
      if (this.offlineQueue.length > 0) {
        console.log(`[WebSocketClient] Sending ${this.offlineQueue.length} queued strokes`);
        this.offlineQueue.forEach(stroke => this.sendStroke(stroke));
        this.offlineQueue = [];
      }
    } catch (error) {
      console.error('[WebSocketClient] Reconnection failed:', error);
    }
  }

  /**
   * Register event handler
   * @param event - Event name
   * @param handler - Event handler function
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Emit event to registered handlers
   * @param event - Event name
   * @param data - Event data
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * Set connection state and notify listeners
   * @param newState - New connection state
   */
  private setState(newState: ConnectionState): void {
    const oldState = this.state;
    this.state = newState;
    this.emit(ClientEvents.STATE_CHANGE, { oldState, newState });
  }

  /**
   * Get current connection state
   * @returns Connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.setState(ConnectionStates.DISCONNECTED);
    }
  }
}

export default WebSocketClient;
