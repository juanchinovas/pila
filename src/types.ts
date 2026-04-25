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
}

export interface TableRow {
  cells: TableCell[]
}

// ─── Columns ─────────────────────────────────────────────────────────────────

export interface ColumnDef {
  /** flex-grow factor controlling column width relative to siblings. Default: 1 (equal). */
  width?: number
  blocks: Block[]
}

// ─── Block Attrs ─────────────────────────────────────────────────────────────

export interface BlockAttrs {
  checked?: boolean      // todo
  language?: string      // code
  src?: string           // image
  alt?: string           // image
  width?: string         // image (CSS value e.g. '50%', '400px')
  height?: string        // image (CSS value e.g. '200px', 'auto')
  tailwindClasses?: string // image — freeform Tailwind classes on <img>
  href?: string           // button
  buttonStyle?: 'primary' | 'secondary' | 'outline'  // button
  icon?: string          // callout
  color?: string         // callout (legacy, overridden by flavor)
  flavor?: 'info' | 'warning' | 'error' | 'success' | 'tip'  // callout
  rows?: TableRow[]      // table
  headerRow?: boolean    // table — legacy: first row is header (use headerRows instead)
  headerCol?: boolean    // table — legacy: first col is header (use headerCols instead)
  headerRows?: number[]  // table — row indices rendered as header rows
  headerCols?: number[]  // table — col indices rendered as <th>
  columnDefs?: ColumnDef[] // columns block
  level?: 1 | 2 | 3     // heading
  alignment?: 'left' | 'center' | 'right' | 'justify'  // text / image
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
  | 'button'

/** Plugin-registered custom types use plain strings. */
export type BlockType = BuiltinBlockType | string

// ─── Block ───────────────────────────────────────────────────────────────────

export interface Block {
  id: string
  type: BlockType
  content?: InlineNode[]
  attrs?: BlockAttrs
  children?: Block[]
}

// ─── Plugin API ───────────────────────────────────────────────────────────────

export interface SlashMenuItemDescriptor {
  type: BlockType
  name: string
  description: string
  icon: string
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
}

// ─── Editor Events ───────────────────────────────────────────────────────────

export interface EditorEvents {
  'block:add': { block: Block; index: number }
  'block:update': { id: string; block: Block }
  'block:delete': { id: string }
  'block:move': { id: string; toIndex: number }
  'blocks:change': { blocks: Block[] }
}
