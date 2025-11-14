# Collaborative Paint

> Real-time collaborative drawing demonstrating **plugin-oriented architecture** and **screaming architecture principles**

**Tech Stack:** TypeScript, Socket.io, Express, Vanilla Canvas API

---

## 🎯 What This Project Demonstrates

This isn't just a drawing app—it's an **architectural showcase**:

1. **✅ TRUE Plugin Architecture** - Extension points where multiple independent modules compose
2. **✅ Screaming Architecture** - File names immediately tell you what they do
3. **✅ Single Responsibility** - Each module has ONE clear purpose
4. **✅ TypeScript** - Strong typing makes plugin contracts explicit
5. **❌ NOT Just** - Swappable implementations (Strategy Pattern / Dependency Injection)

### The Key Distinction

```typescript
// ❌ This is NOT plugin architecture (it's Strategy Pattern)
const storage = useRedis ? new RedisStorage() : new MemoryStorage();

// ✅ This IS plugin architecture (composable hooks)
middleware.use('stroke:before', validateStroke);    // Plugin 1
middleware.use('stroke:before', rateLimitCheck);    // Plugin 2
middleware.use('stroke:after', logStroke);          // Plugin 3
// Multiple plugins compose without knowing about each other
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start

# Open browser
open http://localhost:3000
```

**Usage:**
1. Click "Create Session" to start a new drawing session
2. Share the session link with others to collaborate
3. Draw in real-time with multiple users
4. Try switching tools (Pen/Eraser) and colors

---

## 🏗️ Architecture Overview - Screaming at You!

### Project Structure (Self-Documenting)

```
collaborative-drawing/
├── server/
│   ├── index.ts                    # 🎬 Server entry point (~100 lines)
│   ├── routes.ts                   # 🛣️  HTTP routes
│   ├── core/
│   │   ├── MiddlewareManager.ts    # ⭐ Hook system (plugin architecture)
│   │   └── SessionStore.ts         # 💾 Session state management
│   ├── handlers/
│   │   └── SocketHandlers.ts       # 🔌 WebSocket event handlers
│   ├── plugins/                    # ⭐ TRUE PLUGINS
│   │   ├── validateStroke.ts       # ✅ Validation middleware
│   │   ├── rateLimitCheck.ts       # 🚦 Rate limiting middleware
│   │   ├── logStroke.ts            # 📝 Logging middleware
│   │   └── webhookNotify.ts        # 🪝 Webhook integration
│   └── config/
│       └── plugins.ts              # ⚙️  Plugin configuration
│
├── client/
│   ├── index.html                  # 🎨 UI
│   ├── main.ts                     # 🎬 App orchestrator (~230 lines)
│   ├── core/
│   │   ├── ToolRegistry.ts         # ⭐ Tool plugin system
│   │   ├── CanvasController.ts     # 🖼️  Tool-agnostic canvas
│   │   ├── WebSocketClient.ts      # 🔌 Connection management
│   │   ├── UIController.ts         # 🎛️  UI interactions
│   │   └── SessionManager.ts       # 🎫 Session lifecycle
│   └── tools/                      # ⭐ TRUE PLUGINS
│       ├── BaseTool.ts             # 🔧 Tool interface
│       ├── PenTool.ts              # ✏️  Pen tool plugin
│       └── EraserTool.ts           # 🧹 Eraser tool plugin
│
└── shared/
    └── types.ts                    # 📐 TypeScript types
```

**Key Observations:**
- **Screaming Architecture**: File names tell you EXACTLY what they do
- **Small Files**: Largest file is 230 lines (was 409!)
- **Clear Separation**: Plugins vs Core vs Handlers
- **Single Responsibility**: Each file has ONE job

---

## 🔌 Two Plugin Systems (Fullstack)

### 1. Backend: Middleware Hook System

**Extension Points:**
- `stroke:before` - Before broadcasting (validation, rate limiting)
- `stroke:after` - After broadcasting (logging, webhooks)
- `user:join` - When user connects
- `session:create` - When session created

**Current Plugins:**
- ✅ `validateStroke` - Validates stroke data
- ✅ `rateLimitCheck` - Prevents spam/abuse
- ✅ `logStroke` - Logs for analytics
- ✅ `webhookNotify` - External notifications (optional)

**Why This Works:**
- Multiple plugins can attach to same hook
- Plugins execute in sequence (composable)
- Adding webhook plugin = new file + config line
- Core broadcast logic never changes

### 2. Frontend: Tool Registry System

**Extension Point:**
- Tools register themselves via `ToolRegistry`
- Canvas controller is tool-agnostic
- Tools extend `BaseTool` interface

**Current Tools:**
- ✅ `PenTool` - Freehand drawing
- ✅ `EraserTool` - Erasing strokes

**Why This Works:**
- Canvas controller doesn't know about specific tools
- Registry pattern for discovery
- Each tool is self-contained module
- Adding rectangle tool = new file + registration

---

## 📊 Refactoring Results

### Before vs After (Screaming Architecture)

| File | Before | After | Reduction | New Files Created |
|------|--------|-------|-----------|-------------------|
| `client/main.ts` | 409 lines | 233 lines | **43%** ✅ | `UIController.ts`, `SessionManager.ts` |
| `server/index.ts` | 265 lines | 103 lines | **61%** ✅ | `SocketHandlers.ts`, `routes.ts` |

### Benefits Achieved:

✅ **Single Responsibility** - Each file has ONE clear purpose
✅ **Self-Documenting** - File names tell you what they do
✅ **Easy Navigation** - No more 400-line files
✅ **Better Testability** - Isolated components
✅ **Interview Ready** - Shows architectural thinking

---

## 🎨 Adding New Features (Demonstrating Plugin Architecture)

### Example 1: Add Webhook for Slack Notifications

**Time to implement: 2 hours** (if architecture is right)

```typescript
// Step 1: Create server/plugins/slackNotify.ts
import { MiddlewarePlugin } from '../../shared/types.js';

const slackNotify: MiddlewarePlugin = async (context) => {
  await fetch(SLACK_WEBHOOK, {
    method: 'POST',
    body: JSON.stringify({
      text: `New stroke in session ${context.sessionId}`
    })
  });
};

export default slackNotify;

// Step 2: Add ONE LINE to server/config/plugins.ts
{ hook: 'stroke:after', plugin: './plugins/slackNotify.js' }

// Step 3: Restart server
// ✅ Done! Core code unchanged.
```

### Example 2: Add Rectangle Tool

**Time to implement: 30 minutes** (if architecture is right)

```typescript
// Step 1: Create client/tools/RectangleTool.ts
import BaseTool, { DrawContext } from './BaseTool.js';

export default class RectangleTool extends BaseTool {
  onMouseDown(point: Point, context: DrawContext): void { /* ... */ }
  onMouseMove(point: Point, context: DrawContext): void { /* ... */ }
  onMouseUp(point: Point, context: DrawContext): void { /* ... */ }
  render(ctx: CanvasRenderingContext2D, stroke: Stroke): void { /* ... */ }
}

// Step 2: Register in client/main.ts
this.toolRegistry.register('rectangle', RectangleTool);

// ✅ Done! CanvasController unchanged.
```

**The Real Test:** If adding features requires modifying core, it's not plugin architecture.

---

## 🧠 Key Design Decisions

### 1. Plugin Architecture vs Swappable Implementations

**What I Built:**
- Middleware hook system where multiple plugins compose
- Tool registry where tools register themselves
- Extension points in the core

**What I Didn't Build:**
- Simple interface swapping (that's Strategy Pattern)
- Everything as a plugin (some things are infrastructure)

### 2. What IS a Plugin (Extensions)

✅ **Middleware**: validation, rate limiting, logging, webhooks
✅ **Drawing Tools**: pen, eraser, shapes, text
✅ **Effects**: filters, transformations (future)
✅ **Integrations**: Slack, analytics (future)

### 3. What is NOT a Plugin (Infrastructure)

❌ **Storage layer** (Redis vs Memory) → Configuration choice
❌ **Transport layer** (WebSocket vs SSE) → Architecture decision
❌ **Message protocol** → Foundation
❌ **Session management** → Core business logic

**Principle:** If swapping it requires rewriting business logic, it's infrastructure.

### 4. Screaming Architecture

**Before:**
- `main.ts` (409 lines) - "What does this do?" 😕

**After:**
- `main.ts` (233 lines) - "Orchestrates the app" ✅
- `UIController.ts` - "Handles UI interactions" ✅
- `SessionManager.ts` - "Manages sessions" ✅
- `SocketHandlers.ts` - "Handles WebSocket events" ✅

Each file **screams** its purpose!

### 5. TypeScript for Explicit Contracts

```typescript
// Plugin contracts are EXPLICIT
interface DrawingTool {
  onMouseDown(point: Point, context: DrawContext): void;
  onMouseMove(point: Point, context: DrawContext): void;
  onMouseUp(point: Point, context: DrawContext): void;
  render(ctx: CanvasRenderingContext2D, stroke: Stroke): void;
}

type MiddlewarePlugin = (context: MiddlewareContext) => Promise<void> | void;
```

TypeScript makes the architecture **self-documenting**.

---

## 🎨 Technical Stack

**Backend:**
- TypeScript (ES2020)
- Node.js + Express
- Socket.io (WebSocket with reconnection)
- In-memory session storage

**Frontend:**
- TypeScript (ES2020, ES Modules)
- Vanilla JavaScript (no framework)
- Native Canvas API
- Socket.io client

**Build System:**
- TypeScript compiler
- Separate server/client builds
- No bundler needed (ES modules)

**Why Vanilla JS?**
- Plugin architecture is more visible without framework magic
- No build complexity = focus on architecture
- Easier to understand for interview evaluation

---

## 🔄 Real-Time Features

### Reconnection Handling

**Problem:** User draws → disconnects → reconnects
**Solution:**
1. Client queues strokes when offline
2. On reconnect: send `lastKnownTimestamp`
3. Server replays missed strokes
4. Client deduplicates by stroke ID
5. Client sends queued strokes

### Conflict Resolution

**Problem:** Out-of-order stroke delivery
**Solution:** Server assigns authoritative timestamp; client sorts before rendering

### Rate Limiting

**Problem:** User sends 1000 strokes/second
**Solution:** Rate limit plugin stops excessive requests before broadcast

---

## 🚀 What I'd Build Next

**If I had more time, I would add (with estimated hours):**

1. **Redis Storage Adapter** (3 hours)
   - Multi-server support via pub/sub
   - Session persistence

2. **Rectangle & Circle Tools** (2 hours each)
   - Demonstrate tool plugin extensibility

3. **Authentication Middleware** (6 hours)
   - JWT validation plugin
   - User identity system

4. **Export Canvas Plugin** (4 hours)
   - PNG/SVG export functionality

5. **Undo/Redo System** (8 hours)
   - Operational transformation basics

**Total: ~25 hours of additional features (all as plugins!)**

---

## 🎯 Interview Talking Points

### "Tell me about your architecture"

*"I focused on two things: **plugin architecture** and **screaming architecture**. For plugins, I created extension points rather than just swappable implementations. The middleware hook system lets you add features like webhooks by creating one file and adding one line to config—no core changes. For screaming architecture, I refactored large files into small, focused modules with names that immediately tell you what they do. The 409-line main.ts became a 233-line orchestrator plus dedicated UIController and SessionManager modules."*

### "Why plugin architecture?"

*"I made drawing tools and middleware into plugins because they're extensions—you want to add more over time without modifying core. But I kept storage and transport as infrastructure choices because swapping them would require rethinking the system. Plugin architecture isn't about making everything pluggable—it's about identifying the right extension points."*

### "How would this scale?"

*"The in-memory storage works for the demo, but the middleware system is production-ready. You could add a Redis pub/sub plugin for multi-server deployments without changing the core broadcast logic. That's intentional—I wanted to show I understand which parts scale horizontally and which don't."*

### "What trade-offs did you make?"

*"I chose timestamp-based ordering over full Operational Transformation because drawing is append-only. Out-of-order strokes just render in wrong layers, which is acceptable UX. Full OT would take 40 hours for marginal benefit. I also refactored for screaming architecture, which added more files but made the codebase much easier to navigate and understand."*

---

## 📝 Core Principles Applied

1. **Plugin Architecture ≠ Swappable Implementations**
   - Strategy Pattern: Core chooses ONE implementation
   - Plugin Architecture: Core provides hooks, MANY plugins compose

2. **Screaming Architecture**
   - File names should tell you what they do
   - No 400-line "God files"
   - Single Responsibility Principle

3. **Extension Points > Implementation Quantity**
   - Better: 3 hooks with 2 plugins each
   - Worse: 20 tools that all look identical

4. **Infrastructure vs Extensions**
   - Infrastructure: Storage, transport, protocol → Configuration
   - Extensions: Tools, middleware, integrations → Plugins

5. **Demonstrate Understanding, Not Perfection**
   - Show what's missing (Redis, auth, OT)
   - Show conscious trade-offs
   - Show you can articulate why

---

## 🐛 Known Limitations

**Out of Scope (Intentional):**
- ❌ Undo/redo system
- ❌ Canvas zoom/pan
- ❌ Image export
- ❌ Cursor tracking
- ❌ Authentication
- ❌ Persistent storage

**Reason:** Every feature should demonstrate plugin architecture or core collaboration. Nothing else.

---

## 📚 Build Commands

```bash
npm run build        # Build both server and client
npm run build:server # Build server only
npm run build:client # Build client only
npm start            # Build and run server
npm run dev          # Development mode
npm run watch        # Watch mode for development
npm run clean        # Clean build artifacts
```

---

## 📄 License

ISC

---

## 🙏 Acknowledgments

Built to demonstrate:
- **Plugin-oriented architectural thinking**
- **Screaming architecture principles**
- **TypeScript for self-documenting code**
- **Single Responsibility Principle**

**The Goal:** Show that I understand the difference between:
- Writing code (basic skill)
- Architecting systems (advanced skill)
- Organizing code for clarity (expert skill)
- Communicating trade-offs (interview skill)

Your code proves you can build.
Your structure proves you can architect.
Your organization proves you can design for humans.
Your trade-offs prove you understand constraints.

---

**Questions? Want to discuss the architecture?**
This project is designed to spark architectural conversations in technical interviews.
