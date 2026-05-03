export interface EmojiItem {
  emoji: string
  name: string
}

const EMOJIS: EmojiItem[] = [
  { emoji: '😀', name: 'grinning' },
  { emoji: '😃', name: 'smiley' },
  { emoji: '😄', name: 'smile' },
  { emoji: '😁', name: 'grin' },
  { emoji: '😆', name: 'laughing' },
  { emoji: '😅', name: 'sweat_smile' },
  { emoji: '🤣', name: 'rofl' },
  { emoji: '😂', name: 'joy' },
  { emoji: '🙂', name: 'slightly_smiling' },
  { emoji: '🙃', name: 'upside_down' },
  { emoji: '😉', name: 'wink' },
  { emoji: '😊', name: 'blush' },
  { emoji: '😇', name: 'innocent' },
  { emoji: '🥰', name: 'smiling_face_with_three_hearts' },
  { emoji: '😍', name: 'heart_eyes' },
  { emoji: '🤩', name: 'star_eyes' },
  { emoji: '😘', name: 'kissing_heart' },
  { emoji: '😗', name: 'kissing' },
  { emoji: '☺️', name: 'relaxed' },
  { emoji: '😚', name: 'kissing_closed_eyes' },
  { emoji: '😙', name: 'kissing_smiling_eyes' },
  { emoji: '😋', name: 'yum' },
  { emoji: '😛', name: 'stuck_out_tongue' },
  { emoji: '😜', name: 'stuck_out_tongue_winking_eye' },
  { emoji: '🤪', name: 'zany' },
  { emoji: '😝', name: 'stuck_out_tongue_closed_eyes' },
  { emoji: '🤑', name: 'money_mouth' },
  { emoji: '🤗', name: 'hugs' },
  { emoji: '🤭', name: 'hand_over_mouth' },
  { emoji: '🤫', name: 'shushing' },
  { emoji: '🤔', name: 'thinking' },
  { emoji: '🤐', name: 'zipper_mouth' },
  { emoji: '🤨', name: 'raised_eyebrow' },
  { emoji: '😐', name: 'neutral_face' },
  { emoji: '😑', name: 'expressionless' },
  { emoji: '😶', name: 'no_mouth' },
  { emoji: '😏', name: 'smirk' },
  { emoji: '😒', name: 'unamused' },
  { emoji: '🙄', name: 'roll_eyes' },
  { emoji: '😬', name: 'grimacing' },
  { emoji: '🤥', name: 'lying' },
  { emoji: '😌', name: 'relieved' },
  { emoji: '😔', name: 'pensive' },
  { emoji: '😪', name: 'sleepy' },
  { emoji: '🤤', name: 'drooling' },
  { emoji: '😴', name: 'sleeping' },
  { emoji: '😷', name: 'mask' },
  { emoji: '🤒', name: 'face_with_thermometer' },
  { emoji: '🤕', name: 'face_with_head_bandage' },
  { emoji: '🤢', name: 'nauseated' },
  { emoji: '🤮', name: 'vomiting' },
  { emoji: '🤧', name: 'sneezing' },
  { emoji: '🥵', name: 'hot' },
  { emoji: '🥶', name: 'cold' },
  { emoji: '🥴', name: 'woozy' },
  { emoji: '😵', name: 'dizzy' },
  { emoji: '🤯', name: 'exploding_head' },
  { emoji: '🤠', name: 'cowboy' },
  { emoji: '🥳', name: 'partying' },
  { emoji: '😎', name: 'sunglasses' },
  { emoji: '🤓', name: 'nerd' },
  { emoji: '🧐', name: 'monocle' },
  { emoji: '😕', name: 'confused' },
  { emoji: '😟', name: 'worried' },
  { emoji: '🙁', name: 'slightly_frowning' },
  { emoji: '😮', name: 'open_mouth' },
  { emoji: '😯', name: 'hushed' },
  { emoji: '😲', name: 'astonished' },
  { emoji: '😳', name: 'flushed' },
  { emoji: '🥺', name: 'pleading' },
  { emoji: '😦', name: 'frowning' },
  { emoji: '😧', name: 'anguished' },
  { emoji: '😨', name: 'fearful' },
  { emoji: '😰', name: 'cold_sweat' },
  { emoji: '😥', name: 'disappointed_relieved' },
  { emoji: '😢', name: 'cry' },
  { emoji: '😭', name: 'sob' },
  { emoji: '😱', name: 'scream' },
  { emoji: '😖', name: 'confounded' },
  { emoji: '😣', name: 'persevere' },
  { emoji: '😞', name: 'disappointed' },
  { emoji: '😓', name: 'sweat' },
  { emoji: '😩', name: 'weary' },
  { emoji: '😫', name: 'tired' },
  { emoji: '🥱', name: 'yawning' },
  { emoji: '😤', name: 'triumph' },
  { emoji: '😡', name: 'pout' },
  { emoji: '😠', name: 'angry' },
  { emoji: '🤬', name: 'cursing' },
  { emoji: '😈', name: 'smiling_imp' },
  { emoji: '👿', name: 'imp' },
  { emoji: '💀', name: 'skull' },
  { emoji: '☠️', name: 'skull_and_crossbones' },
  { emoji: '💩', name: 'poop' },
  { emoji: '🤡', name: 'clown' },
  { emoji: '👹', name: 'ogre' },
  { emoji: '👺', name: 'goblin' },
  { emoji: '👻', name: 'ghost' },
  { emoji: '👽', name: 'alien' },
  { emoji: '👾', name: 'space_invader' },
  { emoji: '🤖', name: 'robot' },
  { emoji: '😺', name: 'smiley_cat' },
  { emoji: '😸', name: 'smile_cat' },
  { emoji: '😹', name: 'joy_cat' },
  { emoji: '😻', name: 'heart_eyes_cat' },
  { emoji: '😼', name: 'smirk_cat' },
  { emoji: '😽', name: 'kissing_cat' },
  { emoji: '🙀', name: 'scream_cat' },
  { emoji: '😿', name: 'crying_cat' },
  { emoji: '😾', name: 'pouting_cat' },
  { emoji: '💋', name: 'kiss' },
  { emoji: '👋', name: 'wave' },
  { emoji: '🤚', name: 'raised_back_of_hand' },
  { emoji: '🖐️', name: 'raised_hand_with_fingers_splayed' },
  { emoji: '✋', name: 'raised_hand' },
  { emoji: '🖖', name: 'vulcan_salute' },
  { emoji: '👌', name: 'ok_hand' },
  { emoji: '🤏', name: 'pinching_hand' },
  { emoji: '✌️', name: 'victory_hand' },
  { emoji: '🤞', name: 'fingers_crossed' },
  { emoji: '🤟', name: 'love_you_gesture' },
  { emoji: '🤘', name: 'rock_on' },
  { emoji: '🤙', name: 'call_me_hand' },
  { emoji: '👈', name: 'point_left' },
  { emoji: '👉', name: 'point_right' },
  { emoji: '👆', name: 'point_up' },
  { emoji: '🖕', name: 'middle_finger' },
  { emoji: '👇', name: 'point_down' },
  { emoji: '☝️', name: 'index_pointing_up' },
  { emoji: '👍', name: 'thumbsup' },
  { emoji: '👎', name: 'thumbsdown' },
  { emoji: '✊', name: 'raised_fist' },
  { emoji: '👊', name: 'oncoming_fist' },
  { emoji: '🤛', name: 'left_facing_fist' },
  { emoji: '🤜', name: 'right_facing_fist' },
  { emoji: '👏', name: 'clapping_hands' },
  { emoji: '🙌', name: 'raising_hands' },
  { emoji: '👐', name: 'open_hands' },
  { emoji: '🤲', name: 'palms_up_together' },
  { emoji: '🤝', name: 'handshake' },
  { emoji: '🙏', name: 'pray' },
  { emoji: '✍️', name: 'writing_hand' },
  { emoji: '💅', name: 'nail_polish' },
  { emoji: '🤳', name: 'selfie' },
  { emoji: '💪', name: 'muscle' },
  { emoji: '🦾', name: 'mechanical_arm' },
  { emoji: '🦵', name: 'leg' },
  { emoji: '🦿', name: 'mechanical_leg' },
  { emoji: '🦶', name: 'foot' },
  { emoji: '👂', name: 'ear' },
  { emoji: '🦻', name: 'ear_with_hearing_aid' },
  { emoji: '👃', name: 'nose' },
  { emoji: '🧠', name: 'brain' },
  { emoji: '🦷', name: 'tooth' },
  { emoji: '🦴', name: 'bone' },
  { emoji: '👀', name: 'eyes' },
  { emoji: '👁️', name: 'eye' },
  { emoji: '👅', name: 'tongue' },
  { emoji: '👄', name: 'mouth' },
  { emoji: '👶', name: 'baby' },
  { emoji: '🧒', name: 'child' },
  { emoji: '👦', name: 'boy' },
  { emoji: '👧', name: 'girl' },
  { emoji: '🧑', name: 'person' },
  { emoji: '👱', name: 'person_blonde_hair' },
  { emoji: '👨', name: 'man' },
  { emoji: '🧔', name: 'man_beard' },
  { emoji: '👩', name: 'woman' },
  { emoji: '🧡', name: 'orange_heart' },
  { emoji: '💛', name: 'yellow_heart' },
  { emoji: '💚', name: 'green_heart' },
  { emoji: '💙', name: 'blue_heart' },
  { emoji: '💜', name: 'purple_heart' },
  { emoji: '🖤', name: 'black_heart' },
  { emoji: '💔', name: 'broken_heart' },
  { emoji: '💯', name: '100' },
  { emoji: '💢', name: 'anger' },
  { emoji: '💥', name: 'boom' },
  { emoji: '💫', name: 'dizzy' },
  { emoji: '💦', name: 'sweat_drops' },
  { emoji: '💨', name: 'dash' },
  { emoji: '✨', name: 'sparkles' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '⭐', name: 'star' },
  { emoji: '🌟', name: 'star2' },
  { emoji: '☁️', name: 'cloud' },
  { emoji: '⚡', name: 'zap' },
  { emoji: '🌈', name: 'rainbow' },
  { emoji: '☀️', name: 'sun' },
  { emoji: '🎈', name: 'balloon' },
  { emoji: '🎉', name: 'tada' },
  { emoji: '🎊', name: 'confetti' },
  { emoji: '🏆', name: 'trophy' },
  { emoji: '⚽', name: 'soccer' },
  { emoji: '🏀', name: 'basketball' },
  { emoji: '🎮', name: 'video_game' },
  { emoji: '🎨', name: 'art' },
  { emoji: '💡', name: 'light_bulb' },
  { emoji: '💻', name: 'laptop' },
  { emoji: '📱', name: 'mobile_phone' },
  { emoji: '📷', name: 'camera' },
  { emoji: '🔒', name: 'lock' },
  { emoji: '🔑', name: 'key' },
  { emoji: '🍎', name: 'apple' },
  { emoji: '🍔', name: 'hamburger' },
  { emoji: '🍕', name: 'pizza' },
  { emoji: '🍺', name: 'beer' },
  { emoji: '☕', name: 'coffee' },
  { emoji: '🐶', name: 'dog' },
  { emoji: '🐱', name: 'cat' },
  { emoji: '🦄', name: 'unicorn' },
  { emoji: '🚀', name: 'rocket' },
  { emoji: '✅', name: 'check' },
  { emoji: '❌', name: 'cross' },
  { emoji: '⚠️', name: 'warning' },
  { emoji: '❤️', name: 'heart' },
]

export class EmojiPopover {
  private editorEl: HTMLElement
  private overlayRoot: HTMLElement
  private menuEl!: HTMLElement;
  private target!: HTMLElement;
  private inputEl!: HTMLInputElement
  private activeBlockId: string | null = null
  private filter = ''
  private selectedIndex = 0
  private filteredItems: EmojiItem[] = []
  private onClickOutsideBound = this.handleClickOutside.bind(this)
  private cleanupFunctions: (() => void)[] = []
  
  constructor(editorEl: HTMLElement, overlayRoot: HTMLElement = document.body) {
    this.editorEl = editorEl
    this.overlayRoot = overlayRoot
    this.mount()
  }

  private mount(): void {
    this.menuEl = document.createElement('div')
    this.menuEl.className = 'pila-slash-menu pila-emoji-popover flex flex-col'
    this.menuEl.style.display = 'none'
    
    const filterContainer = document.createElement('div')
    filterContainer.className = 'pila-emoji-filter-container p-2 border-b border-gray-100'
    
    this.inputEl = document.createElement('input')
    this.inputEl.type = 'text'
    this.inputEl.placeholder = 'Filter emojis...'
    this.inputEl.className = 'pila-emoji-filter-input w-full border border-gray-200 rounded px-2 py-1 outline-none text-sm'
    
    filterContainer.appendChild(this.inputEl)
    this.menuEl.appendChild(filterContainer)

    const listEl = document.createElement('div')
    listEl.className = 'pila-emoji-list max-h-[200px] overflow-y-auto p-1'
    this.menuEl.appendChild(listEl)

    this.overlayRoot.appendChild(this.menuEl)

    const onInput = () => {
      this.filter = this.inputEl.value.toLowerCase()
      this.selectedIndex = 0
      this.renderItems()
    }
    this.inputEl.addEventListener('input', onInput)
    this.cleanupFunctions.push(() => this.inputEl.removeEventListener('input', onInput))

    this.inputEl.addEventListener('keydown', this.handleKeyDown.bind(this))
    this.cleanupFunctions.push(() => this.inputEl.removeEventListener('keydown', this.handleKeyDown.bind(this)))
  }

  handleKeyDown(e: KeyboardEvent): boolean {
    if (!this.isOpen()) return false

    if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); this.moveSelection(1); return true }
    if (e.key === 'ArrowUp')   { e.preventDefault(); e.stopPropagation(); this.moveSelection(-1); return true }
    if (e.key === 'Tab')       { 
      e.preventDefault(); 
      e.stopPropagation(); 
      this.moveSelection(e.shiftKey ? -1 : 1); 
      return true 
    }
    if (e.key === 'Enter')     { e.preventDefault(); e.stopPropagation(); this.confirm(); return true }
    if (e.key === 'Escape')    { e.stopPropagation(); this.close(); return true }
    if (e.key === ' ')         { this.close(); return false }

    return false
  }

  handleInput(e: Event): void {
    this.target = e.target as HTMLElement;
    if (!this.target.hasAttribute('contenteditable')) return

    const text = this.target.textContent ?? ''
    const colonIdx = text.lastIndexOf(':');

    // Only open if the colon is the last character or followed by filter text with no spaces
    if (colonIdx !== -1 && (colonIdx === 0 || text[colonIdx - 1] === ' ')) {
      const rest = text.slice(colonIdx + 1)

      if (!rest.includes(' ')) {
        this.activeBlockId = this.target.dataset.blockId ?? null
        this.filter = rest.toLowerCase()
        this.selectedIndex = 0
        this.renderItems()
        if (this.filteredItems.length > 0) {
          const selection = window.getSelection()
          if (selection && selection.rangeCount > 0) {
            this.positionAtRange(selection.getRangeAt(0))
          } else {
            this.positionAt(this.target)
          }
          this.show()
          return
        }
      }
    }
    
    this.close()
  }

  private renderItems(): void {
    this.filteredItems = EMOJIS.filter(item => 
      !this.filter || item.name.includes(this.filter)
    ).slice(0, 50) // Limit results

    const listEl = this.menuEl.querySelector('.pila-emoji-list') as HTMLElement
    if (!listEl) return
    listEl.innerHTML = ''

    if (this.filteredItems.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'px-2 py-4 text-center text-gray-400 text-sm'
      empty.textContent = 'No emojis found'
      listEl.appendChild(empty)
      return
    }

    this.filteredItems.forEach((item, idx) => {
      const row = document.createElement('div')
      row.className = 'flex gap-1 items-center px-2 py-1 rounded cursor-pointer hover:bg-gray-100'
      row.tabIndex = 0
      if (idx === this.selectedIndex) {
        row.classList.add('bg-gray-100')
      }
      
      const emoji = document.createElement('span')
      emoji.className = 'pila-slash-icon !bg-transparent text-lg'
      emoji.textContent = item.emoji

      const name = document.createElement('span')
      name.className = 'pila-slash-name'
      name.textContent = `:${item.name}:`

      row.appendChild(emoji)
      row.appendChild(name)

      row.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.selectedIndex = idx
        this.confirm()
      })

      row.addEventListener('keydown', this.handleInput);
      listEl.appendChild(row)
    })
  }

  private moveSelection(delta: number): void {
    this.selectedIndex = (this.selectedIndex + delta + this.filteredItems.length) % this.filteredItems.length
    this.renderItems()
    const listEl = this.menuEl.querySelector('.pila-emoji-list') as HTMLElement
    const selected = listEl?.children[this.selectedIndex] as HTMLElement
    selected?.scrollIntoView({ block: 'nearest' })
  }

  private confirm(): void {
    const item = this.filteredItems[this.selectedIndex];
    if (!item) return

    const contentEl = this.editorEl.querySelector(
      `[data-block-id="${this.activeBlockId}"][contenteditable=true]`
    ) as HTMLElement | null ?? this.target;
    
    if (contentEl) {
      const text = contentEl.textContent ?? ''
      const colonIdx = text.lastIndexOf(':')
      if (colonIdx !== -1) {
        // Replace from the colon to the end of the text
        const before = text.slice(0, colonIdx)
        const newText = before + item.emoji
        contentEl.innerText = newText
        
        // Position cursor after emoji
        const firstNode = contentEl.firstChild || contentEl
        const range = document.createRange()
        const sel = window.getSelection()
        
        try {
          range.setStart(firstNode, newText.length)
          range.collapse(true)
          sel?.removeAllRanges()
          sel?.addRange(range)
        } catch (err) {
          contentEl.focus()
        }
        
        contentEl.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }

    this.close()
  }

  private positionAt(el: HTMLElement): void {
    const rect = el.getBoundingClientRect()
    this.menuEl.style.top = `${rect.bottom + window.scrollY + 4}px`
    this.menuEl.style.left = `${rect.left + window.scrollX}px`
  }

  private positionAtRange(range: Range): void {
    const rect = range.getBoundingClientRect()
    this.menuEl.style.top = `${rect.bottom + window.scrollY + 4}px`
    this.menuEl.style.left = `${rect.left + window.scrollX}px`
  }

  private show(): void {
    this.menuEl.style.display = 'flex'
    document.addEventListener('mousedown', this.onClickOutsideBound, true)
    this.inputEl.value = this.filter
    requestAnimationFrame(() => this.inputEl.focus())
  }

  private close(): void {
    this.menuEl.style.display = 'none'
    this.activeBlockId = null
    this.filter = ''
    document.removeEventListener('mousedown', this.onClickOutsideBound, true)
  }

  private handleClickOutside(e: MouseEvent): void {
    if (this.menuEl && !this.menuEl.contains(e.target as Node)) {
      this.close()
    }
  }

  private isOpen(): boolean {
    return this.menuEl.style.display !== 'none'
  }

  destroy(): void {
    this.cleanupFunctions.forEach(fn => fn())
    this.cleanupFunctions = []
    this.menuEl?.remove()
  }
}
