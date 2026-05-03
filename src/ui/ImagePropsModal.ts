import { BlockAttrs } from '../types'

export interface ImagePropsResult {
  width: string
  height: string
  alt: string
}

export class ImagePropsModal {
  private overlayRoot: HTMLElement
  private backdrop!: HTMLDivElement
  private dialog!: HTMLDivElement
  private srcField!: HTMLInputElement
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

  constructor(overlayRoot: HTMLElement = document.body) {
    this.overlayRoot = overlayRoot
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
    const separator = document.createElement('div')
    separator.className = 'flex items-center justify-center p-1';
    separator.innerHTML = `<span class="text-[var(--pila-muted)] text-xs">or</span>`

    const uploadArea = this.makeFileInputField()
    fields.appendChild(uploadArea);
    fields.appendChild(separator);
    fields.appendChild(this.makeField('URL', 'src', false, (el) => {
      this.srcField = el as HTMLInputElement;
      el.addEventListener('input', (ev) => {
        uploadArea.querySelector('img')?.setAttribute('src', ev.target instanceof HTMLInputElement ? ev.target.value : '');
      })
    }));

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

  private makeFileInputField() {
    // Fields
      const uploadArea = document.createElement('div')
      uploadArea.className = 'relative flex flex-col items-center justify-center gap-1 h-40 rounded border border-dashed border-[var(--pila-border)] transition-colors'
      const uploadBtn = document.createElement('button')
      uploadBtn.type = 'button'
      uploadBtn.textContent = 'Upload Image'
      uploadBtn.className = 'fixed bg-black/60 rounded px-3 py-1.5 text-xs text-white hover:border-[var(--pila-accent)] hover:bg-black/80'
      
      const imagePreview = document.createElement('img')
      imagePreview.className = 'max-h-40 object-contain'
      uploadArea.appendChild(imagePreview)

      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.accept = 'image/*'
      fileInput.style.display = 'none'
      
      uploadBtn.onclick = () => fileInput.click()
      fileInput.onchange = (e: any) => {
        const file = e.target.files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (rev) => {
            const dataUrl = rev.target?.result as string
            this.srcField.value = dataUrl;
            imagePreview.src = dataUrl;
          }
          reader.readAsDataURL(file)
        }
      }
      
      uploadArea.appendChild(uploadBtn);

      return uploadArea;
  }
  /**
   * Opens the modal pre-filled with `attrs` and resolves with the edited
   * values when the user confirms, or `null` when cancelled.
   */
  open(attrs: BlockAttrs): Promise<ImagePropsResult | null> {
    this.srcField.value = attrs.src ?? ''

    this.backdrop.style.display = 'flex'
    this.overlayRoot.appendChild(this.backdrop)

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

    this.backdrop.style.display = 'flex'
    this.overlayRoot.appendChild(this.backdrop)

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
      width: '',
      height: '',
      alt: ''
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
