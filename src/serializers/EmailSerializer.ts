/**
 * Email-safe HTML serializer.
 *
 * Rules followed:
 *  - All styles are **inline** — no external CSS, no `<style>` blocks (stripped by Gmail, etc.)
 *  - Layout uses `<table role="presentation">` — CSS flexbox/grid is not supported by Outlook
 *  - `<input type="checkbox">` replaced with Unicode ☐ / ☑ (stripped by most clients)
 *  - `<pre><code>` styled inline with monospace font + background
 *  - Callout flavours expressed via border-left colour + background
 *  - The output is a complete, standalone HTML document ready to send
 */

import { Block, BlockAttrs, InlineNode, TableRow } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  if (/^(https?:\/\/|mailto:)/i.test(href)) return href
  return '#'
}

function inlineToHtml(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      let html = escapeHtml(node.text)
      if (node.code) {
        html = `<code style="font-family:Consolas,'Courier New',monospace;background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:0.875em;">${html}</code>`
      }
      if (node.bold)      html = `<strong style="font-weight:700;">${html}</strong>`
      if (node.italic)    html = `<em style="font-style:italic;">${html}</em>`
      if (node.underline) html = `<u style="text-decoration:underline;">${html}</u>`
      if (node.link) {
        const href = escapeAttr(sanitizeHref(node.link))
        html = `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">${html}</a>`
      }
      return html
    })
    .join('')
}

// ─── Callout colour themes ────────────────────────────────────────────────────

interface CalloutTheme { bg: string; border: string }

function calloutTheme(flavor?: string): CalloutTheme {
  switch (flavor) {
    case 'warning': return { bg: '#fffbeb', border: '#f59e0b' }
    case 'error':   return { bg: '#fef2f2', border: '#ef4444' }
    case 'success': return { bg: '#f0fdf4', border: '#22c55e' }
    case 'tip':     return { bg: '#f5f3ff', border: '#8b5cf6' }
    default:        return { bg: '#eff6ff', border: '#3b82f6' } // info
  }
}

// ─── Table serialization ─────────────────────────────────────────────────────

const TABLE_STYLE  = 'border-collapse:collapse;width:100%;margin:12px 0;font-size:15px;'
const TH_STYLE     = 'padding:8px 12px;border:1px solid #d1d5db;background:#f3f4f6;font-weight:600;text-align:left;'
const TD_STYLE     = 'padding:8px 12px;border:1px solid #d1d5db;'

function tableToHtml(rows: TableRow[], attrs: BlockAttrs): string {
  const headerRowSet: number[] = attrs.headerRows ?? (attrs.headerRow ? [0] : [])
  const headerColSet: number[] = attrs.headerCols ?? (attrs.headerCol ? [0] : [])

  const buildCell = (
    cell: TableRow['cells'][number],
    forceHeader: boolean,
    colIdx: number,
  ): string => {
    const useHeader = forceHeader || headerColSet.includes(colIdx)
    const tag       = useHeader ? 'th' : 'td'
    const style     = useHeader ? TH_STYLE : TD_STYLE
    const alignStyle = cell.align ? `text-align:${cell.align};` : ''
    return `<${tag} style="${style}${alignStyle}">${inlineToHtml(cell.content)}</${tag}>`
  }

  const buildRow = (row: TableRow, isHeader: boolean, _rowIdx: number): string => {
    const cells = row.cells.map((c, ci) => buildCell(c, isHeader, ci)).join('')
    return `<tr>${cells}</tr>`
  }

  const hasTheadRow = headerRowSet.includes(0)

  if (!hasTheadRow || rows.length === 0) {
    const body = rows.map((r, i) => buildRow(r, headerRowSet.includes(i), i)).join('\n')
    return `<table style="${TABLE_STYLE}">\n${body}\n</table>`
  }

  const [first, ...rest] = rows
  const thead = `<thead>${buildRow(first, true, 0)}</thead>`
  const tbody = rest.length
    ? `<tbody>${rest.map((r, i) => buildRow(r, headerRowSet.includes(i + 1), i + 1)).join('\n')}</tbody>`
    : ''
  return `<table style="${TABLE_STYLE}">\n${thead}${tbody}\n</table>`
}

// ─── Columns → table-based layout ────────────────────────────────────────────

function columnsToHtml(defs: BlockAttrs['columnDefs']): string {
  if (!defs?.length) return ''

  const totalWeight = defs.reduce((s, d) => s + (d.width ?? 1), 0)

  const cells = defs
    .map((def) => {
      const pct   = Math.round(((def.width ?? 1) / totalWeight) * 100)
      const inner = (def.blocks ?? []).map((b) => blockToHtml(b)).join('\n')
      return `<td valign="top" style="width:${pct}%;padding:0 8px;vertical-align:top;">${inner}</td>`
    })
    .join('\n')

  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;width:100%;margin:12px 0;">\n` +
    `<tr>\n${cells}\n</tr>\n</table>`
  )
}

// ─── Block serializer ─────────────────────────────────────────────────────────

const BASE = 'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;color:#1a1a1a;'

function blockToHtml(block: Block): string {
  const content = block.content ?? []

  switch (block.type) {
    case 'paragraph':
      return `<p style="${BASE}margin:0 0 12px;font-size:15px;line-height:1.6;">${inlineToHtml(content) || '&nbsp;'}</p>`

    case 'heading1':
      return `<h1 style="${BASE}margin:24px 0 8px;font-size:28px;font-weight:700;line-height:1.25;">${inlineToHtml(content)}</h1>`
    case 'heading2':
      return `<h2 style="${BASE}margin:20px 0 6px;font-size:22px;font-weight:700;line-height:1.3;">${inlineToHtml(content)}</h2>`
    case 'heading3':
      return `<h3 style="${BASE}margin:16px 0 4px;font-size:18px;font-weight:600;line-height:1.35;">${inlineToHtml(content)}</h3>`

    case 'bulletList':
      return `<ul style="margin:0 0 12px;padding-left:24px;"><li style="${BASE}font-size:15px;line-height:1.6;">${inlineToHtml(content)}</li></ul>`
    case 'numberedList':
      return `<ol style="margin:0 0 12px;padding-left:24px;"><li style="${BASE}font-size:15px;line-height:1.6;">${inlineToHtml(content)}</li></ol>`

    case 'todo': {
      const checked = block.attrs?.checked
      const box     = checked ? '&#x2611;' : '&#x2610;'  // ☑ / ☐
      const strike  = checked ? 'text-decoration:line-through;color:#6b7280;' : ''
      return `<p style="${BASE}margin:0 0 8px;font-size:15px;line-height:1.6;">${box}&nbsp;<span style="${strike}">${inlineToHtml(content)}</span></p>`
    }

    case 'code': {
      const lang = escapeAttr(block.attrs?.language ?? 'plaintext')
      const code = escapeHtml(content.map((n) => n.text).join(''))
      return (
        `<div style="margin:12px 0;background:#1e1e1e;border-radius:6px;overflow:auto;">` +
        `<p style="margin:0;padding:4px 12px;font-size:11px;color:#9ca3af;font-family:monospace;border-bottom:1px solid #374151;">${lang}</p>` +
        `<pre style="margin:0;padding:12px;overflow-x:auto;"><code style="font-family:Consolas,'Courier New',monospace;font-size:13px;color:#d4d4d4;white-space:pre;">${code}</code></pre>` +
        `</div>`
      )
    }

    case 'quote':
      return (
        `<blockquote style="${BASE}margin:12px 0;padding:8px 16px;border-left:4px solid #d1d5db;` +
        `color:#374151;font-style:italic;font-size:15px;line-height:1.6;">${inlineToHtml(content)}</blockquote>`
      )

    case 'callout': {
      const icon  = escapeHtml(block.attrs?.icon ?? '💡')
      const theme = calloutTheme(block.attrs?.flavor)
      return (
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ` +
        `style="margin:12px 0;background:${theme.bg};border-left:4px solid ${theme.border};border-radius:0 6px 6px 0;">` +
        `<tr>` +
        `<td style="padding:12px 16px;font-size:18px;vertical-align:top;width:28px;">${icon}</td>` +
        `<td style="${BASE}padding:12px 16px 12px 0;font-size:15px;line-height:1.6;vertical-align:top;">${inlineToHtml(content)}</td>` +
        `</tr></table>`
      )
    }

    case 'divider':
      return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />`

    case 'image': {
      const src    = sanitizeHref(block.attrs?.src ?? '')
      const alt    = escapeAttr(block.attrs?.alt ?? '')
      const width  = block.attrs?.width  ? ` width="${escapeAttr(block.attrs.width)}"`  : ' style="max-width:100%;height:auto;"'
      const height = block.attrs?.height ? ` height="${escapeAttr(block.attrs.height)}"` : ''
      return `<figure style="margin:12px 0;padding:0;"><img src="${escapeAttr(src)}" alt="${alt}"${width}${height} /></figure>`
    }

    case 'table': {
      const rows = block.attrs?.rows ?? []
      return tableToHtml(rows, block.attrs ?? {})
    }

    case 'columns':
      return columnsToHtml(block.attrs?.columnDefs)

    default:
      return ''
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export class EmailSerializer {
  /**
   * Serializes blocks to a complete, standalone HTML email document.
   * All styles are inline; the output is ready to set as the HTML body of an email.
   */
  static serialize(blocks: Block[]): string {
    const body = blocks.map((b) => blockToHtml(b)).join('\n')

    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <meta http-equiv="X-UA-Compatible" content="IE=edge" />',
      '  <title></title>',
      '</head>',
      '<body style="margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">',
      '  <!--[if mso]><center><table width="600"><tr><td><![endif]-->',
      '  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">',
      '    <tr>',
      '      <td align="center" style="padding:24px 16px;">',
      '        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">',
      '          <tr>',
      '            <td>',
      body,
      '            </td>',
      '          </tr>',
      '        </table>',
      '      </td>',
      '    </tr>',
      '  </table>',
      '  <!--[if mso]></td></tr></table></center><![endif]-->',
      '</body>',
      '</html>',
    ].join('\n')
  }
}
