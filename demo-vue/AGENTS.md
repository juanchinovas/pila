# AGENTS.md - pila-demo-vue

## Project Overview
**pila-demo-vue** - A Vue 3 demo application showcasing the @sunacchi/pila block editor integration. This is a private demo project used for development and testing of the Pila editor in a Vue environment.

## Project Structure
```
demo-vue/
├── src/
│   ├── assets/
│   │   └── index.css          # Global styles (Tailwind v4)
│   ├── lib/
│   │   └── utils.ts           # Utility functions (cn helper for class merging)
│   ├── App.vue                # Main demo application component
│   ├── main.ts                # Application entry point
│   └── style.css              # Additional styles
├── index.html                 # HTML entry point
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── package.json               # Project dependencies and scripts
```

## Development Commands

```bash
# Install dependencies (from demo-vue directory)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Technologies
- **Vue 3** (Composition API with `<script setup>`)
- **Vite** for dev/build
- **TypeScript** (strict mode)
- **Tailwind CSS v4** (via @tailwindcss/vite)
- **shadcn-vue** for UI components (Radix Vue + Reka UI + Lucide Vue)
- **@sunacchi/pila** (local file dependency) - The block editor being demonstrated

## Key Implementation Details

### Pila Editor Integration (App.vue)
The demo mounts the Pila editor in a Vue component using the standard lifecycle:

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { PilaEditor } from '@sunacchi/pila'
import '@sunacchi/pila/styles'

const editorEl = ref<HTMLElement | null>(null)
let editor: PilaEditor | null = null

onMounted(() => {
  editor = new PilaEditor(editorEl.value!, { 
    placeholder: 'Type / to add a block…' 
  })
  editor.mount()
})

onBeforeUnmount(() => editor?.destroy())
</script>

<template>
  <div ref="editorEl" class="min-h-[500px]" />
</template>
```

### UI Components
Uses shadcn-vue components built on:
- **Reka UI** (headless UI primitives)
- **Radix Vue** (additional primitives)
- **Lucide Vue** (icons)
- **Tailwind CSS** for styling
- **class-variance-authority** + **clsx** + **tailwind-merge** for class composition

### Dependencies
- `@sunacchi/pila`: Local dependency (`file:..`) pointing to the main pila package
- `@vueuse/core`: Vue composition utilities
- `reka-ui`: Headless UI components
- `radix-vue`: Additional headless components
- `lucide-vue-next`: Icon library
- `shadcn-vue`: Pre-built accessible components
- `tailwindcss` v4: Styling (via @tailwindcss/vite plugin)

## Code Style
- **TypeScript** strict mode
- **Vue 3** Composition API with `<script setup>`
- **ESLint** (configured in root package.json)
- **Prettier** (implied by shadcn-vue setup)

## Development Workflow

### Running the demo
From the repo root:
```bash
npm run dev:vue
```
Or from demo-vue directory:
```bash
npm run dev
```

### Building the main pila package first
The demo uses `file:..` dependency, so changes to the main pila package require rebuilding:
```bash
# From repo root
npm run build
cd demo-vue && npm run dev
```

### Adding new demo features
1. Modify `src/App.vue` or create new components in `src/components/`
2. Use shadcn-vue components for UI consistency
3. Import Pila editor types from `@sunacchi/pila`

## Testing
No dedicated test suite for the demo. Testing is done via:
- Manual testing in browser
- E2E tests in the main pila package (`npm run test:e2e`)

## Notes
- This is a **private** package (not published to npm)
- Uses Tailwind CSS v4 (different config than v3)
- The main pila package must be built (`npm run build`) for changes to reflect in the demo
- Demo serves as integration test for Vue 3 compatibility