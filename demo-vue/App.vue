<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { PilaEditor, icon, Icons } from '@sunacchi/pila'
import type { Block, PilaPlugin, BlockType } from '@sunacchi/pila'
import '@sunacchi/pila/styles'
import ModalWithEditor from './src/components/ModalWithEditor.vue'

const editorEl = ref<HTMLElement | null>(null)
let editor: PilaEditor | null = null
const output = ref('')
const activeFormat = ref('json');

const demoPluginState = { toolbarClicks: 0 };
(window as typeof window & {
  __pilaDemoPluginState?: { toolbarClicks: number }
  __pilaEditor?: PilaEditor
}).__pilaDemoPluginState = demoPluginState

const demoPlugin: PilaPlugin = {
  name: 'demo-plugin',
  install(api) {
    api.registerBlockType({
      type: 'badge',
      slashItem: {
        name: 'Badge',
        description: 'Plugin demo badge block',
        icon: '★',
      },
      factory(block) {
        const el = document.createElement('div')
        el.className = 'pila-plugin-badge rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700'
        el.tabIndex = 0
        el.textContent = block.content?.map((node) => node.text).join('') || 'Plugin badge'
        return el
      },
    })

    api.addToolbarButton({
      label: '★',
      title: 'Plugin Marker',
      command: () => {
        demoPluginState.toolbarClicks += 1

        const active = document.activeElement?.closest('[data-block-id]')
        const blockId = active?.getAttribute('data-block-id')?.split('_cell_')[0] || null
        if (!blockId) return

        const block = api.manager.getById(blockId)
        if (!block) return

        const existing = (block.attrs?.tailwindClasses || '').trim()
        const nextClasses = existing.includes('plugin-marked')
          ? existing
          : `${existing} plugin-marked`.trim()

        api.manager.update(blockId, {
          attrs: {
            ...(block.attrs || {}),
            tailwindClasses: nextClasses,
          },
        })
      },
    })

    api.registerEmojiProvider({
      key: 'demo-emoji',
      priority: 20,
      search(query) {
        const normalized = query.trim().toLowerCase()
        if (!normalized) return []
        if (!'rocket_plugin ship launch plugin'.includes(normalized) && !'rocket_plugin'.includes(normalized)) {
          return []
        }

        return [{
          emoji: '🚀',
          name: 'rocket_plugin',
          insertText: '[[rocket]]',
          keywords: ['ship', 'launch', 'plugin'],
        }]
      },
    })
  },
}

const initialContent: Block[] = [
  // === HEADINGS ===
  { type: 'heading1', content: [{ text: 'Pila Block Editor — Complete Demo Post' }] },
  { type: 'paragraph', content: [{ text: 'A comprehensive showcase of every built-in block type, inline formatting, and plugin capabilities in the Pila editor.' }] },

  { type: 'heading2', content: [{ text: '1. Basic Text Blocks' }] },
  { type: 'paragraph', content: [{ text: 'This is a standard ' }, { text: 'paragraph', bold: true }, { text: ' block. It supports ' }, { text: 'inline formatting', italic: true }, { text: ' including ' }, { text: 'bold', bold: true }, { text: ', ' }, { text: 'italic', italic: true }, { text: ', ' }, { text: 'underline', underline: true }, { text: ', ' }, { text: 'code', code: true }, { text: ', and ' }, { text: 'links', link: 'https://github.com/sunacchi/pila' }, { text: '.' }] },
  { type: 'paragraph', content: [{ text: 'Multiple paragraphs work naturally — just press Enter to create a new one.' }] },

  { type: 'heading2', content: [{ text: '2. Headings' }] },
  { type: 'heading1', content: [{ text: 'Heading 1 — Major Section' }] },
  { type: 'paragraph', content: [{ text: 'Use Heading 1 for top-level document sections.' }] },
  { type: 'heading2', content: [{ text: 'Heading 2 — Subsection' }] },
  { type: 'paragraph', content: [{ text: 'Heading 2 works well for subsections within a major section.' }] },
  { type: 'heading3', content: [{ text: 'Heading 3 — Minor Heading' }] },
  { type: 'paragraph', content: [{ text: 'Heading 3 is perfect for finer-grained organization.' }] },

  { type: 'heading2', content: [{ text: '3. Lists' }] },
  { type: 'heading3', content: [{ text: 'Bullet List' }] },
  { type: 'bulletList', content: [{ text: 'First bullet point with ' }, { text: 'bold text', bold: true }] },
  { type: 'bulletList', content: [{ text: 'Second item — press Enter for new bullets' }] },
  { type: 'bulletList', content: [{ text: 'Third item with ' }, { text: 'a link', link: 'https://example.com' }] },
  { type: 'bulletList', content: [{ text: 'Nested indentation: press Tab to indent, Shift+Tab to outdent' }] },

  { type: 'heading3', content: [{ text: 'Numbered List' }] },
  { type: 'numberedList', content: [{ text: 'First step in a sequence' }] },
  { type: 'numberedList', content: [{ text: 'Second step — numbers auto-update on reorder' }] },
  { type: 'numberedList', content: [{ text: 'Third step with ' }, { text: 'inline code', code: true }] },
  { type: 'numberedList', content: [{ text: 'Fourth and final step' }] },

  { type: 'heading2', content: [{ text: '4. Todo List' }] },
  { type: 'todo', content: [{ text: 'Learn Pila block types' }], attrs: { checked: true } },
  { type: 'todo', content: [{ text: 'Build something awesome' }], attrs: { checked: false } },
  { type: 'todo', content: [{ text: 'Deploy to production' }], attrs: { checked: false } },
  { type: 'todo', content: [{ text: 'Celebrate! 🎉' }], attrs: { checked: false } },

  { type: 'heading2', content: [{ text: '5. Code Block' }] },
  { type: 'code', content: [{ text: '// TypeScript example with syntax highlighting\ninterface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nfunction greet(user: User): string {\n  return `Hello, ${user.name}!`;\n}\n\ngreet({ id: "1", name: "Pila", email: "editor@example.com" });' }], attrs: { language: 'typescript' } },
  { type: 'code', content: [{ text: 'const PI = 3.14159;\nconsole.log(PI);' }], attrs: { language: 'javascript' } },
  { type: 'code', content: [{ text: '<div class="pila-editor">\n  <pila-paragraph></pila-paragraph>\n  <pila-heading></pila-heading>\n</div>' }], attrs: { language: 'html' } },
  { type: 'code', content: [{ text: 'pila-editor {\n  --pila-accent: #2563eb;\n  --pila-radius: 8px;\n  font-family: system-ui;\n}' }], attrs: { language: 'css' } },

  { type: 'heading2', content: [{ text: '6. Quote & Callout Blocks' }] },
  { type: 'quote', content: [{ text: 'The best editor is the one you actually use — simple, powerful, and extensible.' }] },
  { type: 'paragraph', content: [{ text: '— Pila Team' }] },

  { type: 'heading3', content: [{ text: 'Callout Variants' }] },
  { type: 'callout', content: [{ text: 'This is an ' }, { text: 'info', bold: true }, { text: ' callout — use for general tips and information.' }], attrs: { icon: 'ℹ️', flavor: 'info' } },
  { type: 'callout', content: [{ text: 'This is a ' }, { text: 'warning', bold: true }, { text: ' callout — highlights potential issues.' }], attrs: { icon: '⚠️', flavor: 'warning' } },
  { type: 'callout', content: [{ text: 'This is an ' }, { text: 'error', bold: true }, { text: ' callout — indicates critical problems.' }], attrs: { icon: '❌', flavor: 'error' } },
  { type: 'callout', content: [{ text: 'This is a ' }, { text: 'success', bold: true }, { text: ' callout — confirms successful actions.' }], attrs: { icon: '✅', flavor: 'success' } },
  { type: 'callout', content: [{ text: 'This is a ' }, { text: 'tip', bold: true }, { text: ' callout — shares helpful suggestions.' }], attrs: { icon: '💡', flavor: 'tip' } },

  { type: 'divider' },

  { type: 'heading2', content: [{ text: '7. Image Block' }] },
  { type: 'image', attrs: { src: 'https://picsum.photos/seed/pila-editor/800/400', alt: 'Pila editor showcase image', width: '100%', alignment: 'center' } },
  { type: 'paragraph', content: [{ text: 'Images support captions (click to edit), alignment (left/center/right), resizing via drag handle, and an edit overlay for properties.' }] },

  { type: 'divider' },

  { type: 'heading2', content: [{ text: '8. Table Block' }] },
  { type: 'table', attrs: { rows: [
    { cells: [
      { content: [{ text: 'Feature', bold: true }], background: '#f0f4f8' },
      { content: [{ text: 'Status', bold: true }], background: '#f0f4f8' },
      { content: [{ text: 'Notes', bold: true }], background: '#f0f4f8' },
    ]},
    { cells: [
      { content: [{ text: 'Drag & Drop Reordering' }] },
      { content: [{ text: '✅ Complete' }, { text: ' (green)', italic: true }] },
      { content: [{ text: 'Full keyboard support' }] },
    ]},
    { cells: [
      { content: [{ text: 'Inline Formatting' }] },
      { content: [{ text: '✅ Complete' }] },
      { content: [{ text: 'Bold, italic, code, links, underline' }] },
    ]},
    { cells: [
      { content: [{ text: 'Table Cell Merging' }] },
      { content: [{ text: '✅ Complete' }] },
      { content: [{ text: 'Select cells → merge/unmerge' }] },
    ]},
    { cells: [
      { content: [{ text: 'Column Resizing' }] },
      { content: [{ text: '✅ Complete' }] },
      { content: [{ text: 'Drag column handles' }] },
    ]},
    { cells: [
      { content: [{ text: 'Row/Column Headers' }] },
      { content: [{ text: '✅ Complete' }] },
      { content: [{ text: 'Toggle per row/column' }] },
    ]},
  ] } },
  { type: 'paragraph', content: [{ text: 'Tables support: cell merging, row/column drag-and-drop, header toggles, background/text colors, alignment, and cell styling via the cell settings menu (⚙️ icon on hover).' }] },

  { type: 'divider' },

  { type: 'heading2', content: [{ text: '9. Columns Layout' }] },
  { type: 'columns', attrs: { columnDefs: [
    { width: 1, blocks: [
      { type: 'heading3', content: [{ text: 'Left Column' }] },
      { type: 'paragraph', content: [{ text: 'This is the left column in a 50/50 split. You can add any block type inside columns.' }] },
      { type: 'bulletList', content: [{ text: 'Paragraphs' }] },
      { type: 'bulletList', content: [{ text: 'Lists' }] },
      { type: 'bulletList', content: [{ text: 'Code blocks' }] },
      { type: 'bulletList', content: [{ text: 'Even nested columns!' }] },
    ]},
    { width: 1, blocks: [
      { type: 'heading3', content: [{ text: 'Right Column' }] },
      { type: 'paragraph', content: [{ text: 'Right column — drag the handle between columns to resize. Columns are fully editable mini-editors.' }] },
      { type: 'callout', content: [{ text: 'Pro tip: Press Escape at column edges to exit.' }], attrs: { icon: '💡', flavor: 'tip' } },
      { type: 'code', content: [{ text: 'columns: [\n  { width: 1, blocks: [...] },\n  { width: 2, blocks: [...] },\n]' }], attrs: { language: 'json' } },
    ]},
  ] } },

  { type: 'columns', attrs: { columnDefs: [
    { width: 1, blocks: [
      { type: 'heading3', content: [{ text: 'Narrow' }] },
      { type: 'paragraph', content: [{ text: '1/3 width' }] },
    ]},
    { width: 2, blocks: [
      { type: 'heading3', content: [{ text: 'Wide' }] },
      { type: 'paragraph', content: [{ text: '2/3 width — columns use flex-grow ratios for proportional sizing.' }] },
    ]},
  ] } },

  { type: 'divider' },

  { type: 'heading2', content: [{ text: '10. Row Block' }] },
  { type: 'paragraph', content: [{ text: 'Row blocks are bordered containers that hold child blocks in a vertical stack. Configure borders via the toolbar (style, width, color, radius, per-side).' }] },

  { type: 'row', attrs: {
    borderStyle: 'solid',
    borderWidth: '5px',
    borderColor: 'rgb(255, 102, 84)',
    borderRadius: '0px',
    borderTop: false,
    borderBottom: true,
    borderLeft: false,
    borderRight: false,
    background: '#001b4f',
    textColor: '#ffffff',
    rowBlocks: [
      { type: 'heading3', content: [{ text: 'Bordered Row' }] },
      { type: 'paragraph', content: [{ text: 'This row has a solid blue border with rounded corners. Add any block type inside.' }] },
      { type: 'bulletList', content: [{ text: 'Child blocks stack vertically' }] },
      { type: 'bulletList', content: [{ text: 'Drag to reorder children' }] },
    ],
  } },

  { type: 'row', attrs: {
    borderStyle: 'dashed',
    borderWidth: '2px',
    borderColor: '#f59e0b',
    borderRadius: '12px',
    borderTop: true,
    borderBottom: true,
    borderLeft: false,
    borderRight: false,
    rowBlocks: [
      { type: 'heading3', content: [{ text: 'Dashed Top/Bottom Only' }] },
      { type: 'callout', content: [{ text: 'This row only has top and bottom borders — left and right are disabled.' }], attrs: { icon: '💡', flavor: 'tip' } },
    ],
  } },

  { type: 'row', attrs: {
    borderStyle: 'dotted',
    borderWidth: '1px',
    borderColor: '#10b981',
    borderRadius: '4px',
    borderTop: true,
    borderBottom: true,
    borderLeft: true,
    borderRight: true,
    rowBlocks: [
      { type: 'paragraph', content: [{ text: 'A minimal dotted border row with green styling.' }] },
    ],
  } },

  { type: 'divider' },

  { type: 'heading2', content: [{ text: '11. Button Block' }] },
  { type: 'paragraph', content: [{ text: 'Buttons are fully customizable links styled as buttons:' }] },
  { type: 'button', content: [{ text: 'Primary Button' }], attrs: { buttonStyle: 'primary', href: 'https://github.com/sunacchi/pila', alignment: 'left' } },
  { type: 'button', content: [{ text: 'Secondary Button' }], attrs: { buttonStyle: 'secondary', href: '#', alignment: 'center' } },
  { type: 'button', content: [{ text: 'Outline Button' }], attrs: { buttonStyle: 'outline', href: '#', alignment: 'right' } },
  { type: 'paragraph', content: [{ text: 'Click any button to edit its label, URL, style (primary/secondary/outline), and alignment.' }] },

  { type: 'divider' },

  { type: 'heading2', content: [{ text: '12. Plugin Block — Badge (Custom)' }] },
  { type: 'paragraph', content: [{ text: 'This badge block is provided by the demo plugin. It demonstrates how plugins can register custom block types, toolbar buttons, and emoji providers.' }] },
  // Plugin block type "badge" - will be registered by demoPlugin
  { type: 'badge', content: [{ text: 'Plugin Badge Example' }] },
  { type: 'paragraph', content: [{ text: 'The demo plugin also adds a "★ Plugin Marker" toolbar button (click selected block to toggle a CSS class) and an emoji provider for 🚀 (type [[rocket]]).' }] },

  { type: 'divider' },

  { type: 'heading2', content: [{ text: '13. Serializers — Export Formats' }] },
  { type: 'paragraph', content: [{ text: 'Pila includes four built-in serializers. Use the toolbar buttons above to export:' }] },
  { type: 'bulletList', content: [{ text: 'JSON — Full block data for storage/round-tripping' }] },
  { type: 'bulletList', content: [{ text: 'HTML — Semantic HTML with Tailwind classes' }] },
  { type: 'bulletList', content: [{ text: 'Markdown — GitHub-flavored markdown' }] },
  { type: 'bulletList', content: [{ text: 'Email HTML — Inline styles, tables → divs for email compatibility' }] },

  { type: 'heading2', content: [{ text: '14. Inline Formatting Reference' }] },
  { type: 'paragraph', content: [{ text: 'Select any text to see the floating toolbar with:' }] },
  { type: 'bulletList', content: [{ text: 'Bold (', code: true }, { text: 'Ctrl+B', code: true }, { text: ')' }] },
  { type: 'bulletList', content: [{ text: 'Italic (', code: true }, { text: 'Ctrl+I', code: true }, { text: ')' }] },
  { type: 'bulletList', content: [{ text: 'Underline (', code: true }, { text: 'Ctrl+U', code: true }, { text: ')' }] },
  { type: 'bulletList', content: [{ text: 'Inline Code (', code: true }, { text: 'Ctrl+`', code: true }, { text: ')' }] },
  { type: 'bulletList', content: [{ text: 'Link (', code: true }, { text: 'Ctrl+K', code: true }, { text: ')' }] },
  { type: 'bulletList', content: [{ text: 'Strikethrough (', code: true }, { text: 'Ctrl+Shift+X', code: true }, { text: ')' }] },

  { type: 'paragraph', content: [{ text: 'Markdown shortcuts also work while typing:' }] },
  { type: 'bulletList', content: [{ text: '**bold** → ', bold: true }, { text: 'bold' }] },
  { type: 'bulletList', content: [{ text: '*italic* → ', italic: true }, { text: 'italic' }] },
  { type: 'bulletList', content: [{ text: '~strikethrough~ → ', underline: true }, { text: 'strikethrough (rendered as underline)' }] },
  { type: 'bulletList', content: [{ text: '`code` → ', code: true }, { text: 'inline code' }] },
  { type: 'bulletList', content: [{ text: '[link](url) → ', link: 'https://example.com' }, { text: 'link' }] },

  { type: 'divider' },

  { type: 'heading2', content: [{ text: '15. Keyboard Shortcuts' }] },
  { type: 'table', attrs: { rows: [
    { cells: [
      { content: [{ text: 'Shortcut', bold: true }], background: '#f0f4f8' },
      { content: [{ text: 'Action', bold: true }], background: '#f0f4f8' },
    ]},
    { cells: [
      { content: [{ text: '/' }] },
      { content: [{ text: 'Open slash menu to add blocks' }] },
    ]},
    { cells: [
      { content: [{ text: 'Enter' }] },
      { content: [{ text: 'New block (paragraph by default)' }] },
    ]},
    { cells: [
      { content: [{ text: 'Shift+Enter' }] },
      { content: [{ text: 'Exit current block, add paragraph after' }] },
    ]},
    { cells: [
      { content: [{ text: 'Backspace (empty block)' }] },
      { content: [{ text: 'Delete block / merge with previous' }] },
    ]},
    { cells: [
      { content: [{ text: '↑/↓' }] },
      { content: [{ text: 'Navigate between blocks' }] },
    ]},
    { cells: [
      { content: [{ text: 'Drag handle (⋮⋮)' }] },
      { content: [{ text: 'Drag to reorder blocks' }] },
    ]},
    { cells: [
      { content: [{ text: 'Tab (in lists)' }] },
      { content: [{ text: 'Indent list item' }] },
    ]},
    { cells: [
      { content: [{ text: 'Shift+Tab (in lists)' }] },
      { content: [{ text: 'Outdent list item' }] },
    ]},
    { cells: [
      { content: [{ text: 'Ctrl/Cmd+B, I, U, K, `, Shift+X' }] },
      { content: [{ text: 'Inline formatting shortcuts' }] },
    ]},
    { cells: [
      { content: [{ text: '[[emoji]]' }] },
      { content: [{ text: 'Emoji picker (try [[rocket]])' }] },
    ]},
  ] } },

  { type: 'divider' },

  { type: 'heading2', content: [{ text: '16. Events & Plugin API' }] },
  { type: 'paragraph', content: [{ text: 'The editor emits events for integration:' }] },
  { type: 'code', content: [{ text: 'editor.on("block:add", ({ block, index }) => {})\neditor.on("block:update", ({ id, block }) => {})\neditor.on("block:delete", ({ id }) => {})\neditor.on("block:move", ({ id, toIndex }) => {})\neditor.on("blocks:change", ({ blocks }) => {})' }], attrs: { language: 'typescript' } },
  { type: 'paragraph', content: [{ text: 'Plugins can register custom blocks, slash menu items, toolbar buttons, and emoji providers via the install(api) function.' }] },

  { type: 'divider' },

  { type: 'heading2', content: [{ text: '🎉 That\'s Everything!' }] },
  { type: 'paragraph', content: [{ text: 'This demo post showcases all ' }, { text: '13 built-in block types', bold: true }, { text: ', ' }, { text: '5 callout flavors', bold: true }, { text: ', ' }, { text: '3 button styles', bold: true }, { text: ', ' }, { text: 'column & row layouts', bold: true }, { text: ', advanced tables, images, code highlighting, and the plugin system.' }] },
  { type: 'callout', content: [{ text: 'Try exporting this content as JSON, HTML, Markdown, or Email HTML using the toolbar buttons above!' }], attrs: { icon: '🚀', flavor: 'success' } },
];

onMounted(() => {
  if (editorEl.value) {
    editor = new PilaEditor(editorEl.value, {
      placeholder: 'Type / to add a block…',
      initialContent,
      plugins: [demoPlugin],
      /*onChange: (blocks: Block[]) => {
          console.log(blocks);
        
        const rawValue = editor!.getContent("json");
        const emailValue = editor!.getContent("email", { fullDocument: false });
        
        console.log(rawValue);
        console.log("Email Value:", emailValue);
      }*/
    })
    editor.mount()
    ;(window as typeof window & { __pilaEditor?: PilaEditor }).__pilaEditor = editor
  }
})

onBeforeUnmount(() => {
  editor?.destroy()
  ;(window as typeof window & { __pilaEditor?: PilaEditor }).__pilaEditor = undefined
})

const updateOutput = (format: 'json' | 'html' | 'markdown' | 'email' | 'clear') => {
  if (!editor) return
  activeFormat.value = format
  if (format === 'clear') {
    output.value = ''
    return
  }
  output.value = editor.getContent(format, { fullDocument: false })
}

// Wrapper to use library icons in Vue
const getIcon = (iconNode: any) => icon(iconNode, 14).innerHTML
</script>

<template>
  <div class="demo-wrapper">
    <div class="content-container">
      <h1 class="text-center text-2xl font-bold mb-1">
        Pila Block Editor
      </h1>
      <p class="subtitle">
        Type <code>/</code> to add a block · Select text for inline formatting · Drag rows to reorder
      </p>
      
      <div class="mb-8 flex justify-center">
        <ModalWithEditor />
      </div>

      <div
        id="editor"
        ref="editorEl"
      />
      
      <div class="toolbar">
        <button
          id="btn-json"
          :class="{ active: activeFormat === 'json' }"
          @click="updateOutput('json')"
        >
          <span v-html="getIcon(Icons.FileJson)" /> Get JSON
        </button>
        <button
          id="btn-html"
          :class="{ active: activeFormat === 'html' }"
          @click="updateOutput('html')"
        >
          <span v-html="getIcon(Icons.FileCode)" /> Get HTML
        </button>
        <button
          id="btn-md"
          :class="{ active: activeFormat === 'markdown' }"
          @click="updateOutput('markdown')"
        >
          <span v-html="getIcon(Icons.FileText)" /> Get Markdown
        </button>
        <button
          id="btn-email"
          :class="{ active: activeFormat === 'email' }"
          @click="updateOutput('email')"
        >
          <span v-html="getIcon(Icons.Mail)" /> Get Email HTML
        </button>
        <button
          id="btn-clear"
          @click="updateOutput('clear')"
        >
          <span v-html="getIcon(Icons.Eraser)" /> Clear
        </button>
      </div>

      <pre
        v-if="output"
        id="output"
      >{{ output }}</pre>
      
      <section
        v-if="output && activeFormat !== 'json'"
        id="preview"
        v-html="output"
      />
    </div>
  </div>
</template>

<style>
:root {
  --pila-bg: white;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #fdfdfd;
  color: #111;
  line-height: 1.5;
}

.demo-wrapper {
  display: grid;
  grid-template-columns: 25rem 1fr 25rem;
  justify-items: center;
  min-height: 100vh;
  padding-block: 2rem;
}

.content-container {
  grid-column: 2/2;
  width: 100%;
  max-width: 720px;
}

.subtitle { color: #666; margin-bottom: 32px; font-size: 0.9rem; text-align: center; }

#editor {
  width: 100%;
  min-height: 400px;
  background: white;
  border-radius: 8px;
}

.toolbar {
  width: 100%;
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.toolbar button {
  padding: .6rem 1.1rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 500;
  color: #333;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}

.toolbar button span {
  display: flex;
  align-items: center;
}

.toolbar button svg {
  display: block;
  stroke: currentColor;
  fill: none;
}

.toolbar button:hover { background: #f0f0f0; border-color: #bbb; }
.toolbar button.active { background: #f0f0f0; border-color: #999; }

#btn-json  { color: #1a6fcf; border-color: #a8c8f5; }
#btn-json:hover  { background: #eef4fd; }
#btn-html  { color: #2a7c4e; border-color: #9dd4b5; }
#btn-html:hover  { background: #edf7f2; }
#btn-md    { color: #7b4e9e; border-color: #cfaee8; }
#btn-md:hover    { background: #f5eefb; }
#btn-email { color: #b05a1a; border-color: #f0c090; }
#btn-email:hover { background: #fdf3e8; }
#btn-clear { color: #c0392b; border-color: #f0a9a2; }
#btn-clear:hover { background: #fdf0ee; }

#output {
  width: 100%;
  margin-top: 16px;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

#preview {
  margin-top: 2rem;
  padding: 2rem;
  border: 1px dashed #ccc;
  border-radius: 8px;
}
</style>
