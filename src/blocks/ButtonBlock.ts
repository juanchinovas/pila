import { Block } from '../types'
import { PilaBlock } from './PilaBlock'
import { InlineParser } from '../inline/InlineParser'
import { InlineRenderer } from '../inline/InlineRenderer'
import { icon as makeIcon, Icons } from '../ui/icons'

type ButtonStyle = 'primary' | 'secondary' | 'outline'

export class ButtonBlock extends PilaBlock {
  private labelEl!: HTMLElement
  private btnEl!: HTMLAnchorElement
  private editBar!: HTMLDivElement
  private hrefInput!: HTMLInputElement
  private wrapperEl!: HTMLDivElement

  protected buildDOM(): void {
    this.classList.add('pila-button-block')
    // Needed so the absolutely-positioned edit bar is contained within this element
    this.style.position = 'relative'
    this.style.display = 'block'

    this.wrapperEl = document.createElement('div')
    this.wrapperEl.style.padding = '2px 0'
    this.applyWrapperAlignment(this.block.attrs?.alignment)

    // The visual <a> — click is prevented in editor so it doesn't navigate.
    // CSS classes are kept for the HTML serializer; inline styles drive the editor appearance.
    this.btnEl = document.createElement('a')
    this.btnEl.href = this.block.attrs?.href ?? '#'
    this.btnEl.className = `pila-button pila-button--${this.block.attrs?.buttonStyle ?? 'primary'}`
    this.btnEl.setAttribute('role', 'button')
    // Prevent navigation and forward focus to the editable label
    this.btnEl.addEventListener('click', (e) => {
      e.preventDefault()
      this.labelEl.focus()
    })
    this.applyButtonInlineStyles(this.block.attrs?.buttonStyle ?? 'primary')

    // Editable label
    this.labelEl = document.createElement('span')
    this.labelEl.setAttribute('contenteditable', 'true')
    this.labelEl.setAttribute('spellcheck', 'true')
    this.labelEl.style.outline = 'none'
    this.labelEl.style.color = 'inherit'
    InlineRenderer.render(this.labelEl, this.block.content?.length ? this.block.content : [{ text: 'Button' }])

    this.btnEl.appendChild(this.labelEl)

    // Edit bar shown on focus
    this.editBar = this.buildEditBar()

    // Focus / blur
    this.labelEl.addEventListener('focus', () => this.showEditBar())
    this.labelEl.addEventListener('blur', (e) => {
      // Keep bar open if focus moves into the edit bar (e.g. clicking the URL input)
      if (!this.editBar.contains(e.relatedTarget as Node)) {
        this.hideEditBar()
      }
    })
    // Show bar when input is focused directly (e.g. tab from label)
    this.hrefInput.addEventListener('focus', () => this.showEditBar())
    this.hrefInput.addEventListener('blur', (e) => {
      if (
        !this.labelEl.contains(e.relatedTarget as Node) &&
        !this.editBar.contains(e.relatedTarget as Node)
      ) {
        this.hideEditBar()
      }
    })

    // Keyboard handling
    this.labelEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        this.commitLabel()
        const newBlock = this.ctx.manager.add('paragraph', { content: [], afterId: this.block.id })
        requestAnimationFrame(() => {
          const el = this.ctx.editorEl.querySelector(
            `[data-block-id="${newBlock.id}"] [contenteditable]`
          ) as HTMLElement | null
          el?.focus()
        })
        return
      }
      if (e.key === 'Backspace' && this.labelEl.textContent === '') {
        e.preventDefault()
        this.ctx.manager.delete(this.block.id)
        return
      }
      this.handleArrow(e)
    })

    this.wrapperEl.appendChild(this.btnEl)
    this.appendChild(this.wrapperEl)
    // Edit bar is outside wrapperEl so it floats absolutely over page content
    this.appendChild(this.editBar)
  }

  // ── Inline style helpers ──────────────────────────────────────────────────

  private applyButtonInlineStyles(style: ButtonStyle | string): void {
    const s = this.btnEl.style
    s.display = 'inline-flex'
    s.alignItems = 'center'
    s.justifyContent = 'center'
    s.padding = '8px 20px'
    s.borderRadius = 'var(--pila-radius, 6px)'
    s.fontSize = '0.95rem'
    s.fontWeight = '500'
    s.cursor = 'text'
    s.textDecoration = 'none'
    s.userSelect = 'text'
    s.transition = 'opacity 0.15s'
    s.minWidth = '80px'
    switch (style) {
      case 'secondary':
        s.background = 'var(--pila-border, #e2e8f0)'
        s.color = 'var(--pila-text, #1a1a1a)'
        s.border = '2px solid var(--pila-border, #e2e8f0)'
        break
      case 'outline':
        s.background = 'transparent'
        s.color = 'var(--pila-accent, #2563eb)'
        s.border = '2px solid var(--pila-accent, #2563eb)'
        break
      default: // primary
        s.background = 'var(--pila-accent, #2563eb)'
        s.color = '#fff'
        s.border = '2px solid var(--pila-accent, #2563eb)'
    }
  }

  private applyStyleBtnInline(btn: HTMLButtonElement, active: boolean): void {
    btn.style.cssText =
      'display:inline-flex;align-items:center;justify-content:center;' +
      'padding:3px 7px;font-size:0.75rem;border-radius:4px;cursor:pointer;font-family:inherit;' +
      (active
        ? 'background:var(--pila-accent,#2563eb);color:#fff;border:1px solid var(--pila-accent,#2563eb);'
        : 'background:var(--pila-bg,#fff);color:var(--pila-text,#1a1a1a);border:1px solid var(--pila-border,#e2e8f0);')
  }

  private applyWrapperAlignment(alignment?: string): void {
    if (!this.wrapperEl) return
    this.wrapperEl.style.textAlign =
      alignment === 'center' ? 'center' :
      alignment === 'right'  ? 'right'  : 'left'
  }

  // ── Edit bar ──────────────────────────────────────────────────────────────

  private buildEditBar(): HTMLDivElement {
    const bar = document.createElement('div')
    bar.style.cssText =
      'display:none;position:absolute;left:0;top:calc(100% + 4px);z-index:50;' +
      'align-items:center;gap:6px;flex-wrap:wrap;min-width:280px;' +
      'padding:5px 8px;background:var(--pila-bg,#fff);' +
      'border:1px solid var(--pila-border,#e2e8f0);' +
      'border-radius:var(--pila-radius,6px);' +
      'box-shadow:var(--pila-shadow,0 4px 12px rgba(0,0,0,.1));' +
      'font-size:0.8rem;font-family:var(--pila-font,sans-serif);'

    // Prevent blur on the label when clicking buttons in the bar,
    // but NOT on the input (preventDefault on input stops it from focusing)
    bar.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault()
    })

    // ── URL input ──────────────────────────────────────────────────────────
    this.hrefInput = document.createElement('input')
    this.hrefInput.type = 'url'
    this.hrefInput.placeholder = 'https://...'
    this.hrefInput.style.cssText =
      'flex:1;min-width:140px;padding:3px 8px;font-size:0.8rem;' +
      'border:1px solid var(--pila-border,#e2e8f0);border-radius:4px;outline:none;' +
      'background:var(--pila-bg,#fff);color:var(--pila-text,#1a1a1a);font-family:inherit;'
    this.hrefInput.value = this.block.attrs?.href ?? ''
    this.hrefInput.addEventListener('input', () => {
      const href = this.hrefInput.value
      this.btnEl.href = href || '#'
      this.ctx.manager.update(this.block.id, { attrs: { href: href || undefined } })
    })

    // ── Style toggle ───────────────────────────────────────────────────────
    const styleGroup = document.createElement('div')
    styleGroup.style.cssText = 'display:flex;gap:2px;'

    for (const s of ['primary', 'secondary', 'outline'] as const) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = s.charAt(0).toUpperCase() + s.slice(1)
      this.applyStyleBtnInline(btn, (this.block.attrs?.buttonStyle ?? 'primary') === s)
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault()
        this.btnEl.className = `pila-button pila-button--${s}`
        this.applyButtonInlineStyles(s)
        styleGroup.querySelectorAll('button').forEach((b) =>
          this.applyStyleBtnInline(b as HTMLButtonElement, false)
        )
        this.applyStyleBtnInline(btn, true)
        this.ctx.manager.update(this.block.id, { attrs: { buttonStyle: s } })
      })
      styleGroup.appendChild(btn)
    }

    // ── Alignment toggle ───────────────────────────────────────────────────
    const alignGroup = document.createElement('div')
    alignGroup.style.cssText = 'display:flex;gap:2px;'

    const alignIcons: Record<string, typeof Icons.AlignLeft> = {
      left:   Icons.AlignLeft,
      center: Icons.AlignCenter,
      right:  Icons.AlignRight,
    }
    for (const a of ['left', 'center', 'right'] as const) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.title = a.charAt(0).toUpperCase() + a.slice(1)
      btn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;'
      btn.appendChild(makeIcon(alignIcons[a], 14))
      this.applyStyleBtnInline(btn, (this.block.attrs?.alignment ?? 'left') === a)
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault()
        this.applyWrapperAlignment(a)
        alignGroup.querySelectorAll('button').forEach((b) =>
          this.applyStyleBtnInline(b as HTMLButtonElement, false)
        )
        this.applyStyleBtnInline(btn, true)
        this.ctx.manager.update(this.block.id, { attrs: { alignment: a } })
      })
      alignGroup.appendChild(btn)
    }

    bar.appendChild(this.hrefInput)
    bar.appendChild(styleGroup)
    bar.appendChild(alignGroup)
    return bar
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  private showEditBar(): void {
    this.editBar.style.display = 'flex'
  }

  private hideEditBar(): void {
    this.editBar.style.display = 'none'
    this.commitLabel()
  }

  private commitLabel(): void {
    const nodes = InlineParser.parse(this.labelEl)
    this.ctx.manager.update(this.block.id, { content: nodes })
  }

  override updateData(block: Block): void {
    super.updateData(block)
    if (this.labelEl) {
      InlineRenderer.render(this.labelEl, block.content?.length ? block.content : [{ text: 'Button' }])
      const style = block.attrs?.buttonStyle ?? 'primary'
      this.btnEl.className = `pila-button pila-button--${style}`
      this.applyButtonInlineStyles(style)
      this.btnEl.href = block.attrs?.href ?? '#'
      this.hrefInput.value = block.attrs?.href ?? ''
      this.applyWrapperAlignment(block.attrs?.alignment)
    }
  }

  getContent(): Block {
    return { ...this.block }
  }

  focusBlock(): void {
    this.labelEl?.focus()
  }
}

if (!customElements.get('pila-button')) {
  customElements.define('pila-button', ButtonBlock)
}
