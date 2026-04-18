import { Block } from '../types'
import { PilaBlock } from './PilaBlock'
import { ImagePropsModal } from '../ui/ImagePropsModal'

export class ImageBlock extends PilaBlock {
  private img!: HTMLImageElement
  private caption!: HTMLElement
  private figure!: HTMLElement
  private overlay!: HTMLDivElement
  private modal: ImagePropsModal | null = null

  protected buildDOM(): void {
    // ── Figure wrapper ────────────────────────────────────────────────────
    // position:relative on the wrapper lets the overlay be positioned inside
    this.figure = document.createElement('figure')
    this.figure.className = 'relative inline-block max-w-full m-0'
    // display:table enables margin:auto centering
    this.figure.style.cssText = 'display: table; margin: 4px 0; margin-right: auto;'

    // ── Image ─────────────────────────────────────────────────────────────
    this.img = document.createElement('img')
    this.img.src = this.block.attrs?.src ?? ''
    this.img.alt = this.block.attrs?.alt ?? ''
    this.img.className = 'block max-w-full rounded-[var(--pila-radius)] outline-none'
    this.img.setAttribute('tabindex', '0')
    this.applyImageStyles()

    this.img.addEventListener('focus', () => {
      this.img.style.outline = '2px solid var(--pila-accent)'
      this.img.style.outlineOffset = '2px'
    })
    this.img.addEventListener('blur', () => {
      this.img.style.outline = ''
      this.img.style.outlineOffset = ''
    })

    this.img.addEventListener('keydown', (e: KeyboardEvent) => {
      this.handleArrow(e)
      if (e.key === 'Enter') {
        e.preventDefault()
        const newBlock = this.ctx.manager.add('paragraph', { content: [], afterId: this.block.id })
        requestAnimationFrame(() => {
          const el = this.ctx.editorEl.querySelector(
            `[data-block-id="${newBlock.id}"] [contenteditable]`
          ) as HTMLElement | null
          el?.focus()
        })
        return
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        this.ctx.manager.delete(this.block.id)
      }
    })

    // ── Caption ───────────────────────────────────────────────────────────
    this.caption = document.createElement('figcaption')
    this.caption.setAttribute('contenteditable', 'true')
    // keep pila-image-caption for :empty::before CSS
    this.caption.className =
      'pila-image-caption mt-[6px] text-[0.85rem] text-[color:var(--pila-muted)] ' +
      'text-center outline-none whitespace-pre-wrap'
    this.caption.textContent = this.block.attrs?.alt ?? ''
    this.caption.addEventListener('input', () => {
      this.img.alt = this.caption.textContent ?? ''
    })

    // ── Hover overlay with Edit button ────────────────────────────────────
    this.overlay = document.createElement('div')
    this.overlay.className =
      'absolute top-1.5 right-1.5 opacity-0 transition-opacity pointer-events-none'
    this.overlay.setAttribute('aria-hidden', 'true')

    const editBtn = document.createElement('button')
    editBtn.type = 'button'
    editBtn.title = 'Edit image properties'
    editBtn.className =
      'flex items-center gap-1 px-2 py-1 text-xs rounded shadow ' +
      'bg-[var(--pila-bg)] border border-[var(--pila-border)] ' +
      'text-[var(--pila-text)] cursor-pointer transition-colors ' +
      'hover:bg-[var(--pila-accent)] hover:text-white hover:border-[var(--pila-accent)]'
    editBtn.innerHTML = '&#9881; Edit'
    editBtn.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      this.openPropsModal()
    })
    this.overlay.appendChild(editBtn)

    // Show overlay on figure hover
    const showOverlay = () => {
      this.overlay.classList.remove('opacity-0', 'pointer-events-none')
      this.overlay.classList.add('opacity-100', 'pointer-events-auto')
    }
    const hideOverlay = () => {
      this.overlay.classList.add('opacity-0', 'pointer-events-none')
      this.overlay.classList.remove('opacity-100', 'pointer-events-auto')
    }
    this.figure.addEventListener('mouseenter', showOverlay)
    this.figure.addEventListener('mouseleave', hideOverlay)

    // ── Assemble ──────────────────────────────────────────────────────────
    this.figure.appendChild(this.img)
    this.figure.appendChild(this.overlay)
    this.figure.appendChild(this.caption)
    this.appendChild(this.figure)
  }

  private async openPropsModal(): Promise<void> {
    if (!this.modal) {
      this.modal = new ImagePropsModal()
    }
    const result = await this.modal.open(this.block.attrs ?? {})
    if (result === null) return

    const newAttrs = {
      ...(this.block.attrs ?? {}),
      width:           result.width  || undefined,
      height:          result.height || undefined,
      alt:             result.alt,
      tailwindClasses: result.tailwindClasses || undefined,
    }

    this.ctx.manager.update(this.block.id, { attrs: newAttrs })
  }

  private applyImageStyles(): void {
    const { width, height, tailwindClasses } = this.block.attrs ?? {}
    this.img.style.width  = width  ?? ''
    this.img.style.height = height ?? ''
    this.img.className = tailwindClasses
      ? `block max-w-full rounded-[var(--pila-radius)] outline-none ${tailwindClasses}`
      : 'block max-w-full rounded-[var(--pila-radius)] outline-none'
    this.applyFigureAlignment(this.block.attrs?.alignment as 'left' | 'center' | 'right' | undefined)
  }

  private applyFigureAlignment(value: 'left' | 'center' | 'right' | undefined): void {
    if (!this.figure) return
    if (!value || value === 'left') {
      this.figure.style.marginLeft = ''
      this.figure.style.marginRight = 'auto'
    } else if (value === 'center') {
      this.figure.style.marginLeft = 'auto'
      this.figure.style.marginRight = 'auto'
    } else if (value === 'right') {
      this.figure.style.marginLeft = 'auto'
      this.figure.style.marginRight = ''
    }
  }

  override updateData(block: Block): void {
    super.updateData(block)
    if (this.img) {
      this.img.src = block.attrs?.src ?? ''
      this.img.alt = block.attrs?.alt ?? ''
      this.caption.textContent = block.attrs?.alt ?? ''
      this.applyImageStyles()
    }
  }

  override destroy(): void {
    this.modal?.destroy()
    super.destroy()
  }

  getContent(): Block {
    return {
      ...this.block,
      attrs: {
        ...this.block.attrs,
        alt: this.caption?.textContent ?? this.block.attrs?.alt ?? '',
      },
    }
  }

  focusBlock(): void {
    this.img.focus()
  }
}

if (!customElements.get('pila-image')) {
  customElements.define('pila-image', ImageBlock)
}
