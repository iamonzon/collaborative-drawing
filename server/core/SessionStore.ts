/**
 * SessionStore - In-memory session management
 *
 * NOTE: This is NOT a plugin - it's core infrastructure.
 * In production, this could be backed by Redis, but the interface would stay the same.
 */

import { Session, Stroke } from '../../shared/types.js';

class SessionStore {
  private sessions: Map<string, Session>;

  constructor() {
    this.sessions = new Map();
  }

  /**
   * Create a new session
   * @param sessionId - Unique session identifier
   * @param createdBy - User ID of session creator
   * @returns Created session
   * @throws Error if session already exists
   */
  create(sessionId: string, createdBy?: string): Session {
    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session already exists: ${sessionId}`);
    }

    const now = Date.now();
    const session: Session = {
      id: sessionId,
      strokes: [],
      users: new Set<string>(),
      createdAt: now,
      createdBy,
      lastActivity: now
    };

    this.sessions.set(sessionId, session);
    console.log(`[SessionStore] Created session: ${sessionId} by ${createdBy || 'unknown'}`);
    return session;
  }

  /**
   * Check if a session exists
   * @param sessionId - Session identifier
   * @returns True if session exists
   */
  exists(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Get a session by ID
   * @param sessionId - Session identifier
   * @returns Session or null if not found
   */
  get(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Add a stroke to a session
   * @param sessionId - Session identifier
   * @param stroke - Stroke object with serverTimestamp
   */
  addStroke(sessionId: string, stroke: Stroke): void {
    const session = this.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Add server timestamp for authoritative ordering
    const now = Date.now();
    stroke.serverTimestamp = now;
    session.strokes.push(stroke);
    session.lastActivity = now;  // Update last activity

    console.log(`[SessionStore] Added stroke to session ${sessionId}, total: ${session.strokes.length}`);
  }

  /**
   * Get all strokes after a given timestamp (for reconnection)
   * @param sessionId - Session identifier
   * @param timestamp - Timestamp to get strokes after
   * @returns Strokes after timestamp
   */
  getStrokesAfter(sessionId: string, timestamp: number): Stroke[] {
    const session = this.get(sessionId);
    if (!session) {
      return [];
    }

    return session.strokes.filter(s => (s.serverTimestamp || 0) > timestamp);
  }

  /**
   * Add a user to a session
   * @param sessionId - Session identifier
   * @param userId - User identifier
   */
  addUser(sessionId: string, userId: string): void {
    const session = this.get(sessionId);
    if (session) {
      session.users.add(userId);
      console.log(`[SessionStore] User ${userId} joined session ${sessionId}, total users: ${session.users.size}`);
    }
  }

  /**
   * Remove a user from a session
   * @param sessionId - Session identifier
   * @param userId - User identifier
   */
  removeUser(sessionId: string, userId: string): void {
    const session = this.get(sessionId);
    if (session) {
      session.users.delete(userId);
      console.log(`[SessionStore] User ${userId} left session ${sessionId}, remaining users: ${session.users.size}`);
    }
  }

  /**
   * Delete a session (cleanup)
   * @param sessionId - Session identifier
   */
  delete(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      console.log(`[SessionStore] Deleted session: ${sessionId}`);
    }
    return deleted;
  }

  /**
   * Get all session IDs
   * @returns Array of session IDs
   */
  getAllSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get total number of sessions
   * @returns Session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get all sessions with metadata
   * @returns Array of session details
   */
  getAllSessionDetails() {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      created_by: session.createdBy || 'unknown',
      created_at: new Date(session.createdAt).toISOString(),
      last_activity: session.lastActivity ? new Date(session.lastActivity).toISOString() : null,
      stroke_count: session.strokes.length,
      user_count: session.users.size,
      active_users: Array.from(session.users)
    }));
  }
}

export default SessionStore;
