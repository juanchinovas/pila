<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { PilaEditor, icon, Icons, Block } from '@sunacchi/pila'
import '@sunacchi/pila/styles'
import ModalWithEditor from './src/components/ModalWithEditor.vue'

const editorEl = ref<HTMLElement | null>(null)
let editor: PilaEditor | null = null
const output = ref('')
const activeFormat = ref('json')

const initialContent: Block[] = [
  { type: 'heading1', content: [{ text: 'Welcome to Pila + Vue ✦' }] },
  { type: 'paragraph', content: [{ text: 'A framework-agnostic block editor. This demo mirrors the full functional demo but built with ' }, { text: 'Vue 3', italic: true }, { text: '.' }] },
  { type: 'heading2', content: [{ text: 'Features' }] },
  { type: 'bulletList', content: [{ text: 'Drag & drop blocks' }] },
  { type: 'bulletList', content: [{ text: 'Inline formatting (bold, italic, code, links)' }] },
  { type: 'bulletList', content: [{ text: 'JSON / HTML / Markdown export' }] },
  { type: 'todo', content: [{ text: 'Try checking this off' }], attrs: { checked: false } },
  { type: 'code', content: [{ text: 'const editor = new PilaEditor(el, {\n\tplaceholder: "Type / to add a block…"\n});' }], attrs: { language: 'typescript' } },
  { type: 'quote', content: [{ text: 'The best editor is the one you actually use.' }] },
  { type: 'callout', content: [{ text: 'This is an info callout.' }],    attrs: { icon: '💡', flavor: 'info'    } },
  { type: 'callout', content: [{ text: 'This is a warning callout.' }],  attrs: { icon: '⚠️', flavor: 'warning' } },
  { type: 'callout', content: [{ text: 'This is an error callout.' }],   attrs: { icon: '🚨', flavor: 'error'   } },
  { type: 'callout', content: [{ text: 'This is a success callout.' }],  attrs: { icon: '✅', flavor: 'success' } },
  { type: 'callout', content: [{ text: 'This is a tip callout.' }],      attrs: { icon: '💬', flavor: 'tip'     } },
  { type: 'divider' },
  { type: 'image', attrs: { src: 'https://picsum.photos/seed/pila/720/240', alt: 'Demo image' } },
  { type: 'table', attrs: { rows: [
    { cells: [{ content: [{ text: 'Name' }] }, { content: [{ text: 'Role' }] }, { content: [{ text: 'Status' }] }] },
    { cells: [{ content: [{ text: 'Alice' }] }, { content: [{ text: 'Engineer' }] }, { content: [{ text: 'Active' }] }] },
    { cells: [{ content: [{ text: 'Bob' }] }, { content: [{ text: 'Designer' }] }, { content: [{ text: 'Active' }] }] },
  ] } },
  { type: 'heading2', content: [{ text: 'Columns layout' }] },
  { type: 'columns', attrs: { columnDefs: [
    { width: 1, blocks: [{ type: 'paragraph', content: [{ text: 'Left column — equal width.' }] }] },
    { width: 1, blocks: [{ type: 'paragraph', content: [{ text: 'Right column — equal width.' }] }] },
  ] } },
  { type: 'button', content: [{ text: 'Start with Pila' }], attrs: { buttonStyle: 'primary', href: 'https://github.com', alignment: 'center' } },
];

onMounted(() => {
  if (editorEl.value) {
    editor = new PilaEditor(editorEl.value, {
      placeholder: 'Type / to add a block…',
      initialContent,
    })
    editor.mount()
  }
})

onBeforeUnmount(() => {
  editor?.destroy()
})

const updateOutput = (format: 'json' | 'html' | 'markdown' | 'email' | 'clear') => {
  if (!editor) return
  activeFormat.value = format
  if (format === 'clear') {
    output.value = ''
    return
  }
  output.value = editor.getContent(format)
}

// Wrapper to use library icons in Vue
const getIcon = (iconNode: any) => icon(iconNode, 14).innerHTML
</script>

<template>
  <div class="demo-wrapper">
    <div class="content-container">
      <h1>Pila Block Editor</h1>
      <p class="subtitle">Type <code>/</code> to add a block · Select text for inline formatting · Drag rows to reorder</p>
      
      <div class="mb-8 flex justify-center">
        <ModalWithEditor />
      </div>

      <div id="editor" ref="editorEl"></div>
      
      <div class="toolbar">
        <button id="btn-json" :class="{ active: activeFormat === 'json' }" @click="updateOutput('json')">
          <span v-html="getIcon(Icons.FileJson)"></span> Get JSON
        </button>
        <button id="btn-html" :class="{ active: activeFormat === 'html' }" @click="updateOutput('html')">
          <span v-html="getIcon(Icons.FileCode)"></span> Get HTML
        </button>
        <button id="btn-md" :class="{ active: activeFormat === 'markdown' }" @click="updateOutput('markdown')">
          <span v-html="getIcon(Icons.FileText)"></span> Get Markdown
        </button>
        <button id="btn-email" :class="{ active: activeFormat === 'email' }" @click="updateOutput('email')">
          <span v-html="getIcon(Icons.Mail)"></span> Get Email HTML
        </button>
        <button id="btn-clear" @click="updateOutput('clear')">
          <span v-html="getIcon(Icons.Eraser)"></span> Clear
        </button>
      </div>

      <pre v-if="output" id="output">{{ output }}</pre>
      
      <section v-if="output && activeFormat !== 'json'" id="preview" v-html="output"></section>
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

h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; text-align: center; }
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
