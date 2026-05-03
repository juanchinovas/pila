import { BlockManager } from '../core/BlockManager'
import { icon, Icons } from './icons'
import { BlockPopover } from './BlockPopover'

export class DragHandle {
  private editorEl: HTMLElement
  private manager: BlockManager
  private overlayRoot: HTMLElement
  private popover: BlockPopover
  private handleEl!: HTMLElement
  private dropIndicator!: HTMLElement;
  private addingBelowBtn!: HTMLButtonElement;
  private draggingBtn!: HTMLButtonElement;
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
  private onDragEnd!: () => void;
  private onAddingNewBlock!: null | (() => void);

  constructor(editorEl: HTMLElement, manager: BlockManager, overlayRoot: HTMLElement = document.body) {
    this.editorEl = editorEl
    this.manager = manager
    this.overlayRoot = overlayRoot
    this.popover = new BlockPopover(overlayRoot)
  }

  mount(onAddingNewBlock?: (blockId?: string) => void): void {
    // Grip handle (shown on hover) — position:fixed so no scroll-offset math needed
    this.handleEl = document.createElement('div');
    this.handleEl.className = 'pila-drag-handle';
    this.handleEl.setAttribute('draggable', 'true');
    this.handleEl.setAttribute('aria-label', 'Drag to reorder');
    this.addingBelowBtn = document.createElement('button');
    this.addingBelowBtn.type = 'button';
    this.addingBelowBtn.classList.add('p-0.5');
    this.addingBelowBtn.title = 'Insert new block';
    this.addingBelowBtn.appendChild(icon(Icons.Plus, 18));
    this.handleEl.appendChild(this.addingBelowBtn);

    this.draggingBtn = document.createElement('button');
    this.draggingBtn.appendChild(icon(Icons.GripVertical, 18));
    this.draggingBtn.classList.add('p-0.5');
    this.draggingBtn.title = 'Drag to reorder\nclick for more actions';
    this.handleEl.appendChild(this.draggingBtn);

    this.draggingBtn.addEventListener('click', (e) => {
      const blockId = this.handleEl.dataset.blockId
      if (blockId) {
        this.openPopover(e, blockId)
      }
    })

    this.handleEl.style.display = 'none'
    this.overlayRoot.appendChild(this.handleEl)

    if (onAddingNewBlock) {
      this.onAddingNewBlock = 
      () => onAddingNewBlock(this.handleEl.dataset.blockId ?? undefined);

      this.addingBelowBtn.addEventListener('click', this.onAddingNewBlock);
    }

    // Drop indicator line
    this.dropIndicator = document.createElement('div')
    this.dropIndicator.className = 'pila-drop-indicator'
    this.dropIndicator.style.display = 'none'
    this.overlayRoot.appendChild(this.dropIndicator)

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
    
    if (this.onAddingNewBlock) {
      this.addingBelowBtn.removeEventListener('click', this.onAddingNewBlock)
      this.onAddingNewBlock = null;
    }

    this.popover.close()
    this.cancelHide()
    this.handleEl?.remove()
    this.dropIndicator?.remove()
  }

  private openPopover(_: MouseEvent, blockId: string): void {
    const rect = this.draggingBtn.getBoundingClientRect()
    const block = this.manager.getById(blockId)

    const bgColors = [
      { name: 'Default', bg: 'transparent' },
      { name: 'Gray',    bg: 'var(--pila-code-bg)' },
      { name: 'Blue',    bg: 'rgba(59, 130, 246, 0.1)' },
      { name: 'Green',   bg: 'rgba(34, 197, 94, 0.1)' },
      { name: 'Yellow',  bg: 'rgba(234, 179, 8, 0.1)' },
      { name: 'Red',     bg: 'rgba(239, 68, 68, 0.1)' },
    ]

    const textColors = [
      { name: 'Default', text: 'inherit' },
      { name: 'Gray',    text: 'var(--pila-muted)' },
      { name: 'Blue',    text: 'rgb(37, 99, 235)' },
      { name: 'Green',   text: 'rgb(21, 128, 61)' },
      { name: 'Yellow',  text: 'rgb(161, 98, 7)' },
      { name: 'Red',     text: 'rgb(185, 28, 28)' },
    ]

    const bgActions = bgColors.map(c => ({
      label: c.name,
      icon: 'Square' as const,
      color: c.bg,
      handler: () => {
        this.manager.update(blockId, {
          attrs: { ...(block?.attrs ?? {}), background: c.bg }
        });
        this.changeBlockBackground(blockId, c.bg);
      }
    }))

    // Add custom bg color input
    bgActions.push({
      label: 'Custom...',
      icon: 'Plus',
      color: '', // Ensure color is at least an empty string if checked
      handler: (_: MouseEvent) => {
        const input = document.createElement('input')
        input.type = 'color'
        input.className = 'pila-custom-color-input'
        input.style.position = 'absolute'
        input.style.opacity = '0'
        input.addEventListener('input', (ev: any) => {
          this.manager.update(blockId, {
            attrs: { ...(block?.attrs ?? {}), background: ev.target.value }
          });
          this.changeBlockBackground(blockId, `lch(from ${ev.target.value} l c calc(h + 180))`);

          this.popover.close()
        })
        document.body.appendChild(input)
        input.click()
        setTimeout(() => input.remove(), 1000)
      }
    } as any)

    const textActions = textColors.map(c => ({
      label: c.name,
      icon: 'Type' as const,
      color: c.text === 'inherit' ? 'transparent' : c.text,
      handler: () => {
        this.manager.update(blockId, {
          attrs: { ...(block?.attrs ?? {}), textColor: c.text }
        })
        this.changeBlockTextColor(blockId, c.text);
      }
    }))

    // Add custom text color input
    textActions.push({
      label: 'Custom...',
      icon: 'Plus',
      color: '', // Ensure color is at least an empty string
      handler: (_: MouseEvent) => {
        const input = document.createElement('input')
        input.type = 'color'
        input.className = 'pila-custom-color-input'
        input.style.position = 'absolute'
        input.style.opacity = '0'
        input.addEventListener('input', (ev: any) => {
          this.manager.update(blockId, {
            attrs: { ...(block?.attrs ?? {}), textColor: ev.target.value }
          });
          this.changeBlockTextColor(blockId, ev.target.value);

          this.popover.close()
        })
        document.body.appendChild(input)
        input.click()
        setTimeout(() => input.remove(), 1000)
      }
    } as any)

    this.popover.open(rect.right + 5, rect.top, [
      {
        label: 'Background',
        icon: 'Paintbucket',
        children: bgActions
      },
      {
        label: 'Text Color',
        icon: 'Type',
        children: textActions
      },
      { 
        label: 'Duplicate', 
        icon: 'Copy', 
        shortcut: '⌘D', 
        handler: () => {
          this.manager.duplicate(blockId)
        } 
      },
      { 
        label: 'Delete', 
        icon: 'Trash2', 
        shortcut: 'Del', 
        danger: true, 
        handler: () => {
          this.manager.remove(blockId)
        } 
      }
    ])
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
    this.handleEl.style.left = `${rect.left - 52}px`
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

  private changeBlockBackground(blockId: string, color: string): void {
    const wrapper = this.editorEl.querySelector(
      `[data-block-id="${blockId}"][contenteditable]`
    ) as HTMLElement | null
    
    if (!wrapper) return;
console.log('Changing background of block', blockId, 'to', color, wrapper)
    if (wrapper.nodeName === 'PILA-QUOTE') {
      wrapper.style.setProperty('--pila-block-background', color);
      wrapper.style.setProperty('--pila-quote-border', color);
    } else {
      wrapper.style.setProperty('background-color', color)
    }
  }

  private changeBlockTextColor(blockId: string, color: string): void {
    const wrapper = this.editorEl.querySelector(
      `[data-block-id="${blockId}"][contenteditable]`
    ) as HTMLElement | null

    if (!wrapper) return;
    console.log('Changing text color of block', blockId, 'to', color, wrapper)
    if (wrapper.nodeName === 'PILA-QUOTE') {
      wrapper.style.setProperty('--pila-quote-text', color)
    } else {
      wrapper.style.setProperty('color', color)
    }
  }
}
