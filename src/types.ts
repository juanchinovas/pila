// ─── Inline ──────────────────────────────────────────────────────────────────

export interface InlineNode {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
  underline?: boolean
  link?: string
}

// ─── Table ───────────────────────────────────────────────────────────────────

export interface TableCell {
  content: InlineNode[]
  align?: 'left' | 'center' | 'right'
  colspan?: number
  rowspan?: number
  background?: string
  color?: string
  width?: string
  /** If set, this cell is hidden/covered by the master cell at (row, col) in a merge. */
  mergedTo?: { row: number; col: number }
}

export interface TableRow {
  cells: TableCell[]
}

// ─── Columns ─────────────────────────────────────────────────────────────────

export interface ColumnDef {
  /** flex-grow factor controlling column width relative to siblings. Default: 1 (equal). */
  width?: number
  blocks: Block[]
  background?: string
  color?: string
}

// ─── Emoji Plugin Surface ───────────────────────────────────────────────────

export interface EmojiItem {
  emoji: string
  name: string
  keywords?: string[]
  insertText?: string
}

export interface EmojiQueryContext {
  editorEl: HTMLElement
  activeBlockId: string | null
  target: HTMLElement | null
  textBeforeCaret: string
}

export interface EmojiProviderDescriptor {
  key: string
  priority?: number
  search(query: string, context: EmojiQueryContext): EmojiItem[] | Promise<EmojiItem[]>
}

// ─── Block Attrs ─────────────────────────────────────────────────────────────

export interface BlockAttrs {
  checked?: boolean      // todo
  language?: string      // code
  src?: string           // image
  alt?: string           // image
  width?: string         // image (CSS value e.g. '50%', '400px')
  height?: string        // image (CSS value e.g. '200px', 'auto')
  href?: string           // button
  buttonStyle?: 'primary' | 'secondary' | 'outline'  // button
  icon?: string          // callout
  color?: string         // callout (legacy, overridden by flavor)
  flavor?: 'info' | 'warning' | 'error' | 'success' | 'tip'  // callout
  background?: string    // global bg for blocks
  textColor?: string     // global text color for blocks
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down' // image
  borderRadius?: string  // image
  rows?: TableRow[]      // table
  headerRow?: boolean    // table — legacy: first row is header (use headerRows instead)
  headerCol?: boolean    // table — legacy: first col is header (use headerCols instead)
  headerRows?: number[]  // table — row indices rendered as header rows
  headerCols?: number[]  // table — col indices rendered as <th>
  columnDefs?: ColumnDef[] // columns block
  rowBlocks?: Block[]      // row block children
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none' // row border style
  borderWidth?: string     // row border width (e.g. '1px')
  borderColor?: string     // row border color (e.g. '#000')
  borderTop?: boolean      // row border top
  borderBottom?: boolean   // row border bottom
  borderLeft?: boolean     // row border left
  borderRight?: boolean    // row border right
  level?: 1 | 2 | 3     // heading
  alignment?: 'left' | 'center' | 'right' | 'justify'  // text / image
  tailwindClasses?: string // optional exported class list for HTML serializer
  style?: string          // optional exported inline style declarations
}

// ─── Block Types ─────────────────────────────────────────────────────────────

export type BuiltinBlockType =
  | 'paragraph'
  | 'heading1' | 'heading2' | 'heading3'
  | 'bulletList' | 'numberedList'
  | 'todo'
  | 'code'
  | 'quote' | 'callout'
  | 'divider'
  | 'image'
  | 'table'
  | 'columns'
  | 'row'
  | 'button';

/** Plugin-registered custom types use plain strings. */
export type BlockType = BuiltinBlockType | string;

// ─── Block ───────────────────────────────────────────────────────────────────

export interface Block {
  id?: string;
  type: BlockType;
  content?: InlineNode[];
  attrs?: BlockAttrs;
  children?: Block[];
}

// ─── Plugin API ───────────────────────────────────────────────────────────────

export interface SlashMenuItemDescriptor {
  type: BlockType
  name: string
  description: string
  icon: string
  defaultAttrs?: Partial<BlockAttrs>
}

export interface ToolbarButtonDescriptor {
  label: string
  title: string
  markName?: string   // used for active-state tracking
  command: () => void
}

/** Passed to `plugin.install()`. Provides safe access to editor internals. */
export interface PilaPluginAPI {
  /** The root editor DOM element. */
  readonly editorEl: HTMLElement
  /** Access and mutate blocks. */
  readonly manager: import('./core/BlockManager').BlockManager
  /**
   * Register a custom block type. The factory receives a Block and
   * must return an HTMLElement that will be placed inside `.pila-block`.
   */
  registerBlockType(descriptor: CustomBlockDescriptor): void
  /** Add an emoji result provider consumed by the inline emoji popover. */
  registerEmojiProvider(descriptor: EmojiProviderDescriptor): void
  /** Add a button to the floating toolbar. */
  addToolbarButton(descriptor: ToolbarButtonDescriptor): void
  /** Subscribe to editor events. Returns an unsubscribe function. */
  on<K extends keyof EditorEvents>(event: K, handler: (payload: EditorEvents[K]) => void): () => void
}

export interface CustomBlockDescriptor {
  /** Unique string identifier for this block type. */
  type: string
  /**
   * Factory that renders the block. Receives the Block data and returns
   * the inner HTMLElement (will be wrapped in .pila-block automatically).
   */
  factory: (block: Block) => HTMLElement
  /** Optional slash-menu registration. */
  slashItem?: Omit<SlashMenuItemDescriptor, 'type'>
}

/** A Pila plugin module. */
export interface PilaPlugin {
  /** Unique plugin name (used for de-duplication). */
  name: string
  /** Called once when the plugin is installed. */
  install(api: PilaPluginAPI): void
}

// ─── Editor Options ──────────────────────────────────────────────────────────

export interface EditorOptions {
  placeholder?: string
  initialContent?: Block[]
  onChange?: (blocks: Block[]) => void
  /** Plugins to install on mount. */
  plugins?: PilaPlugin[]
  /** 
   * Root element for floating UI (popovers, menus, toolbars). 
   * Useful when the editor is inside a modal or fixed container.
   * Defaults to document.body.
   */
  portalTo?: HTMLElement | (() => HTMLElement | null)
}

// ─── Editor Events ───────────────────────────────────────────────────────────

export interface EditorEvents {
  'block:add': { block: Block; index: number }
  'block:update': { id: string; block: Block }
  'block:delete': { id: string }
  'block:move': { id: string; toIndex: number }
  'blocks:change': { blocks: Block[] }
}

export interface SerializerOptions {
  fullDocument?: boolean;
  includeCSS?: boolean
}
