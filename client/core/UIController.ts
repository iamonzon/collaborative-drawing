/**
 * UIController - Manages all UI interactions and DOM manipulation
 *
 * Responsibilities:
 * - Tool selection UI
 * - Color picker
 * - Modal show/hide
 * - Status indicators
 * - Button click handlers
 */

import { ConnectionState, ConnectionStates } from '../../shared/types.js';

export interface UICallbacks {
  onToolSelect: (toolName: string) => void;
  onColorChange: (color: string) => void;
  onCreateSession: (sessionId: string | null) => void;
  onJoinSession: (sessionId: string) => void;
  onClearCanvas: () => void;
  onShareLink: () => void;
}

class UIController {
  private callbacks: UICallbacks;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  /**
   * Set up all UI event listeners
   */
  private setupEventListeners(): void {
    // Tool selection
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = (e.target as HTMLElement).dataset.tool;
        if (tool) {
          this.callbacks.onToolSelect(tool);
        }
      });
    });

    // Color picker
    const colorPicker = document.getElementById('color-picker') as HTMLInputElement;
    colorPicker?.addEventListener('change', (e) => {
      const color = (e.target as HTMLInputElement).value;
      this.callbacks.onColorChange(color);
    });

    // Session buttons
    document.getElementById('btn-create-session')?.addEventListener('click', () => {
      this.showModal('modal-create-session');
    });

    document.getElementById('btn-join-session')?.addEventListener('click', () => {
      this.showModal('modal-join-session');
    });

    document.getElementById('btn-share-link')?.addEventListener('click', () => {
      this.callbacks.onShareLink();
    });

    // Clear button
    document.getElementById('btn-clear')?.addEventListener('click', () => {
      this.callbacks.onClearCanvas();
    });

    // Create session modal
    document.getElementById('btn-confirm-create')?.addEventListener('click', () => {
      const input = document.getElementById('input-create-session') as HTMLInputElement;
      const sessionId = input?.value.trim() || null;
      this.callbacks.onCreateSession(sessionId);
      this.hideModal('modal-create-session');
    });

    document.getElementById('btn-cancel-create')?.addEventListener('click', () => {
      this.hideModal('modal-create-session');
    });

    // Join session modal
    document.getElementById('btn-confirm-join')?.addEventListener('click', () => {
      const input = document.getElementById('input-join-session') as HTMLInputElement;
      const sessionId = input?.value.trim();
      if (sessionId) {
        this.callbacks.onJoinSession(sessionId);
      }
    });

    document.getElementById('btn-cancel-join')?.addEventListener('click', () => {
      this.hideModal('modal-join-session');
    });

    // Share link modal
    document.getElementById('btn-copy-link')?.addEventListener('click', () => {
      const link = document.getElementById('share-link-text')?.textContent || '';
      navigator.clipboard.writeText(link).then(() => {
        alert('Link copied to clipboard!');
      });
    });

    document.getElementById('btn-close-share')?.addEventListener('click', () => {
      this.hideModal('modal-share-link');
    });
  }

  /**
   * Update active tool in UI
   */
  setActiveTool(toolName: string): void {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.tool === toolName);
    });
  }

  /**
   * Get current color from color picker
   */
  getColor(): string {
    const colorPicker = document.getElementById('color-picker') as HTMLInputElement;
    return colorPicker?.value || '#000000';
  }

  /**
   * Show a modal
   */
  showModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    modal?.classList.add('active');
  }

  /**
   * Hide a modal
   */
  hideModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    modal?.classList.remove('active');

    // Clear error messages
    const errorDiv = document.getElementById('join-error');
    if (errorDiv) {
      errorDiv.innerHTML = '';
    }
  }

  /**
   * Update connection status indicator
   */
  updateConnectionStatus(state: ConnectionState): void {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

    if (!dot || !text) return;

    switch (state) {
      case ConnectionStates.CONNECTED:
        dot.classList.add('connected');
        text.textContent = 'Connected';
        break;
      case ConnectionStates.CONNECTING:
        dot.classList.remove('connected');
        text.textContent = 'Connecting...';
        break;
      case ConnectionStates.DISCONNECTED:
        dot.classList.remove('connected');
        text.textContent = 'Disconnected';
        break;
      case ConnectionStates.RECONNECTING:
        dot.classList.remove('connected');
        text.textContent = 'Reconnecting...';
        break;
    }
  }

  /**
   * Update session info display
   */
  updateSessionInfo(sessionId: string | null): void {
    const info = document.getElementById('session-info');
    if (!info) return;

    if (sessionId) {
      info.textContent = `Session: ${sessionId}`;
    } else {
      info.textContent = 'No active session';
    }
  }

  /**
   * Enable share button
   */
  enableShareButton(): void {
    const btn = document.getElementById('btn-share-link') as HTMLButtonElement;
    if (btn) {
      btn.disabled = false;
    }
  }

  /**
   * Show share link modal with link
   */
  showShareLinkModal(sessionId: string): void {
    const link = `${window.location.origin}?session=${sessionId}`;
    const linkText = document.getElementById('share-link-text');
    if (linkText) {
      linkText.textContent = link;
    }
    this.showModal('modal-share-link');
  }

  /**
   * Show error message in join modal
   */
  showJoinError(message: string): void {
    const errorDiv = document.getElementById('join-error');
    if (errorDiv) {
      errorDiv.innerHTML = `<div class="error-message">${message}</div>`;
    }
  }

  /**
   * Show generic error alert
   */
  showError(message: string): void {
    alert(`Error: ${message}`);
  }
}

export default UIController;
