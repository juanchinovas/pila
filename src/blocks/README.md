# Blocks

Pila ships 13 built-in block types. Each block is a Web Component that extends `PilaBlock` and is registered in the browser's Custom Elements registry.

All blocks share the same base `Block` interface:

```ts
interface Block {
  id: string          // unique string identifier
  type: BlockType     // e.g. 'paragraph', 'heading1', …
  content?: InlineNode[]  // rich-text content (most blocks)
  attrs?: BlockAttrs      // block-specific options
}
```

Inline content is an array of `InlineNode` objects:

```ts
interface InlineNode {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
  link?: string       // URL — only http/https/mailto are allowed
}
```

---

## paragraph

Plain text paragraph. The most common block type.

**Custom element:** `<pila-paragraph>`

**`content`:** `InlineNode[]`

**`attrs`:** none

**Example:**

```json
{
  "id": "1",
  "type": "paragraph",
  "content": [
    { "text": "Hello " },
    { "text": "world", "bold": true },
    { "text": "!" }
  ]
}
```

**Keyboard behaviour:**
- `Enter` — split into two paragraphs
- `Backspace` at start — merge with previous block
- `/` at start of empty block — open slash menu

---

## heading1 / heading2 / heading3

Section headings rendered as `<h1>`, `<h2>`, `<h3>`.

**Custom element:** `<pila-heading>`

**`content`:** `InlineNode[]`

**`attrs`:** none

**Example:**

```json
{ "id": "2", "type": "heading2", "content": [{ "text": "Section Title" }] }
```

**Slash menu labels:** `Heading 1`, `Heading 2`, `Heading 3`

---

## bulletList

An unordered list item rendered as `<ul><li>`. Consecutive `bulletList` blocks are displayed together.

**Custom element:** `<pila-list>`

**`content`:** `InlineNode[]`

**`attrs`:** none

**Example:**

```json
{ "id": "3", "type": "bulletList", "content": [{ "text": "First item" }] }
```

**Keyboard behaviour:**
- `Tab` / `Shift+Tab` — increase/decrease indent level (up to 6)
- `Enter` on empty item — convert to paragraph

---

## numberedList

An ordered list item rendered as `<ol><li>`. The marker number is computed automatically based on the position within a consecutive run of `numberedList` blocks.

**Custom element:** `<pila-list>`

**`content`:** `InlineNode[]`

**`attrs`:** none

**Example:**

```json
{ "id": "4", "type": "numberedList", "content": [{ "text": "Step one" }] }
```

---

## todo

A checkbox item. Toggling the checkbox persists the `checked` state to the block model.

**Custom element:** `<pila-todo>`

**`content`:** `InlineNode[]`

**`attrs`:**

| Property  | Type      | Default | Description            |
|-----------|-----------|---------|------------------------|
| `checked` | `boolean` | `false` | Whether the box is ticked |

**Example:**

```json
{
  "id": "5",
  "type": "todo",
  "content": [{ "text": "Ship it" }],
  "attrs": { "checked": false }
}
```

---

## code

A fenced code block with syntax highlighting (Prism.js), a language selector, line numbers, and a copy-to-clipboard button.

**Custom element:** `<pila-code>`

**`content`:** `InlineNode[]` — treated as plain text (single node)

**`attrs`:**

| Property   | Type     | Default       | Description                                          |
|------------|----------|---------------|------------------------------------------------------|
| `language` | `string` | `'plaintext'` | Prism grammar key (`typescript`, `python`, `bash`, …) |

Supported languages: `plaintext`, `bash`, `css`, `csharp`, `java`, `javascript`, `json`, `jsx`, `markdown`, `markup` (HTML/XML/SVG), `python`, `sql`, `tsx`, `typescript`, `yaml`.

Common aliases are resolved automatically: `js` → `javascript`, `ts` → `typescript`, `py` → `python`, `sh`/`shell`/`zsh` → `bash`, `html`/`xml`/`svg` → `markup`, `yml` → `yaml`.

**Example:**

```json
{
  "id": "6",
  "type": "code",
  "content": [{ "text": "const x = 1\nconsole.log(x)" }],
  "attrs": { "language": "javascript" }
}
```

**Keyboard behaviour:**
- `Enter` — insert newline inside the block
- `Tab` — insert two spaces
- `Shift+Enter` — exit the code block and create a paragraph below

---

## quote

A blockquote rendered as `<blockquote>`.

**Custom element:** `<pila-quote>`

**`content`:** `InlineNode[]`

**`attrs`:** none

**Example:**

```json
{ "id": "7", "type": "quote", "content": [{ "text": "The best editor is the one you actually use." }] }
```

**Keyboard behaviour:**
- `Shift+Enter` — exit and create a paragraph below

---

## callout

A highlighted callout box with a leading emoji icon and a configurable visual style.

**Custom element:** `<pila-callout>`

**`content`:** `InlineNode[]`

**`attrs`:**

| Property | Type                                              | Default  | Description                      |
|----------|---------------------------------------------------|----------|----------------------------------|
| `icon`   | `string`                                          | `'💡'`  | Emoji or character shown on the left |
| `flavor` | `'info' \| 'warning' \| 'error' \| 'success' \| 'tip'` | `'info'` | Controls the callout color scheme |

**Example:**

```json
{
  "id": "8",
  "type": "callout",
  "content": [{ "text": "This is important." }],
  "attrs": { "icon": "⚠️", "flavor": "warning" }
}
```

**Keyboard behaviour:**
- `Shift+Enter` — exit and create a paragraph below
- Clicking the icon makes it editable (type a new emoji)

---

## divider

A horizontal rule (`<hr>`). Has no content or attrs.

**Custom element:** `<pila-divider>`

**`content`:** none

**`attrs`:** none

**Example:**

```json
{ "id": "9", "type": "divider" }
```

**Keyboard behaviour:**
- `Enter` — create a paragraph below
- `Backspace` / `Delete` — remove the divider

---

## image

An image block with an optional caption, hover overlay with an Edit button, and a props modal for setting dimensions, alt text, and Tailwind classes.

**Custom element:** `<pila-image>`

**`content`:** none (caption is stored in `attrs.alt`)

**`attrs`:**

| Property          | Type                                    | Description                                    |
|-------------------|-----------------------------------------|------------------------------------------------|
| `src`             | `string`                                | Image URL (`http://` or `https://` only)       |
| `alt`             | `string`                                | Alt text / caption                             |
| `width`           | `string`                                | CSS width value, e.g. `'50%'`, `'400px'`       |
| `height`          | `string`                                | CSS height value, e.g. `'200px'`, `'auto'`     |
| `tailwindClasses` | `string`                                | Additional Tailwind classes applied to `<img>` |
| `alignment`       | `'left' \| 'center' \| 'right'`         | Horizontal alignment of the figure             |

**Example:**

```json
{
  "id": "10",
  "type": "image",
  "attrs": {
    "src": "https://example.com/photo.jpg",
    "alt": "A scenic view",
    "width": "100%",
    "alignment": "center"
  }
}
```

**Keyboard behaviour (when image is focused):**
- `Enter` — create a paragraph below
- `Backspace` / `Delete` — remove the image block

---

## table

A data table with configurable header rows and columns. Supports per-cell alignment.

**Custom element:** `<pila-table>`

**`content`:** none

**`attrs`:**

| Property     | Type         | Default | Description                                      |
|--------------|--------------|---------|--------------------------------------------------|
| `rows`       | `TableRow[]` | `[]`    | Array of row objects (see below)                 |
| `headerRows` | `number[]`   | `[0]`   | Row indices rendered as `<thead>` / `<th>`       |
| `headerCols` | `number[]`   | `[]`    | Column indices always rendered as `<th>`         |

> Legacy boolean flags `headerRow` and `headerCol` are still accepted for backwards compatibility but `headerRows` / `headerCols` take precedence.

Each `TableRow`:

```ts
interface TableRow {
  cells: TableCell[]
}

interface TableCell {
  content: InlineNode[]
  align?: 'left' | 'center' | 'right'
}
```

**Example:**

```json
{
  "id": "11",
  "type": "table",
  "attrs": {
    "rows": [
      { "cells": [{ "content": [{ "text": "Name" }] }, { "content": [{ "text": "Role" }] }] },
      { "cells": [{ "content": [{ "text": "Alice" }] }, { "content": [{ "text": "Engineer" }] }] }
    ],
    "headerRows": [0]
  }
}
```

The table toolbar (shown on click) lets you add/remove rows and columns and toggle header rows/columns.

---

## columns

A multi-column layout. Each column holds its own array of nested blocks and has a configurable flex-grow width factor.

**Custom element:** `<pila-columns>`

**`content`:** none

**`attrs`:**

| Property      | Type          | Description                           |
|---------------|---------------|---------------------------------------|
| `columnDefs`  | `ColumnDef[]` | Array of column definitions (see below) |

Each `ColumnDef`:

```ts
interface ColumnDef {
  width?: number   // flex-grow factor; default 1 (equal width)
  blocks: Block[]  // nested blocks inside this column
}
```

All built-in block types are supported inside columns.

**Example:**

```json
{
  "id": "12",
  "type": "columns",
  "attrs": {
    "columnDefs": [
      {
        "width": 2,
        "blocks": [{ "id": "c1", "type": "paragraph", "content": [{ "text": "Wide column" }] }]
      },
      {
        "width": 1,
        "blocks": [{ "id": "c2", "type": "paragraph", "content": [{ "text": "Narrow column" }] }]
      }
    ]
  }
}
```

The columns toolbar (shown when a column is active) allows adding/removing columns and changing individual column widths. The resize handle between columns can be dragged to adjust widths live.

---

## Custom Block Types

Register your own block types via the Plugin API:

```ts
api.registerBlockType({
  type: 'my-card',
  factory(block) {
    const el = document.createElement('div')
    el.className = 'my-card'
    el.textContent = block.attrs?.title ?? 'Untitled'
    return el
  },
  slashItem: {
    name: 'Card',
    description: 'Insert a card block',
    icon: '🃏',
  },
})
```

See the [Plugin API section in the main README](../../README.md#plugin-api) for full details.
