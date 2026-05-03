import { BlockAttrs } from '../types'

export interface ImagePropsResult {
  src?: string
  width: string
  height: string
  alt: string
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  borderRadius?: string
}

export class ImagePropsPopover {
  private overlayRoot: HTMLElement
  private popoverEl: HTMLElement | null = null
  private srcField!: HTMLInputElement
  private widthField!: HTMLInputElement
  private heightField!: HTMLInputElement
  private altField!: HTMLInputElement
  private objectFitField!: HTMLSelectElement
  private borderRadiusField!: HTMLInputElement
  
  private resolveFn: ((result: ImagePropsResult | null) => void) | null = null

  private readonly FIELD_CLASS =
    'w-full px-2 py-1 text-xs rounded border border-[var(--pila-border)] ' +
    'bg-[var(--pila-bg)] text-[var(--pila-text)] outline-none ' +
    'focus:border-[var(--pila-accent)] focus:ring-1 focus:ring-[var(--pila-accent)]'

  private readonly LABEL_CLASS = 'block text-[10px] uppercase font-bold text-[var(--pila-muted)] mb-1'

  constructor(overlayRoot: HTMLElement = document.body) {
    this.overlayRoot = overlayRoot
  }

  async open(x: number, y: number, attrs: BlockAttrs): Promise<ImagePropsResult | null> {
    this.close()

    return new Promise((resolve) => {
      this.resolveFn = resolve

      this.popoverEl = document.createElement('div')
      this.popoverEl.className = 'pila-image-props-popover'
      this.popoverEl.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        z-index: 10000;
        width: 240px;
        background: var(--pila-slash-bg);
        border: 1px solid var(--pila-slash-border);
        border-radius: var(--pila-radius);
        box-shadow: var(--pila-shadow);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `

      // Fields
      const uploadContainer = document.createElement('div')
      uploadContainer.className = 'flex flex-col gap-1'

      const separator = document.createElement('div')
      separator.className = 'flex items-center justify-center p-1';
      separator.innerHTML = `<span class="text-[var(--pila-muted)] text-xs">or</span>`

      const uploadArea = this.makeFileInputField()
      uploadContainer.appendChild(uploadArea);
      uploadContainer.appendChild(separator);

      this.popoverEl.appendChild(uploadArea)

      this.popoverEl.appendChild(this.makeField('Source', 'text', attrs.src ?? '', (el) => {
        this.srcField = el as HTMLInputElement;
        el.addEventListener('input', (ev) => {
          uploadArea.querySelector('img')?.setAttribute('src', ev.target instanceof HTMLInputElement ? ev.target.value : '');
        })
      }));
      
      uploadArea.querySelector('img')?.setAttribute('src', attrs.src ?? '');
      
      const dims = document.createElement('div')
      dims.style.display = 'flex'
      dims.style.gap = '8px'
      dims.appendChild(this.makeField('Width', 'text', attrs.width ?? '', (el) => this.widthField = el as HTMLInputElement))
      dims.appendChild(this.makeField('Height', 'text', attrs.height ?? '', (el) => this.heightField = el as HTMLInputElement))
      this.popoverEl.appendChild(dims)

      this.popoverEl.appendChild(this.makeField('Alt Text', 'text', attrs.alt ?? '', (el) => this.altField = el as HTMLInputElement))
      
      // Object Fit
      const fitWrapper = document.createElement('div')
      const fitLabel = document.createElement('label')
      fitLabel.className = this.LABEL_CLASS
      fitLabel.textContent = 'Object Fit'
      this.objectFitField = document.createElement('select')
      this.objectFitField.className = this.FIELD_CLASS
      ;['fill', 'contain', 'cover', 'none', 'scale-down'].forEach(opt => {
        const o = document.createElement('option')
        o.value = opt
        o.textContent = opt
        if (attrs.objectFit === opt) o.selected = true
        this.objectFitField.appendChild(o)
      })
      fitWrapper.appendChild(fitLabel)
      fitWrapper.appendChild(this.objectFitField)
      this.popoverEl.appendChild(fitWrapper)

      this.popoverEl.appendChild(this.makeField('Border Radius (px)', 'text', attrs.borderRadius ?? '', (el) => this.borderRadiusField = el as HTMLInputElement))

      const actions = document.createElement('div')
      actions.style.display = 'flex'
      actions.style.justifyContent = 'flex-end'
      actions.style.gap = '8px'
      actions.style.marginTop = '4px'

      const cancelBtn = document.createElement('button')
      cancelBtn.textContent = 'Cancel'
      cancelBtn.className = 'px-3 py-1 text-xs rounded border border-[var(--pila-border)] text-[var(--pila-muted)] hover:bg-[var(--pila-border)]'
      cancelBtn.onclick = () => this.cancel()

      const saveBtn = document.createElement('button')
      saveBtn.textContent = 'Save'
      saveBtn.className = 'px-3 py-1 text-xs rounded bg-[var(--pila-accent)] text-white hover:opacity-90'
      saveBtn.onclick = () => this.confirm()

      actions.appendChild(cancelBtn)
      actions.appendChild(saveBtn)
      this.popoverEl.appendChild(actions)

      this.overlayRoot.appendChild(this.popoverEl)

      // Close on outside click
      const onMouseDown = (e: MouseEvent) => {
        if (this.popoverEl && !this.popoverEl.contains(e.target as Node)) {
          this.cancel()
          document.removeEventListener('mousedown', onMouseDown)
        }
      }
      document.addEventListener('mousedown', onMouseDown)
    })
  }

  private makeField(label: string, type: string, value: string, ref: (el: HTMLElement) => void): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.style.flex = '1'
    const lbl = document.createElement('label')
    lbl.className = this.LABEL_CLASS
    lbl.textContent = label
    const input = document.createElement('input')
    input.type = type
    input.value = value
    input.className = this.FIELD_CLASS
    ref(input)
    wrapper.appendChild(lbl)
    wrapper.appendChild(input)
    return wrapper
  }

  private makeFileInputField() {
  // Fields
    const uploadArea = document.createElement('div')
    uploadArea.className = 'relative flex flex-col items-center justify-center gap-1 h-36 rounded border border-dashed border-[var(--pila-border)] transition-colors'
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

  private confirm(): void {
    if (this.resolveFn) {
      this.resolveFn({
        src: this.srcField.value,
        width: this.widthField.value,
        height: this.heightField.value,
        alt: this.altField.value,
        objectFit: this.objectFitField.value as any,
        borderRadius: this.borderRadiusField.value
      })
    }
    this.close()
  }

  private cancel(): void {
    if (this.resolveFn) this.resolveFn(null)
    this.close()
  }

  private close(): void {
    if (this.popoverEl) {
      this.popoverEl.remove()
      this.popoverEl = null
    }
    this.resolveFn = null
  }
}
