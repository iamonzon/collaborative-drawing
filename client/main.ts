/**
 * Main Application - Thin orchestrator
 *
 * Responsibilities:
 * - Initialize core components
 * - Register tool plugins
 * - Wire up components together
 * - Delegate to specialized controllers
 */

import ToolRegistry from './core/ToolRegistry.js';
import CanvasController from './core/CanvasController.js';
import WebSocketClient from './core/WebSocketClient.js';
import UIController, { UICallbacks } from './core/UIController.js';
import SessionManager from './core/SessionManager.js';
import PenTool from './tools/PenTool.js';
import EraserTool from './tools/EraserTool.js';
import { Stroke } from '../shared/types.js';

class App {
  private toolRegistry: ToolRegistry;
  private canvasController: CanvasController;
  private wsClient: WebSocketClient;
  private uiController: UIController;
  private sessionManager: SessionManager;
  private currentTool: string | null;

  constructor() {
    // Initialize core components
    this.toolRegistry = new ToolRegistry();

    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    this.canvasController = new CanvasController(canvas, this.toolRegistry);
    this.wsClient = new WebSocketClient(window.location.origin);
    this.sessionManager = new SessionManager(this.wsClient, this.canvasController);

    // Initialize UI controller with callbacks
    this.uiController = new UIController(this.createUICallbacks());

    this.currentTool = null;

    // Register tool plugins
    this.registerTools();

    // Connect to server
    this.wsClient.connect();

    // Set up WebSocket handlers
    this.setupWebSocketHandlers();

    // Set up canvas handlers
    this.setupCanvasHandlers();

    // Check for session in URL and auto-join
    this.handleURLSession();
  }

  /**
   * Register all tool plugins
   *
   * PLUGIN ARCHITECTURE: Adding a new tool requires only:
   * 1. Create tool file extending BaseTool
   * 2. Import it
   * 3. Add one line: this.toolRegistry.register('toolname', ToolClass)
   */
  private registerTools(): void {
    this.toolRegistry.register('pen', PenTool);
    this.toolRegistry.register('eraser', EraserTool);

    // Set default tool
    this.selectTool('pen');

    console.log('[App] Registered tools:', this.toolRegistry.getToolNames());
  }

  /**
   * Create UI callback handlers
   */
  private createUICallbacks(): UICallbacks {
    return {
      onToolSelect: (toolName: string) => this.selectTool(toolName),
      onColorChange: (color: string) => this.handleColorChange(color),
      onCreateSession: (sessionId: string | null) => this.handleCreateSession(sessionId),
      onJoinSession: (sessionId: string) => this.handleJoinSession(sessionId),
      onClearCanvas: () => this.canvasController.clear(),
      onShareLink: () => this.handleShareLink()
    };
  }

  /**
   * Select a drawing tool
   */
  private selectTool(toolName: string): void {
    if (!this.toolRegistry.hasTool(toolName)) {
      console.error('[App] Tool not found:', toolName);
      return;
    }

    this.toolRegistry.use(toolName);
    this.currentTool = toolName;
    this.uiController.setActiveTool(toolName);

    // Apply color to pen tool
    if (toolName === 'pen') {
      const color = this.uiController.getColor();
      const tool = this.toolRegistry.getCurrentTool();
      if (tool && 'setColor' in tool) {
        (tool as any).setColor(color);
      }
    }

    console.log('[App] Selected tool:', toolName);
  }

  /**
   * Handle color change
   */
  private handleColorChange(color: string): void {
    const tool = this.toolRegistry.getCurrentTool();
    if (tool && 'setColor' in tool) {
      (tool as any).setColor(color);
    }
  }

  /**
   * Handle create session
   */
  private async handleCreateSession(sessionId: string | null): Promise<void> {
    try {
      const createdSessionId = await this.sessionManager.createSession(sessionId);
      this.uiController.updateSessionInfo(createdSessionId);
      this.uiController.enableShareButton();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.uiController.showError('Failed to create session: ' + message);
    }
  }

  /**
   * Handle join session
   */
  private async handleJoinSession(sessionId: string): Promise<void> {
    try {
      await this.sessionManager.joinSession(sessionId);
      this.uiController.updateSessionInfo(sessionId);
      this.uiController.enableShareButton();
      this.uiController.hideModal('modal-join-session');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.uiController.showJoinError(message);
    }
  }

  /**
   * Handle share link
   */
  private handleShareLink(): void {
    const sessionId = this.sessionManager.getCurrentSessionId();
    if (sessionId) {
      this.uiController.showShareLinkModal(sessionId);
    }
  }

  /**
   * Handle URL-based session joining
   */
  private handleURLSession(): void {
    const sessionId = this.sessionManager.checkURLForSession();
    if (sessionId) {
      // Wait for connection before joining
      setTimeout(() => {
        this.handleJoinSession(sessionId);
      }, 1000);
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    // Connection state changes
    this.wsClient.on('state_change', ({ newState }) => {
      this.uiController.updateConnectionStatus(newState);
    });

    // Incoming strokes
    this.wsClient.on('stroke', (stroke: Stroke) => {
      console.log('[App] Received stroke from server:', stroke.id);
      this.canvasController.addStroke(stroke);
    });

    // User events
    this.wsClient.on('user_joined', ({ userId }) => {
      console.log('[App] User joined:', userId);
    });

    this.wsClient.on('user_left', ({ userId }) => {
      console.log('[App] User left:', userId);
    });

    // Errors
    this.wsClient.on('error', ({ error }) => {
      console.error('[App] Server error:', error);
      this.uiController.showError(error);
    });
  }

  /**
   * Set up canvas event handlers
   */
  private setupCanvasHandlers(): void {
    // Listen for completed strokes from tools
    this.canvasController.on('stroke:complete', (stroke: Stroke) => {
      console.log('[App] Stroke completed:', stroke.id);
      this.wsClient.sendStroke(stroke);
    });
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new App();
  });
} else {
  new App();
}

console.log('[App] Collaborative Paint initialized (TypeScript)');
