import Prism from 'prismjs'
import { Block } from '../types'
import { icon, Icons } from '../ui/icons'
import { PilaBlock } from './PilaBlock'

/** Static dynamic-import loaders — Vite analyses these and code-splits each grammar */
const GRAMMAR_LOADERS: Record<string, Array<() => Promise<unknown>>> = {
  markup:     [() => import('prismjs/components/prism-markup')],
  css:        [() => import('prismjs/components/prism-css')],
  javascript: [() => import('prismjs/components/prism-javascript')],
  typescript: [() => import('prismjs/components/prism-javascript'), () => import('prismjs/components/prism-typescript')],
  jsx:        [() => import('prismjs/components/prism-markup'), () => import('prismjs/components/prism-javascript'), () => import('prismjs/components/prism-jsx')],
  tsx:        [() => import('prismjs/components/prism-markup'), () => import('prismjs/components/prism-javascript'), () => import('prismjs/components/prism-typescript'), () => import('prismjs/components/prism-jsx'), () => import('prismjs/components/prism-tsx')],
  json:       [() => import('prismjs/components/prism-json')],
  python:     [() => import('prismjs/components/prism-python')],
  bash:       [() => import('prismjs/components/prism-bash')],
  markdown:   [() => import('prismjs/components/prism-markup'), () => import('prismjs/components/prism-markdown')],
  sql:        [() => import('prismjs/components/prism-sql')],
  yaml:       [() => import('prismjs/components/prism-yaml')],
  csharp:     [() => import('prismjs/components/prism-csharp')],
  java:       [() => import('prismjs/components/prism-java')],
}

const grammarsLoaded = new Set<string>()

async function loadGrammar(langKey: string): Promise<void> {
  if (grammarsLoaded.has(langKey) || !GRAMMAR_LOADERS[langKey]) return
  for (const load of GRAMMAR_LOADERS[langKey]) await load()
  grammarsLoaded.add(langKey)
}

/** Common shorthand aliases → Prism grammar keys */
const LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  yml: 'yaml',
}

export class CodeBlock extends PilaBlock {
  private codeEl!: HTMLElement
  private highlightEl!: HTMLElement
  private langEl!: HTMLSelectElement
  private lineNumbersEl!: HTMLElement
  private copyIconEl!: SVGElement
  private checkIconEl!: SVGElement

  protected buildDOM(): void {
    this.classList.add(
      'bg-[var(--pila-code-bg)]', 'border', 'border-[var(--pila-code-border,var(--pila-border))]',
      'rounded-[var(--pila-radius)]', 'overflow-hidden', 'my-1'
    )

    // ── Header ──────────────────────────────────────────────────────────────
    const header = document.createElement('div')
    header.className = 'flex items-center justify-between px-3 py-[6px] border-b border-[var(--pila-code-border,var(--pila-border))] bg-[var(--pila-code-header-bg,rgba(0,0,0,.03))]'

    const LANGUAGES = [
      'plaintext', 'bash', 'css', 'csharp', 'java', 'javascript',
      'json', 'jsx', 'markdown', 'markup', 'python', 'sql',
      'tsx', 'typescript', 'yaml',
    ]

    this.langEl = document.createElement('select')
    this.langEl.className = 'font-mono text-[0.72rem] uppercase tracking-wide text-[color:var(--pila-code-text)] opacity-50 bg-transparent border-none outline-none p-0 cursor-pointer'
    LANGUAGES.forEach((lang) => {
      const opt = document.createElement('option')
      opt.value = lang
      opt.textContent = lang
      this.langEl.appendChild(opt)
    })
    this.langEl.value = this.block.attrs?.language ?? 'plaintext'
    this.langEl.addEventListener('change', () => {
      this.ctx.manager.update(this.block.id, {
        attrs: { ...this.block.attrs, language: this.langEl.value },
      })
      void this.syncHighlight()
    })

    const copyBtn = document.createElement('button')
    copyBtn.type = 'button'
    copyBtn.title = 'Copy code'
    copyBtn.className = 'flex items-center gap-1 text-[0.72rem] text-[color:var(--pila-code-text)] opacity-50 hover:opacity-100 bg-transparent border-none cursor-pointer outline-none px-1 py-0.5 rounded transition-opacity'
    this.copyIconEl = icon(Icons.Copy, 13)
    this.checkIconEl = icon(Icons.Check, 13)
    this.checkIconEl.style.display = 'none'
    copyBtn.append(this.copyIconEl, this.checkIconEl)
    copyBtn.addEventListener('click', () => this.copyCode())

    header.append(this.langEl, copyBtn)
    this.appendChild(header)

    // ── Body: gutter + stacked highlight/editing layers ──────────────────
    const body = document.createElement('div')
    body.className = 'flex'

    this.lineNumbersEl = document.createElement('div')
    this.lineNumbersEl.setAttribute('aria-hidden', 'true')
    this.lineNumbersEl.className = [
      'select-none', 'shrink-0', 'text-right',
      'px-3', 'py-[14px]',
      'font-mono', 'text-[0.875rem]', 'leading-[1.6]',
      'text-[color:var(--pila-code-text)]', 'opacity-30',
      'border-r', 'border-[var(--pila-code-border,var(--pila-border))]',
    ].join(' ')

    // <pre> uses CSS grid so highlight + editing layers stack identically
    const pre = document.createElement('pre')
    pre.className = 'm-0 flex-1 min-w-0 grid overflow-x-auto'

    // Shared classes that MUST be identical on both layers for pixel-perfect alignment
    const sharedClass = [
      '[grid-area:1/1]',
      'block', 'px-4', 'py-[14px]',
      'font-mono', 'text-[0.875rem]', 'leading-[1.6]',
      'whitespace-pre', '[tab-size:2]', 'm-0',
    ].join(' ')

    // Highlight layer — behind, read-only, receives Prism HTML
    this.highlightEl = document.createElement('code')
    this.highlightEl.setAttribute('aria-hidden', 'true')
    this.highlightEl.className = `${sharedClass} pointer-events-none select-none`

    // Editing layer — on top, transparent text so the highlight shows through
    this.codeEl = document.createElement('code')
    this.codeEl.setAttribute('contenteditable', 'true')
    this.codeEl.setAttribute('spellcheck', 'false')
    this.codeEl.className = [
      sharedClass,
      'relative z-10 outline-none min-h-[2.5em]',
      'text-transparent [caret-color:var(--pila-code-text)] bg-transparent',
    ].join(' ')
    this.codeEl.setAttribute('data-block-id', this.block.id)
    this.codeEl.textContent = (this.block.content ?? []).map((n) => n.text).join('')

    this.codeEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault()
        this.exitBlock()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        this.insertAtCaret('\n')
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        this.insertAtCaret('  ')
        return
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        this.handleArrow(e)
      }
    })

    this.codeEl.addEventListener('input', () => void this.syncAll())

    pre.append(this.highlightEl, this.codeEl)
    body.append(this.lineNumbersEl, pre)
    this.appendChild(body)

    void this.syncAll()
  }

  private insertAtCaret(text: string): void {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    range.deleteContents()
    const node = document.createTextNode(text)
    range.insertNode(node)
    range.setStartAfter(node)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    void this.syncAll()
  }

  private async syncHighlight(): Promise<void> {
    const text = this.codeEl.textContent ?? ''
    const lang = this.langEl.value.toLowerCase()
    const resolvedKey = LANG_ALIASES[lang] ?? lang

    await loadGrammar(resolvedKey)
    const grammar = Prism.languages[resolvedKey]
    if (grammar) {
      this.highlightEl.innerHTML = Prism.highlight(text, grammar, resolvedKey)
    } else {
      // Unknown language: display as plain text (textContent escapes HTML safely)
      this.highlightEl.textContent = text
    }
  }

  private syncLineNumbers(): void {
    const lines = (this.codeEl.textContent ?? '').split('\n')
    const count = Math.max(lines.length, 1)
    this.lineNumbersEl.innerHTML = Array.from(
      { length: count },
      (_, i) => `<div>${i + 1}</div>`
    ).join('')
  }

  private async syncAll(): Promise<void> {
    this.syncLineNumbers()
    await this.syncHighlight()
  }

  private copyCode(): void {
    navigator.clipboard.writeText(this.codeEl.textContent ?? '').then(() => {
      this.copyIconEl.style.display = 'none'
      this.checkIconEl.style.display = ''
      setTimeout(() => {
        this.copyIconEl.style.display = ''
        this.checkIconEl.style.display = 'none'
      }, 1500)
    })
  }

  override updateData(block: Block): void {
    super.updateData(block)
    if (this.codeEl) {
      this.codeEl.textContent = (block.content ?? []).map((n) => n.text).join('')
      this.langEl.value = block.attrs?.language ?? 'plaintext'
      void this.syncAll()
    }
  }

  getContent(): Block {
    return {
      ...this.block,
      content: [{ text: this.codeEl.textContent ?? '' }],
      attrs: { ...this.block.attrs, language: this.langEl.value },
    }
  }

  focusBlock(offset?: number): void {
    this.codeEl.focus()
    if (offset !== undefined) this.setCaret(this.codeEl, offset)
  }

  private exitBlock(): void {
    this.ctx.manager.update(this.block.id, {
      content: [{ text: this.codeEl.textContent ?? '' }],
    })
    const newBlock = this.ctx.manager.add('paragraph', { content: [], afterId: this.block.id })
    requestAnimationFrame(() => {
      const el = this.ctx.editorEl.querySelector(
        `[data-block-id="${newBlock.id}"] [contenteditable]`
      ) as HTMLElement | null
      el?.focus()
    })
  }
}

if (!customElements.get('pila-code')) {
  customElements.define('pila-code', CodeBlock)
}

