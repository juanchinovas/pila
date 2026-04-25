import { Block, BlockAttrs, InlineNode, TableRow } from '../types'

function inlineToHtml(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      let html = escapeHtml(node.text)
      if (node.code) html = `<code>${html}</code>`
      if (node.bold) html = `<strong>${html}</strong>`
      if (node.italic) html = `<em>${html}</em>`
      if (node.underline) html = `<u>${html}</u>`
      if (node.link) {
        const safeHref = sanitizeHref(node.link)
        html = `<a href="${escapeAttr(safeHref)}" target="_blank" rel="noopener noreferrer">${html}</a>`
      }
      return html
    })
    .join('')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function sanitizeHref(href: string): string {
  // Only allow http, https, mailto — block javascript: and other schemes
  if (/^(https?:\/\/|mailto:)/i.test(href)) return href
  return '#'
}

function tableToHtml(rows: TableRow[], attrs: BlockAttrs): string {
  // Support both legacy booleans and new per-index arrays
  const headerRowSet: number[] = attrs.headerRows ?? (attrs.headerRow ? [0] : [])
  const headerColSet: number[] = attrs.headerCols ?? (attrs.headerCol ? [0] : [])

  const buildCell = (
    cell: TableRow['cells'][number],
    forceHeader: boolean,
    _rowIdx: number,
    colIdx: number,
  ): string => {
    const useHeader = forceHeader || headerColSet.includes(colIdx)
    const tag       = useHeader ? 'th' : 'td'
    const alignAttr = cell.align ? ` align="${escapeAttr(cell.align)}"` : ''
    return `<${tag}${alignAttr}>${inlineToHtml(cell.content)}</${tag}>`
  }

  const buildRow = (row: TableRow, isHeader: boolean, rowIdx: number): string => {
    const cells = row.cells.map((c, ci) => buildCell(c, isHeader, rowIdx, ci)).join('')
    return `  <tr>${cells}</tr>`
  }

  const hasTheadRow = headerRowSet.includes(0)
  if (!hasTheadRow || rows.length === 0) {
    const body = rows.map((r, i) => buildRow(r, headerRowSet.includes(i), i)).join('\n')
    return `<table>\n${body}\n</table>`
  }

  const [first, ...rest] = rows
  const thead = `  <thead>\n    ${buildRow(first, true, 0).trim()}\n  </thead>`
  const tbody = rest.length
    ? `  <tbody>\n${rest.map((r, i) => '    ' + buildRow(r, headerRowSet.includes(i + 1), i + 1).trim()).join('\n')}\n  </tbody>`
    : ''
  return `<table>\n${thead}${tbody ? '\n' + tbody : ''}\n</table>`
}

export class HtmlSerializer {
  static serialize(blocks: Block[]): string {
    return blocks
      .map((block) => HtmlSerializer.blockToHtml(block))
      .join('\n')
  }

  private static blockToHtml(block: Block): string {
    const content = block.content ?? []

    switch (block.type) {
      case 'paragraph':
        return `<p>${inlineToHtml(content)}</p>`
      case 'heading1':
        return `<h1>${inlineToHtml(content)}</h1>`
      case 'heading2':
        return `<h2>${inlineToHtml(content)}</h2>`
      case 'heading3':
        return `<h3>${inlineToHtml(content)}</h3>`
      case 'bulletList':
        return `<ul><li>${inlineToHtml(content)}</li></ul>`
      case 'numberedList':
        return `<ol><li>${inlineToHtml(content)}</li></ol>`
      case 'todo': {
        const checked = block.attrs?.checked ? ' checked' : ''
        return `<div class="todo"><input type="checkbox"${checked} disabled /> ${inlineToHtml(content)}</div>`
      }
      case 'code': {
        const lang = escapeAttr(block.attrs?.language ?? 'plaintext')
        const code = escapeHtml(content.map((n) => n.text).join(''))
        return `<pre><code class="language-${lang}">${code}</code></pre>`
      }
      case 'quote':
        return `<blockquote>${inlineToHtml(content)}</blockquote>`
      case 'callout': {
        const icon = escapeHtml(block.attrs?.icon ?? '💡')
        return `<div class="callout"><span class="callout-icon">${icon}</span><p>${inlineToHtml(content)}</p></div>`
      }
      case 'divider':
        return '<hr />'
      case 'image': {
        const src    = sanitizeHref(block.attrs?.src ?? '')
        const alt    = escapeAttr(block.attrs?.alt ?? '')
        const width  = block.attrs?.width  ? ` width="${escapeAttr(block.attrs.width)}"`  : ''
        const height = block.attrs?.height ? ` height="${escapeAttr(block.attrs.height)}"` : ''
        const cls    = block.attrs?.tailwindClasses ? ` class="${escapeAttr(block.attrs.tailwindClasses)}"` : ''
        return `<figure><img src="${escapeAttr(src)}" alt="${alt}"${width}${height}${cls} /></figure>`
      }
      case 'table': {
        const rows = block.attrs?.rows ?? []
        return tableToHtml(rows, block.attrs ?? {})
      }
      case 'columns': {
        const defs = block.attrs?.columnDefs ?? []
        const cols = defs
          .map((def) => {
            const inner = (def.blocks ?? []).map((b) => HtmlSerializer.blockToHtml(b)).join('\n')
            const flex  = def.width != null ? ` style="flex:${def.width} 1 0%"` : ''
            return `<div class="pila-column"${flex}>${inner}</div>`
          })
          .join('\n')
        return `<div class="pila-columns">${cols}</div>`
      }
      case 'button': {
        const label   = inlineToHtml(content)
        const href    = escapeAttr(sanitizeHref(block.attrs?.href ?? '#'))
        const style   = block.attrs?.buttonStyle ?? 'primary'
        const align   = block.attrs?.alignment ?? 'left'
        const textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'
        return `<div style="text-align:${textAlign};"><a href="${href}" class="pila-button pila-button--${escapeAttr(style)}" target="_blank" rel="noopener noreferrer">${label}</a></div>`
      }
      default:
        return ''
    }
  }
}
