import { icon, Icons } from './icons'

export interface BlockAction {
  label: string
  icon: keyof typeof Icons
  shortcut?: string
  danger?: boolean
  color?: string
  handler?: (e: MouseEvent) => void
  children?: BlockAction[]
}

export class BlockPopover {
  private overlayRoot: HTMLElement
  private popoverEl: HTMLElement | null = null
  private activeSubmenu: HTMLElement | null = null
  private onKeyDownBound = this.handleKeyDown.bind(this)
  private onClickOutsideBound = this.handleClickOutside.bind(this)
  private selectedIndex = -1

  constructor(overlayRoot: HTMLElement = document.body) {
    this.overlayRoot = overlayRoot
  }

  open(x: number, y: number, actions: BlockAction[]): void {
    this.close()

    this.popoverEl = this.renderActions(actions, false)
    this.overlayRoot.appendChild(this.popoverEl)
    
    // Position
    this.popoverEl.style.position = 'fixed'
    this.popoverEl.style.top = `${y}px`
    this.popoverEl.style.left = `${x}px`
    this.popoverEl.style.zIndex = '10000'

    // Events
    document.addEventListener('keydown', this.onKeyDownBound, true)
    document.addEventListener('mousedown', this.onClickOutsideBound, true)
  }

  private renderActions(actions: BlockAction[], isSubmenu: boolean): HTMLElement {
    const el = document.createElement('div')
    el.className = 'pila-block-popover'
    // Stop all mouse events from propagating to siblings/parents (like DragHandle)
    el.addEventListener('mousedown', (e) => e.stopPropagation())
    el.addEventListener('mouseup',   (e) => e.stopPropagation())
    el.addEventListener('click',     (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
    
    // Set a smaller width for submenus if they contain colors
    if (actions.some(a => a.color)) {
      el.style.width = '180px'
    } else {
      el.style.width = '240px'
    }

    actions.forEach((action, idx) => {
      const item = document.createElement('div')
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.dataset.index = idx.toString()
      item.className = `pila-popover-item ${action.danger ? 'pila-popover-item--danger' : ''}`
      
      const iconWrap = document.createElement('span')
      iconWrap.className = 'pila-popover-icon'
      
      if (action.color) {
        const circle = document.createElement('span')
        circle.style.width = '12px'
        circle.style.height = '12px'
        circle.style.borderRadius = '50%'
        circle.style.backgroundColor = action.color
        circle.style.border = '1px solid var(--pila-border)'
        // Ensure valid color for CSS, otherwise transparent
        if (action.color === 'transparent') {
          circle.style.background = 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
          circle.style.backgroundSize = '4px 4px'
          circle.style.backgroundPosition = '0 0, 2px 2px'
        }
        iconWrap.appendChild(circle)
      } else {
        iconWrap.appendChild(icon(Icons[action.icon], 16))
      }
      
      const label = document.createElement('span')
      label.className = 'pila-popover-label'
      label.textContent = action.label
      
      item.appendChild(iconWrap)
      item.appendChild(label)
      
      if (action.shortcut) {
        const shortcut = document.createElement('span')
        shortcut.className = 'pila-popover-shortcut'
        shortcut.textContent = action.shortcut
        item.appendChild(shortcut)
      }

      if (action.children) {
        const arrow = document.createElement('span')
        arrow.style.marginLeft = 'auto'
        arrow.style.opacity = '0.5'
        arrow.innerHTML = '&#9656;' // Small right arrow
        item.appendChild(arrow)

        item.addEventListener('mouseenter', () => {
          this.closeSubmenu()
          // Use a small delay for submenu opening to improve UX
          requestAnimationFrame(() => {
            const rect = item.getBoundingClientRect()
            this.openSubmenu(rect.right + 2, rect.top - 4, action.children!)
          })
        })
      } else {
        item.addEventListener('mouseenter', () => {
          if (!isSubmenu) {
            this.closeSubmenu()
          }
        })
      }
      
      item.addEventListener('mousedown', (e) => {
        if (action.handler) {
          e.preventDefault()
          e.stopPropagation()
          action.handler(e)
          // Don't close if it's a special input or we want it to stay open
          // But usually we close. For custom color inputs, we'll need to handle it.
          if (!(e.target as HTMLElement).closest('.pila-custom-color-input')) {
            this.close()
          }
        }
      })
      
      el.appendChild(item)
    })

    return el
  }

  private openSubmenu(x: number, y: number, actions: BlockAction[]): void {
    this.closeSubmenu()
    this.activeSubmenu = this.renderActions(actions, true)
    this.overlayRoot.appendChild(this.activeSubmenu)
    
    // Ensure the submenu stays within the viewport
    this.activeSubmenu.style.position = 'fixed'
    this.activeSubmenu.style.top = `${y}px`
    this.activeSubmenu.style.left = `${x}px`
    this.activeSubmenu.style.zIndex = '10001'
    this.activeSubmenu.style.minWidth = '140px'
    this.activeSubmenu.style.width = 'auto' // Allow submenu to be narrower than parent

    const rect = this.activeSubmenu.getBoundingClientRect()
    if (rect.right > window.innerWidth) {
      // Flip left if it overflows, and ensure a small gap from main menu
      const parentWidth = this.popoverEl?.offsetWidth ?? 240
      this.activeSubmenu.style.left = `${x - rect.width - parentWidth - 4}px` 
    }
  }

  private closeSubmenu(): void {
    if (this.activeSubmenu) {
      this.activeSubmenu.remove()
      this.activeSubmenu = null
    }
  }

  close(): void {
    this.closeSubmenu()
    if (this.popoverEl) {
      this.popoverEl.remove()
      this.popoverEl = null
      this.selectedIndex = -1
      document.removeEventListener('keydown', this.onKeyDownBound, true)
      document.removeEventListener('mousedown', this.onClickOutsideBound, true)
    }
  }

  private handleClickOutside(e: MouseEvent): void {
    const target = e.target as Node
    // Check if the click is inside any active popover or submenu
    const isInsideMain = this.popoverEl?.contains(target)
    const isInsideSub = this.activeSubmenu?.contains(target)
    
    if (!isInsideMain && !isInsideSub) {
      this.close()
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.close()
      return
    }

    if (!this.popoverEl) return

    const items = Array.from(this.popoverEl.querySelectorAll('.pila-popover-item')) as HTMLElement[]
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      this.selectedIndex = (this.selectedIndex + 1) % items.length
      this.updateSelection(items)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length
      this.updateSelection(items)
    } else if (e.key === 'Enter') {
      if (this.selectedIndex >= 0) {
        e.preventDefault()
        e.stopPropagation()
        items[this.selectedIndex]?.click()
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      if (e.shiftKey) {
        this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length
      } else {
        this.selectedIndex = (this.selectedIndex + 1) % items.length
      }
      this.updateSelection(items)
    }
  }

  private updateSelection(items: HTMLElement[]): void {
    items.forEach((item, idx) => {
      item.classList.toggle('pila-popover-item--selected', idx === this.selectedIndex)
    })
    items[this.selectedIndex]?.scrollIntoView({ block: 'nearest' })
  }
}
