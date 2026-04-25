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
 *  - Colors are resolved from CSS custom properties (--pila-*) at serialize time,
 *    so user theme overrides are automatically reflected in exported emails.
 */

import { Block, BlockAttrs, InlineNode, TableRow } from '../types'

// ─── Theme ────────────────────────────────────────────────────────────────────

interface Theme {
  accent:               string
  text:                 string
  muted:                string
  border:               string
  bg:                   string
  inlineCodeBg:         string
  quoteBorder:          string
  quoteText:            string
  calloutInfoBg:        string
  calloutInfoBorder:    string
  calloutWarningBg:     string
  calloutWarningBorder: string
  calloutErrorBg:       string
  calloutErrorBorder:   string
  calloutSuccessBg:     string
  calloutSuccessBorder: string
  calloutTipBg:         string
  calloutTipBorder:     string
}

const THEME_DEFAULTS: Theme = {
  accent:               '#2563eb',
  text:                 '#1a1a1a',
  muted:                '#9b9b9b',
  border:               '#e2e8f0',
  bg:                   '#ffffff',
  inlineCodeBg:         '#f1f5f9',
  quoteBorder:          '#94a3b8',
  quoteText:            '#4b5563',
  calloutInfoBg:        '#eff6ff',
  calloutInfoBorder:    '#2563eb',
  calloutWarningBg:     '#fffbeb',
  calloutWarningBorder: '#d97706',
  calloutErrorBg:       '#fef2f2',
  calloutErrorBorder:   '#dc2626',
  calloutSuccessBg:     '#f0fdf4',
  calloutSuccessBorder: '#16a34a',
  calloutTipBg:         '#faf5ff',
  calloutTipBorder:     '#9333ea',
}

function readCssVar(name: string, fallback: string): string {
  if (typeof document !== 'undefined') {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    if (val) return val
  }
  return fallback
}

function buildTheme(): Theme {
  return {
    accent:               readCssVar('--pila-accent',                THEME_DEFAULTS.accent),
    text:                 readCssVar('--pila-text',                  THEME_DEFAULTS.text),
    muted:                readCssVar('--pila-muted',                 THEME_DEFAULTS.muted),
    border:               readCssVar('--pila-border',                THEME_DEFAULTS.border),
    bg:                   readCssVar('--pila-bg',                    THEME_DEFAULTS.bg),
    inlineCodeBg:         readCssVar('--pila-inline-code-bg',        THEME_DEFAULTS.inlineCodeBg),
    quoteBorder:          readCssVar('--pila-quote-border',          THEME_DEFAULTS.quoteBorder),
    quoteText:            readCssVar('--pila-quote-text',            THEME_DEFAULTS.quoteText),
    calloutInfoBg:        readCssVar('--pila-callout-info-bg',       THEME_DEFAULTS.calloutInfoBg),
    calloutInfoBorder:    readCssVar('--pila-callout-info-border',   THEME_DEFAULTS.calloutInfoBorder),
    calloutWarningBg:     readCssVar('--pila-callout-warning-bg',    THEME_DEFAULTS.calloutWarningBg),
    calloutWarningBorder: readCssVar('--pila-callout-warning-border',THEME_DEFAULTS.calloutWarningBorder),
    calloutErrorBg:       readCssVar('--pila-callout-error-bg',      THEME_DEFAULTS.calloutErrorBg),
    calloutErrorBorder:   readCssVar('--pila-callout-error-border',  THEME_DEFAULTS.calloutErrorBorder),
    calloutSuccessBg:     readCssVar('--pila-callout-success-bg',    THEME_DEFAULTS.calloutSuccessBg),
    calloutSuccessBorder: readCssVar('--pila-callout-success-border',THEME_DEFAULTS.calloutSuccessBorder),
    calloutTipBg:         readCssVar('--pila-callout-tip-bg',        THEME_DEFAULTS.calloutTipBg),
    calloutTipBorder:     readCssVar('--pila-callout-tip-border',    THEME_DEFAULTS.calloutTipBorder),
  }
}

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

function inlineToHtml(nodes: InlineNode[], theme: Theme): string {
  return nodes
    .map((node) => {
      let html = escapeHtml(node.text)
      if (node.code) {
        html = `<code style="font-family:Consolas,'Courier New',monospace;background:${theme.inlineCodeBg};padding:1px 4px;border-radius:3px;font-size:0.875em;">${html}</code>`
      }
      if (node.bold)      html = `<strong style="font-weight:700;">${html}</strong>`
      if (node.italic)    html = `<em style="font-style:italic;">${html}</em>`
      if (node.underline) html = `<u style="text-decoration:underline;">${html}</u>`
      if (node.link) {
        const href = escapeAttr(sanitizeHref(node.link))
        html = `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:${theme.accent};text-decoration:underline;">${html}</a>`
      }
      return html
    })
    .join('')
}

// ─── Callout colour themes ────────────────────────────────────────────────────

function calloutColors(flavor: string | undefined, theme: Theme): { bg: string; border: string } {
  switch (flavor) {
    case 'warning': return { bg: theme.calloutWarningBg, border: theme.calloutWarningBorder }
    case 'error':   return { bg: theme.calloutErrorBg,   border: theme.calloutErrorBorder }
    case 'success': return { bg: theme.calloutSuccessBg, border: theme.calloutSuccessBorder }
    case 'tip':     return { bg: theme.calloutTipBg,     border: theme.calloutTipBorder }
    default:        return { bg: theme.calloutInfoBg,    border: theme.calloutInfoBorder }
  }
}

// ─── Table serialization ─────────────────────────────────────────────────────

function tableToHtml(rows: TableRow[], attrs: BlockAttrs, theme: Theme): string {
  const TABLE_STYLE = 'border-collapse:collapse;width:100%;margin:12px 0;font-size:15px;'
  const TH_STYLE    = `padding:8px 12px;border:1px solid ${theme.border};background:${theme.inlineCodeBg};font-weight:600;text-align:left;`
  const TD_STYLE    = `padding:8px 12px;border:1px solid ${theme.border};`
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
    return `<${tag} style="${style}${alignStyle}">${inlineToHtml(cell.content, theme)}</${tag}>`
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

function columnsToHtml(defs: BlockAttrs['columnDefs'], theme: Theme): string {
  if (!defs?.length) return ''

  const totalWeight = defs.reduce((s, d) => s + (d.width ?? 1), 0)

  const cells = defs
    .map((def) => {
      const pct   = Math.round(((def.width ?? 1) / totalWeight) * 100)
      const inner = (def.blocks ?? []).map((b) => blockToHtml(b, theme)).join('\n')
      return `<td valign="top" style="width:${pct}%;padding:0 8px;vertical-align:top;">${inner}</td>`
    })
    .join('\n')

  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;width:100%;margin:12px 0;">\n` +
    `<tr>\n${cells}\n</tr>\n</table>`
  )
}

// ─── Block serializer ─────────────────────────────────────────────────────────

function blockToHtml(block: Block, theme: Theme): string {
  const BASE = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:${theme.text};`
  const content = block.content ?? []

  switch (block.type) {
    case 'paragraph':
      return `<p style="${BASE}margin:0 0 12px;font-size:15px;line-height:1.6;">${inlineToHtml(content, theme) || '&nbsp;'}</p>`

    case 'heading1':
      return `<h1 style="${BASE}margin:24px 0 8px;font-size:28px;font-weight:700;line-height:1.25;">${inlineToHtml(content, theme)}</h1>`
    case 'heading2':
      return `<h2 style="${BASE}margin:20px 0 6px;font-size:22px;font-weight:700;line-height:1.3;">${inlineToHtml(content, theme)}</h2>`
    case 'heading3':
      return `<h3 style="${BASE}margin:16px 0 4px;font-size:18px;font-weight:600;line-height:1.35;">${inlineToHtml(content, theme)}</h3>`

    case 'bulletList':
      return `<ul style="margin:0 0 12px;padding-left:24px;"><li style="${BASE}font-size:15px;line-height:1.6;">${inlineToHtml(content, theme)}</li></ul>`
    case 'numberedList':
      return `<ol style="margin:0 0 12px;padding-left:24px;"><li style="${BASE}font-size:15px;line-height:1.6;">${inlineToHtml(content, theme)}</li></ol>`

    case 'todo': {
      const checked = block.attrs?.checked
      const box     = checked ? '&#x2611;' : '&#x2610;'  // ☑ / ☐
      const strike  = checked ? `text-decoration:line-through;color:${theme.muted};` : ''
      return `<p style="${BASE}margin:0 0 8px;font-size:15px;line-height:1.6;">${box}&nbsp;<span style="${strike}">${inlineToHtml(content, theme)}</span></p>`
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
        `<blockquote style="${BASE}margin:12px 0;padding:8px 16px;border-left:4px solid ${theme.quoteBorder};` +
        `color:${theme.quoteText};font-style:italic;font-size:15px;line-height:1.6;">${inlineToHtml(content, theme)}</blockquote>`
      )

    case 'callout': {
      const icon   = escapeHtml(block.attrs?.icon ?? '💡')
      const colors = calloutColors(block.attrs?.flavor, theme)
      return (
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ` +
        `style="margin:12px 0;background:${colors.bg};border-left:4px solid ${colors.border};border-radius:0 6px 6px 0;">` +
        `<tr>` +
        `<td style="padding:12px 16px;font-size:18px;vertical-align:top;width:28px;">${icon}</td>` +
        `<td style="${BASE}padding:12px 16px 12px 0;font-size:15px;line-height:1.6;vertical-align:top;">${inlineToHtml(content, theme)}</td>` +
        `</tr></table>`
      )
    }

    case 'divider':
      return `<hr style="border:none;border-top:1px solid ${theme.border};margin:20px 0;" />`

    case 'image': {
      const src    = sanitizeHref(block.attrs?.src ?? '')
      const alt    = escapeAttr(block.attrs?.alt ?? '')
      const width  = block.attrs?.width  ? ` width="${escapeAttr(block.attrs.width)}"`  : ' style="max-width:100%;height:auto;"'
      const height = block.attrs?.height ? ` height="${escapeAttr(block.attrs.height)}"` : ''
      return `<figure style="margin:12px 0;padding:0;"><img src="${escapeAttr(src)}" alt="${alt}"${width}${height} /></figure>`
    }

    case 'table': {
      const rows = block.attrs?.rows ?? []
      return tableToHtml(rows, block.attrs ?? {}, theme)
    }

    case 'columns':
      return columnsToHtml(block.attrs?.columnDefs, theme)

    case 'button': {
      const label   = inlineToHtml(content, theme)
      const href    = escapeAttr(sanitizeHref(block.attrs?.href ?? '#'))
      const style   = block.attrs?.buttonStyle ?? 'primary'
      const align   = block.attrs?.alignment ?? 'left'
      const tdAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'

      // Colours per variant — primary/outline use --pila-accent, secondary uses --pila-border
      const bg     = style === 'primary'   ? theme.accent  : style === 'secondary' ? theme.border : theme.bg
      const fg     = style === 'primary'   ? '#ffffff'     : style === 'secondary' ? theme.text   : theme.accent
      const border = style === 'outline'   ? theme.accent  : bg

      // MSO VML fallback + modern <a> for other clients
      return (
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0;">` +
        `<tr><td align="${tdAlign}">` +
        `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:40px;v-text-anchor:middle;width:160px;" arcsize="8%" strokecolor="${border}" fillcolor="${bg}"><w:anchorlock/><center style="color:${fg};font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;font-weight:600;">${label}</center></v:roundrect><![endif]-->` +
        `<!--[if !mso]><!-->` +
        `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 24px;background:${bg};color:${fg};border:2px solid ${border};border-radius:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;mso-hide:all;">${label}</a>` +
        `<!--<![endif]-->` +
        `</td></tr></table>`
      )
    }

    default:
      return ''
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export class EmailSerializer {
  /**
   * Serializes blocks to a complete, standalone HTML email document.
   * All styles are inline; the output is ready to set as the HTML body of an email.
   * Colors are read from CSS custom properties at call time, so any --pila-* overrides
   * set by the consumer are automatically reflected in the exported email.
   */
  static serialize(blocks: Block[]): string {
    const theme = buildTheme()
    const body = blocks.map((b) => blockToHtml(b, theme)).join('\n')

    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <meta http-equiv="X-UA-Compatible" content="IE=edge" />',
      '  <title></title>',
      '</head>',
      `<body style="margin:0;padding:0;background:${theme.bg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">`,
      `  <!--[if mso]><center><table width="600"><tr><td><![endif]-->`,
      `  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${theme.bg};">`,
      `    <tr>`,
      `      <td align="center" style="padding:24px 16px;">`,
      `        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">`,
      `          <tr>`,
      `            <td>`,
      body,
      `            </td>`,
      `          </tr>`,
      `        </table>`,
      `      </td>`,
      `    </tr>`,
      `  </table>`,
      `  <!--[if mso]></td></tr></table></center><![endif]-->`,
      `</body>`,
      `</html>`,
    ].join('\n')
  }
}
