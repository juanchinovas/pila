// ─── Editor ───────────────────────────────────────────────────────────────────
export { PilaEditor } from './core/Editor'

// ─── Serializers ──────────────────────────────────────────────────────────────
export { JsonSerializer } from './serializers/JsonSerializer'
export { HtmlSerializer } from './serializers/HtmlSerializer'
export { MarkdownSerializer } from './serializers/MarkdownSerializer'
export { EmailSerializer } from './serializers/EmailSerializer'

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  Block,
  BlockType,
  BuiltinBlockType,
  BlockAttrs,
  InlineNode,
  TableCell,
  TableRow,
  ColumnDef,
  EditorOptions,
  EditorEvents,
  // Plugin API
  PilaPlugin,
  PilaPluginAPI,
  CustomBlockDescriptor,
  SlashMenuItemDescriptor,
  ToolbarButtonDescriptor,
} from './types'

// ─── Icons (for consumer use, e.g. demos / plugins) ──────────────────────────
export { icon, Icons } from './ui/icons'
export type { LucideIconNode } from './ui/icons'

// ─── Styles ───────────────────────────────────────────────────────────────────
import './styles/pila.css'
