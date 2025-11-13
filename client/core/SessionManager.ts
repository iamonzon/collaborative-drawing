/**
 * SessionManager - Manages session lifecycle
 *
 * Responsibilities:
 * - Create sessions
 * - Join sessions
 * - Handle URL-based session joining
 * - Track current session state
 */

import WebSocketClient from './WebSocketClient.js';
import CanvasController from './CanvasController.js';

class SessionManager {
  private wsClient: WebSocketClient;
  private canvasController: CanvasController;
  private currentSessionId: string | null;

  constructor(wsClient: WebSocketClient, canvasController: CanvasController) {
    this.wsClient = wsClient;
    this.canvasController = canvasController;
    this.currentSessionId = null;
  }

  /**
   * Create a new session
   */
  async createSession(sessionId: string | null = null): Promise<string> {
    const response = await this.wsClient.createSession(sessionId);
    this.currentSessionId = response.sessionId || null;

    console.log('[SessionManager] Session created:', this.currentSessionId);

    // Update URL
    if (this.currentSessionId) {
      window.history.pushState({}, '', `?session=${this.currentSessionId}`);
    }

    return this.currentSessionId || '';
  }

  /**
   * Join an existing session
   */
  async joinSession(sessionId: string): Promise<void> {
    const response = await this.wsClient.joinSession(sessionId);
    this.currentSessionId = sessionId;

    // Load existing strokes
    if (response.strokes && response.strokes.length > 0) {
      console.log('[SessionManager] Loading', response.strokes.length, 'existing strokes');
      this.canvasController.addStrokes(response.strokes);
    }

    console.log('[SessionManager] Joined session:', sessionId);

    // Update URL
    window.history.pushState({}, '', `?session=${sessionId}`);
  }

  /**
   * Check URL for session parameter and auto-join
   */
  checkURLForSession(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');

    if (sessionId) {
      console.log('[SessionManager] Session ID found in URL:', sessionId);
    }

    return sessionId;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
}

export default SessionManager;
