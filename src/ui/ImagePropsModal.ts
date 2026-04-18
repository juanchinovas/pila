import { BlockAttrs } from '../types'

export interface ImagePropsResult {
  width: string
  height: string
  alt: string
  tailwindClasses: string
}

export class ImagePropsModal {
  private backdrop!: HTMLDivElement
  private dialog!: HTMLDivElement
  private srcField!: HTMLInputElement
  private widthField!: HTMLInputElement
  private heightField!: HTMLInputElement
  private altField!: HTMLInputElement
  private twField!: HTMLInputElement
  private confirmBtn!: HTMLButtonElement
  private cancelBtn!: HTMLButtonElement

  private resolveFn: ((result: ImagePropsResult | null) => void) | null = null

  private readonly FIELD_CLASS =
    'w-full px-3 py-1.5 text-sm rounded border border-[var(--pila-border)] ' +
    'bg-[var(--pila-bg)] text-[var(--pila-text)] outline-none ' +
    'focus:border-[var(--pila-accent)] focus:ring-1 focus:ring-[var(--pila-accent)]'

  private readonly LABEL_CLASS = 'block text-xs font-medium text-[var(--pila-muted)] mb-1'

  private readonly BTN_BASE =
    'px-4 py-1.5 text-sm rounded cursor-pointer transition-colors'

  constructor() {
    this.buildDOM()
  }

  private buildDOM(): void {
    // Backdrop
    this.backdrop = document.createElement('div')
    this.backdrop.className =
      'fixed inset-0 z-[9998] flex items-center justify-center ' +
      'bg-black/40 backdrop-blur-sm'
    this.backdrop.setAttribute('role', 'dialog')
    this.backdrop.setAttribute('aria-modal', 'true')
    this.backdrop.setAttribute('aria-label', 'Image properties')
    this.backdrop.style.display = 'none'

    // Dialog panel
    this.dialog = document.createElement('div')
    this.dialog.className =
      'relative z-[9999] w-full max-w-sm rounded-xl shadow-xl ' +
      'bg-[var(--pila-bg)] border border-[var(--pila-border)] p-5 flex flex-col gap-4'

    // Title
    const title = document.createElement('h2')
    title.className = 'text-sm font-semibold text-[var(--pila-text)]'
    title.textContent = 'Image properties'

    // Fields
    const fields = document.createElement('div')
    fields.className = 'flex flex-col gap-3'

    fields.appendChild(this.makeField('Source', 'src', false, (el) => { this.srcField = el as HTMLInputElement }))
    fields.appendChild(this.makeField('Width (e.g. 50%, 300px)', 'width', false, (el) => { this.widthField = el as HTMLInputElement }))
    fields.appendChild(this.makeField('Height (e.g. 200px, auto)', 'height', false, (el) => { this.heightField = el as HTMLInputElement }))
    fields.appendChild(this.makeField('Alt / caption', 'alt', false, (el) => { this.altField = el as HTMLInputElement }))
    fields.appendChild(this.makeField('Tailwind classes', 'twClasses', false, (el) => { this.twField = el as HTMLInputElement }))

    // Action row
    const actions = document.createElement('div')
    actions.className = 'flex justify-end gap-2'

    this.cancelBtn = document.createElement('button')
    this.cancelBtn.type = 'button'
    this.cancelBtn.textContent = 'Cancel'
    this.cancelBtn.className =
      `${this.BTN_BASE} border border-[var(--pila-border)] text-[var(--pila-muted)] ` +
      'hover:bg-[var(--pila-border)]'

    this.confirmBtn = document.createElement('button')
    this.confirmBtn.type = 'button'
    this.confirmBtn.textContent = 'Confirm'
    this.confirmBtn.className =
      `${this.BTN_BASE} bg-[var(--pila-accent)] text-white ` +
      'hover:opacity-90'

    actions.appendChild(this.cancelBtn)
    actions.appendChild(this.confirmBtn)

    this.dialog.appendChild(title)
    this.dialog.appendChild(fields)
    this.dialog.appendChild(actions)
    this.backdrop.appendChild(this.dialog)

    // Events
    this.confirmBtn.addEventListener('click', () => this.confirm())
    this.cancelBtn.addEventListener('click', () => this.cancel())

    this.backdrop.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target === this.backdrop) this.cancel()
    })

    this.backdrop.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        this.cancel()
      }
      if (e.key === 'Enter' && e.target !== this.cancelBtn) {
        e.preventDefault()
        this.confirm()
      }
      // Tab cycling is handled natively — all fields are tabbable
    })
  }

  private makeField(
    labelText: string,
    name: string,
    readOnly: boolean,
    ref: (el: HTMLElement) => void,
  ): HTMLElement {
    const wrapper = document.createElement('div')

    const label = document.createElement('label')
    label.htmlFor = `pila-img-${name}`
    label.className = this.LABEL_CLASS
    label.textContent = labelText

    const input = document.createElement('input')
    input.type = 'text'
    input.id = `pila-img-${name}`
    input.name = name
    input.className = this.FIELD_CLASS
    if (readOnly) {
      input.readOnly = true
      input.tabIndex = -1
      input.className += ' opacity-60 cursor-default'
    }

    ref(input)
    wrapper.appendChild(label)
    wrapper.appendChild(input)
    return wrapper
  }

  /**
   * Opens the modal pre-filled with `attrs` and resolves with the edited
   * values when the user confirms, or `null` when cancelled.
   */
  open(attrs: BlockAttrs): Promise<ImagePropsResult | null> {
    this.srcField.value = attrs.src ?? ''
    this.widthField.value = attrs.width ?? ''
    this.heightField.value = attrs.height ?? ''
    this.altField.value = attrs.alt ?? ''
    this.twField.value = attrs.tailwindClasses ?? ''

    this.backdrop.style.display = 'flex'
    document.body.appendChild(this.backdrop)

    // Focus first editable field
    requestAnimationFrame(() => this.widthField.focus())

    return new Promise<ImagePropsResult | null>((resolve) => {
      this.resolveFn = resolve
    })
  }

  /**
   * Opens the modal for inserting a new image (src field is editable).
   * Resolves with `{ src, ...result }` or `null` when cancelled.
   */
  openInsert(): Promise<(ImagePropsResult & { src: string }) | null> {
    this.srcField.value = ''
    this.srcField.readOnly = false
    this.srcField.tabIndex = 0
    this.srcField.className = this.srcField.className
      .replace(' opacity-60 cursor-default', '')
    this.widthField.value = ''
    this.heightField.value = ''
    this.altField.value = ''
    this.twField.value = ''

    this.backdrop.style.display = 'flex'
    document.body.appendChild(this.backdrop)

    requestAnimationFrame(() => this.srcField.focus())

    return new Promise<(ImagePropsResult & { src: string }) | null>((resolve) => {
      this.resolveFn = (result) => {
        if (result === null) { resolve(null); return }
        resolve({ src: this.srcField.value.trim(), ...result })
      }
    })
  }

  private confirm(): void {
    this.close({
      width: this.widthField.value.trim(),
      height: this.heightField.value.trim(),
      alt: this.altField.value.trim(),
      tailwindClasses: this.twField.value.trim(),
    })
  }

  private cancel(): void {
    this.close(null)
  }

  private close(result: ImagePropsResult | null): void {
    this.backdrop.style.display = 'none'
    if (this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop)
    }
    if (this.resolveFn) {
      this.resolveFn(result)
      this.resolveFn = null
    }
  }

  /** Permanently removes the modal from memory. */
  destroy(): void {
    this.close(null)
  }
}
