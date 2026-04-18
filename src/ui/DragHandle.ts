import { BlockManager } from '../core/BlockManager'
import { icon, Icons } from './icons'

export class DragHandle {
  private editorEl: HTMLElement
  private manager: BlockManager
  private handleEl!: HTMLElement
  private dropIndicator!: HTMLElement
  private dragBlockId: string | null = null
  private isPointerDown = false
  private isDragging = false
  private hideTimeout: ReturnType<typeof setTimeout> | null = null

  private onEditorMouseOver!: (e: MouseEvent) => void
  private onEditorMouseOut!:  (e: MouseEvent) => void
  private onHandleMouseEnter!: () => void
  private onHandlePointerDown!: () => void
  private onDocPointerUp!: () => void
  private onDocPointerCancel!: () => void
  private onDragStart!: (e: DragEvent) => void
  private onDocDragOver!: (e: DragEvent) => void
  private onDocDrop!:     (e: DragEvent) => void
  private onDragEnd!: () => void

  constructor(editorEl: HTMLElement, manager: BlockManager) {
    this.editorEl = editorEl
    this.manager = manager
  }

  mount(): void {
    // Grip handle (shown on hover) — position:fixed so no scroll-offset math needed
    this.handleEl = document.createElement('div')
    this.handleEl.className = 'pila-drag-handle'
    this.handleEl.setAttribute('draggable', 'true')
    this.handleEl.setAttribute('aria-label', 'Drag to reorder')
    this.handleEl.appendChild(icon(Icons.GripVertical, 18))
    this.handleEl.style.display = 'none'
    document.body.appendChild(this.handleEl)

    // Drop indicator line
    this.dropIndicator = document.createElement('div')
    this.dropIndicator.className = 'pila-drop-indicator'
    this.dropIndicator.style.display = 'none'
    document.body.appendChild(this.dropIndicator)

    this.onEditorMouseOver  = (e) => this.handleMouseOver(e)
    this.onEditorMouseOut   = (e) => this.handleMouseOut(e)
    this.onHandleMouseEnter = () => this.cancelHide()
    this.onHandlePointerDown = () => { this.isPointerDown = true }
    this.onDocPointerUp     = () => { this.isPointerDown = false }
    this.onDocPointerCancel  = () => { this.isPointerDown = false }
    this.onDragStart        = (e) => this.handleDragStart(e)
    this.onDocDragOver      = (e) => this.handleDragOver(e)
    this.onDocDrop          = (e) => this.handleDrop(e)
    this.onDragEnd          = () => this.handleDragEnd()

    this.editorEl.addEventListener('mouseover',  this.onEditorMouseOver)
    this.editorEl.addEventListener('mouseout',   this.onEditorMouseOut)
    this.handleEl.addEventListener('mouseenter', this.onHandleMouseEnter)
    this.handleEl.addEventListener('pointerdown', this.onHandlePointerDown)
    document.addEventListener('pointerup',     this.onDocPointerUp)
    document.addEventListener('pointercancel', this.onDocPointerCancel)
    this.handleEl.addEventListener('dragstart', this.onDragStart)
    this.handleEl.addEventListener('dragend',   this.onDragEnd)
    document.addEventListener('dragover', this.onDocDragOver)
    document.addEventListener('drop',     this.onDocDrop)
  }

  destroy(): void {
    this.editorEl.removeEventListener('mouseover',  this.onEditorMouseOver)
    this.editorEl.removeEventListener('mouseout',   this.onEditorMouseOut)
    this.handleEl?.removeEventListener('mouseenter', this.onHandleMouseEnter)
    this.handleEl?.removeEventListener('pointerdown', this.onHandlePointerDown)
    document.removeEventListener('pointerup',     this.onDocPointerUp)
    document.removeEventListener('pointercancel', this.onDocPointerCancel)
    this.handleEl?.removeEventListener('dragstart', this.onDragStart)
    this.handleEl?.removeEventListener('dragend',   this.onDragEnd)
    document.removeEventListener('dragover', this.onDocDragOver)
    document.removeEventListener('drop',     this.onDocDrop)
    this.cancelHide()
    this.handleEl?.remove()
    this.dropIndicator?.remove()
  }

  private cancelHide(): void {
    if (this.hideTimeout) { clearTimeout(this.hideTimeout); this.hideTimeout = null }
  }

  private scheduleHide(): void {
    this.cancelHide()
    this.hideTimeout = setTimeout(() => { this.handleEl.style.display = 'none' }, 200)
  }

  private getBlockWrapper(target: Element): HTMLElement | null {
    return target.closest('.pila-block') as HTMLElement | null
  }

  private positionHandle(wrapper: HTMLElement): void {
    const rect = wrapper.getBoundingClientRect()
    // position:fixed — coords are already viewport-relative, no scrollY needed
    this.handleEl.style.top  = `${rect.top + rect.height / 2 - 12}px`
    this.handleEl.style.left = `${rect.left - 28}px`
  }

  private handleMouseOver(e: MouseEvent): void {
    this.cancelHide()
    const wrapper = this.getBlockWrapper(e.target as Element)
    if (!wrapper) return
    // Blocks inside a column editor are handled by that column's own DragHandle
    if (wrapper.closest('.pila-column-editor')) return

    this.handleEl.dataset.blockId = wrapper.dataset.blockId ?? ''
    this.handleEl.style.display = 'flex'
    this.positionHandle(wrapper)
  }

  private handleMouseOut(e: MouseEvent): void {
    if (this.isDragging || this.isPointerDown) return
    const rel = e.relatedTarget as Element | null
    // Don't hide when cursor moves to the handle itself
    if (rel && (rel === this.handleEl || this.handleEl.contains(rel))) return
    if (!rel || !this.editorEl.contains(rel)) {
      this.scheduleHide()
    }
  }

  private handleDragStart(e: DragEvent): void {
    this.cancelHide()
    this.isDragging = true
    this.dragBlockId = this.handleEl.dataset.blockId ?? null
    if (!this.dragBlockId) return

    // Custom MIME type — prevents browsers inserting the id as text into
    // contenteditable targets on drop.
    e.dataTransfer?.setData('application/x-pila-block-id', this.dragBlockId)
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'

    const wrapper = this.editorEl.querySelector(
      `[data-block-id="${this.dragBlockId}"]`
    ) as HTMLElement | null
    if (wrapper) wrapper.style.opacity = '0.4'
  }

  private nearestBlock(clientY: number): HTMLElement | null {
    const blocks = Array.from(this.editorEl.querySelectorAll<HTMLElement>('.pila-block'))
    let closest: HTMLElement | null = null
    let minDist = Infinity
    for (const b of blocks) {
      const r = b.getBoundingClientRect()
      const dist = Math.abs(clientY - (r.top + r.height / 2))
      if (dist < minDist) { minDist = dist; closest = b }
    }
    return closest
  }

  private handleDragOver(e: DragEvent): void {
    if (!this.isDragging) return
    // Allow drop everywhere while our drag is active; the indicator only
    // appears when the cursor is over the editor.
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'

    const target = e.target as Element
    const overEditor = this.editorEl === target || this.editorEl.contains(target)
    if (!overEditor) { this.dropIndicator.style.display = 'none'; return }

    const wrapper = this.getBlockWrapper(target) ?? this.nearestBlock(e.clientY)
    if (!wrapper) { this.dropIndicator.style.display = 'none'; return }

    const rect = wrapper.getBoundingClientRect()
    const insertAfter = e.clientY > rect.top + rect.height / 2

    // position:fixed — no scroll offset needed
    this.dropIndicator.style.display = 'block'
    this.dropIndicator.style.left    = `${rect.left}px`
    this.dropIndicator.style.width   = `${rect.width}px`
    this.dropIndicator.style.top     = insertAfter ? `${rect.bottom}px` : `${rect.top}px`

    this.dropIndicator.dataset.targetId    = wrapper.dataset.blockId ?? ''
    this.dropIndicator.dataset.insertAfter = String(insertAfter)
  }

  private handleDrop(e: DragEvent): void {
    if (!this.isDragging) return

    // Always prevent default to stop browsers inserting dragged text into
    // any contenteditable that happens to be under the cursor.
    e.preventDefault()

    const target = e.target as Element
    const overEditor = this.editorEl === target || this.editorEl.contains(target)
    if (!overEditor) { this.handleDragEnd(); return }
    if (!this.dragBlockId) return

    const targetId    = this.dropIndicator.dataset.targetId
    const insertAfter = this.dropIndicator.dataset.insertAfter === 'true'

    if (!targetId || targetId === this.dragBlockId) { this.handleDragEnd(); return }

    const allBlocks  = this.manager.getAll()
    const targetIndex = allBlocks.findIndex((b) => b.id === targetId)
    if (targetIndex === -1) { this.handleDragEnd(); return }

    const toIndex = insertAfter ? targetIndex + 1 : targetIndex
    this.manager.move(this.dragBlockId, toIndex)
    this.handleDragEnd()
  }

  private handleDragEnd(): void {
    this.isDragging   = false
    this.isPointerDown = false
    if (this.dragBlockId) {
      const wrapper = this.editorEl.querySelector(
        `[data-block-id="${this.dragBlockId}"]`
      ) as HTMLElement | null
      if (wrapper) wrapper.style.opacity = ''
    }
    this.dragBlockId = null
    this.dropIndicator.style.display = 'none'
    this.handleEl.style.display = 'none'
  }
}
