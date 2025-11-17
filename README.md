# Collaborative Paint

> Real-time collaborative drawing demonstrating **plugin-oriented architecture** and **screaming architecture principles**

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

## 🏗️ Architecture Overview

### Project Structure (Self-Documenting)

```
collaborative-drawing/
├── client/
│   ├── index.html                  # 🎨 UI
│   ├── main.ts                     # 🎬 App orchestrator  
│   ├── core/
│   │   ├── CanvasController.ts     # 🖼️  Tool-agnostic canvas
│   │   ├── SessionManager.ts       # 🎫 Session lifecycle
│   │   ├── ToolRegistry.ts         # ⭐ Tool plugin system
│   │   ├── UIController.ts         # 🎛️  UI interactions
│   │   └── WebSocketClient.ts      # 🔌 Connection management
│   └── tools/                      
│       ├── BaseTool.ts             # 🔧 Tool interface
│       ├── EraserTool.ts           # 🧹 Eraser tool plugin
│       └── PenTool.ts              # ✏️  Pen tool plugin
│
├── server/
│   ├── index.ts                    # 🎬 Server entry point
│   ├── routes.ts                   # 🛣️  HTTP routes
│   ├── core/
│   │   ├── MiddlewareManager.ts    # ⭐ Hook system (plugin architecture)
│   │   └── SessionStore.ts         # 💾 Session state management
│   ├── handlers/
│   │   └── SocketHandlers.ts       # 🔌 WebSocket event handlers
│   ├── plugins/                  
│   │   ├── logStroke.ts            # 📝 Logging middleware
│   │   ├── validateStroke.ts       # ✅ Validation middleware
│   │   └── rateLimitCheck.ts       # 🚦 Rate limiting middleware
│   └── config/
│       └── plugins.ts              # ⚙️  Plugin configuration
│
└── shared/
    └── types.ts                    # 📐 TypeScript types
```

**Key Observations:**
- **Screaming Architecture**: File names tell you EXACTLY what they do
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

## 🎨 Adding New Features (Demonstrating Plugin Architecture)

### Example: Add Rectangle Tool

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

## 🐛 Known Limitations

**Out of Scope (Intentional):**
- ❌ Undo/redo system
- ❌ Canvas zoom/pan
- ❌ Image export
- ❌ Cursor tracking
- ❌ Authentication
- ❌ Persistent storage
- ❌ Automated tests

**Reason:** This is an architectural demonstration focused on plugin systems and real-time collaboration patterns. For production deployment, automated tests would be the first priority (unit tests for middleware execution, integration tests for WebSocket flows, E2E tests for multi-user scenarios).

---

## 🚀 Deployment

### Deploy to Railway (Recommended)

**Time: 5 minutes**

Railway provides free hosting with full WebSocket support - perfect for this real-time collaborative app.

#### Option 1: CLI (Fastest)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login (opens browser)
railway login

# Initialize project
railway init

# Deploy
railway up

# Generate public URL
railway domain
```

You'll get a URL like: `https://collaborative-paint.up.railway.app`

#### Option 2: Web Dashboard (No CLI)

1. Go to [railway.app/new](https://railway.app/new)
2. Click "Deploy from GitHub repo"
3. Connect your GitHub account and select this repository
4. Railway auto-detects `railway.json` configuration
5. Click "Deploy"
6. Go to Settings → "Generate Domain"
7. Done! Your app is live 🎉

#### Configuration

Railway uses `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

Nixpacks automatically:
- Detects Node.js from `package.json`
- Installs dependencies (including TypeScript)
- Builds the application
- Starts the server

#### Verify Deployment

After deploying, test:
1. ✅ Create a session
2. ✅ Share session link
3. ✅ Open link in another browser/incognito window
4. ✅ Draw in both windows simultaneously
5. ✅ Verify real-time sync works

---

## 📄 License

ISC

---