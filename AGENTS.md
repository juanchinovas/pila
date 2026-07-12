# AGENTS.md - @sunacchi/pila

## Project Overview
**@sunacchi/pila** - Pluggable Inline Layout Authoring: a framework-agnostic, Notion-style block editor built with TypeScript and Web Components (Lit). Framework-agnostic — works in vanilla HTML, React, Vue, Svelte, or any DOM environment.

## Project Structure
```
src/
├── core/           # Core editor logic (Editor, BlockManager, BlockFactory, EventEmitter, PluginRegistry)
├── blocks/         # Built-in block types (Paragraph, Heading, List, Todo, Code, Quote, Callout, Divider, Image, Table, Columns, Button)
├── inline/         # Inline formatting (parser, renderer, formatter)
├── serializers/    # Export serializers (JSON, HTML, Markdown, Email HTML)
├── serializers/    # Serializer tests
├── serializers/    # Serializers
├── ui/             # UI components (SlashMenu, FloatingToolbar, BlockPopover, DragHandle, etc.)
├── styles/         # CSS (pila.css, variables.css)
├── types.ts        # TypeScript types
└── index.ts        # Main entry point
```

## Development Environment

This project includes a **VS Code Dev Container** for consistent environments.

### Using Dev Containers
1. Install the [Dev Containers extension](vscode:extension/ms-vscode-remote.remote-containers)
2. Open the project in VS Code
3. Click "Reopen in Container" (or Command Palette → `Dev Containers: Reopen in Container`)

The container includes:
- Node 20
- Playwright + Chromium (for E2E tests)
- GitHub CLI
- ESLint, Prettier, Tailwind extensions

First build takes a few minutes; subsequent opens are fast.

### Alternative: Manual Setup
If not using Dev Containers:
```bash
npm install
npx playwright install --with-deps chromium
```

## Development Commands

```bash
# Install dependencies
npm install

# Start vanilla demo
npm run dev

# Start Vue 3 demo (in demo-vue)
npm run dev:vue

# Type-check + build to dist/
npm run build

# Run unit tests (Vitest)
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests (Playwright)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Lint
npm run lint

# Lint with auto-fix
npm run lint:fix
```

## Key Technologies
- **TypeScript** (strict mode)
- **Vite** for dev/build
- **Lit** for Web Components
- **Vitest** for unit tests (jsdom)
- **Playwright** for E2E tests
- **ESLint** + **TypeScript ESLint** + **Stylistic** for linting
- **PostCSS** + **TailwindCSS** for styling
- **PrismJS** for syntax highlighting
- **Vitest** + **jsdom** for testing

## Key Architectural Concepts

### Core Classes (`src/core/`)
- **Editor** (`Editor.ts`) - Main entry point, mounts to a container element
- **BlockManager** (`BlockManager.ts`) - Manages block lifecycle, ordering, selection
- **BlockFactory** (`BlockFactory.ts`) - Registry and instantiation of block types
- **PluginRegistry** (`PluginRegistry.ts`) - Plugin system for custom blocks, slash menu items, toolbar buttons
- **EventEmitter** (`EventEmitter.ts`) - Event emitter for editor events

### Block System (`src/blocks/`)
- All blocks extend `BaseBlock` (abstract)
- Each block has: `render()`, `getData()`, `setData()`, `destroy()`, optional `toolbarConfig`
- Blocks registered via `BlockFactory.registerBlockType()`
- Built-in blocks: Paragraph, Heading (H1-H3), BulletList, NumberedList, Todo, Code, Quote, Callout, Divider, Image, Table, Columns, Button

### Inline Formatting (`src/inline/`)
- **InlineParser** - Parses markdown-like syntax (*, _, ~, `, [link](url))
- **InlineRenderer** - Renders parsed inline elements to DOM
- **InlineFormatter** - Handles keyboard shortcuts and toolbar actions

### Serializers (`src/serializers/`)
- **JsonSerializer** - JSON import/export
- **HtmlSerializer** - HTML export
- **MarkdownSerializer** - Markdown export
- **EmailSerializer** - Email-safe HTML export (tables → divs, inline styles)

### Plugin System
```typescript
editor.use(plugin)
// Plugin interface: { blocks?, slashMenuItems?, toolbarButtons? }
```

### Editor Events
```typescript
editor.on('block:add', ({ block, index }) => {})
editor.on('block:update', ({ id, block }) => {})
editor.on('block:delete', ({ id }) => {})
editor.on('block:move', ({ id, toIndex }) => {})
editor.on('blocks:change', ({ blocks }) => {})
```

## Testing
- **Unit tests**: `npm run test` (Vitest + jsdom)
- **E2E tests**: `npm run test:e2e` (Playwright)
- Test files: `*.test.ts` alongside source files

## Code Style
- **ESLint** with TypeScript ESLint + Stylistic
- Run `npm run lint` before committing
- Run `npm run lint:fix` for auto-fix
- TypeScript strict mode enabled

## Build Output
- `dist/pila.js` (ESM)
- `dist/pila.umd.cjs` (UMD)
- `dist/pila.css`
- `dist/index.d.ts` (TypeScript declarations)
- `dist/styles.d.ts` (CSS module types)

## Package Exports
```json
{
  ".": {
    "import": "./dist/pila.js",
    "require": "./dist/pila.umd.cjs",
    "types": "./dist/index.d.ts"
  },
  "./styles": {
    "import": "./dist/pila.css",
    "types": "./dist/styles.d.ts"
  }
}
```

## Git Workflow
- Main branch: `main`
- CI runs on push/PR: typecheck, lint, test, build, e2e
- Publish workflow on tag push

## Common Development Tasks

### Adding a new block type
1. Create `src/blocks/MyBlock.ts` extending `BaseBlock`
2. Register in `src/blocks/index.ts` (or via plugin)
3. Add to `package.json` sideEffects if it has side effects
4. Add tests in `src/blocks/MyBlock.test.ts`

### Adding a serializer
1. Create `src/serializers/MySerializer.ts` implementing `Serializer` interface
2. Export from `src/serializers/index.ts`
3. Add tests

### Adding a plugin
```typescript
import { Editor } from '@sunacchi/pila'

const myPlugin = {
  blocks: [MyCustomBlock],
  slashMenuItems: [{ title: 'My Block', icon: '★', action: (editor) => editor.addBlock('my-block') }],
  toolbarButtons: [{ icon: '★', tooltip: 'My Action', action: (editor) => {} }]
}
editor.use(myPlugin)
```

### Running a specific test
```bash
npx vitest run src/blocks/ParagraphBlock.test.ts
```

### Debugging E2E tests
```bash
npm run test:e2e:ui
```