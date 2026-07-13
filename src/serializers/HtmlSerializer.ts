import { Block, BlockAttrs, InlineNode, TableRow } from '../types';

const EMBEDDED_CSS = `/* ─── CSS Variables ───────────────────────────────────────────────── */
:root {
  --pila-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --pila-mono: 'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace;
  --pila-bg: #ffffff;
  --pila-text: #1a1a1a;
  --pila-muted: #9b9b9b;
  --pila-placeholder: #c4c4c4;
  --pila-accent: #2563eb;
  --pila-accent-hover: #1d4ed8;
  --pila-border: #e2e8f0;
  --pila-radius: 6px;
  --pila-code-bg: #f1f5f9;
  --pila-code-text: #0f172a;
  --pila-inline-code-bg: #f1f5f9;
  --pila-inline-code-text: #0f172a;
  --pila-quote-border: #94a3b8;
  --pila-quote-text: #4b5563;
  --pila-callout-info-bg: #eff6ff;
  --pila-callout-info-border: #2563eb;
  --pila-callout-info-text: #1e3a8a;
  --pila-callout-warning-bg: #fffbeb;
  --pila-callout-warning-border: #d97706;
  --pila-callout-warning-text: #78350f;
  --pila-callout-error-bg: #fef2f2;
  --pila-callout-error-border: #dc2626;
  --pila-callout-error-text: #7f1d1d;
  --pila-callout-success-bg: #f0fdf4;
  --pila-callout-success-border: #16a34a;
  --pila-callout-success-text: #14532d;
  --pila-callout-tip-bg: #faf5ff;
  --pila-callout-tip-border: #9333ea;
  --pila-callout-tip-text: #3b0764;
}

/* ─── Block Styles ────────────────────────────────────────────── */
body {
  margin: 0;
  padding: 0;
  font-family: var(--pila-font);
  color: var(--pila-text);
  background: var(--pila-bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.pila-editor {
  font-family: var(--pila-font);
  color: var(--pila-text);
  line-height: 1.6;
}

p {
  margin: 0 0 12px;
  font-size: 15px;
  line-height: 1.6;
}

h1, h2, h3 {
  font-weight: 700;
  line-height: 1.25;
  margin: 24px 0 8px;
}
h1 { font-size: 28px; }
h2 { font-size: 22px; }
h3 { font-size: 18px; font-weight: 600; }

blockquote {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 4px solid var(--pila-quote-border);
  color: var(--pila-quote-text);
  font-style: italic;
  font-size: 15px;
  line-height: 1.6;
}

pre {
  margin: 12px 0;
  padding: 12px;
  background: var(--pila-code-bg);
  border-radius: var(--pila-radius);
  overflow-x: auto;
}
pre code {
  font-family: var(--pila-mono);
  font-size: 13px;
  color: var(--pila-code-text);
  white-space: pre;
  background: none;
  padding: 0;
  border-radius: 0;
}

code {
  font-family: var(--pila-mono);
  font-size: 0.875em;
  background: var(--pila-inline-code-bg);
  color: var(--pila-inline-code-text);
  padding: 1px 4px;
  border-radius: 3px;
}

a {
  color: var(--pila-accent);
  text-decoration: underline;
}
a:hover {
  color: var(--pila-accent-hover);
}

.callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  margin: 12px 0;
  border-radius: var(--pila-radius);
  border-left: 4px solid var(--pila-callout-info-border);
  background: var(--pila-callout-info-bg);
  color: var(--pila-callout-info-text);
  font-size: 15px;
  line-height: 1.6;
}
.callout--warning {
  border-left-color: var(--pila-callout-warning-border);
  background: var(--pila-callout-warning-bg);
  color: var(--pila-callout-warning-text);
}
.callout--error {
  border-left-color: var(--pila-callout-error-border);
  background: var(--pila-callout-error-bg);
  color: var(--pila-callout-error-text);
}
.callout--success {
  border-left-color: var(--pila-callout-success-border);
  background: var(--pila-callout-success-bg);
  color: var(--pila-callout-success-text);
}
.callout--tip {
  border-left-color: var(--pila-callout-tip-border);
  background: var(--pila-callout-tip-bg);
  color: var(--pila-callout-tip-text);
}
.callout-icon {
  flex-shrink: 0;
  font-size: 1.1em;
  min-width: 1.3em;
  line-height: 1.6;
}
.callout > p {
  margin: 0;
  flex: 1;
}

.pila-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--pila-radius);
  transition: opacity 0.15s;
  cursor: pointer;
}
.pila-button--primary {
  background: var(--pila-accent);
  color: #ffffff;
  border: 2px solid var(--pila-accent);
}
.pila-button--secondary {
  background: var(--pila-border);
  color: var(--pila-text);
  border: 2px solid var(--pila-border);
}
.pila-button--outline {
  background: transparent;
  color: var(--pila-accent);
  border: 2px solid var(--pila-accent);
}

hr {
  border: none;
  border-top: 1px solid var(--pila-border);
  margin: 20px 0;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  font-size: 15px;
}
th, td {
  padding: 8px 12px;
  border: 1px solid var(--pila-border);
  text-align: left;
}
th {
  background: var(--pila-code-bg);
  font-weight: 600;
}

.pila-columns {
  display: flex;
  align-items: stretch;
  width: 100%;
  gap: 12px;
  margin: 12px 0;
}
.pila-column {
  flex: 1;
  min-width: 0;
}

figure {
  margin: 12px 0;
  padding: 0;
}
figure img {
  max-width: 100%;
  height: auto;
}

.todo {
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 1.6;
}
.todo input[type="checkbox"] {
  margin-right: 6px;
}
`;

function inlineToHtml(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      let html = escapeHtml(node.text);
      if (node.code) html = `<code>${html}</code>`;
      if (node.bold) html = `<strong>${html}</strong>`;
      if (node.italic) html = `<em>${html}</em>`;
      if (node.underline) html = `<u>${html}</u>`;
      if (node.link) {
        const safeHref = sanitizeHref(node.link);
        html = `<a href="${escapeAttr(safeHref)}" target="_blank" rel="noopener noreferrer">${html}</a>`;
      }
      return html;
    })
    .join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sanitizeHref(href: string): string {
  if (/^(https?:\/\/|mailto:)/i.test(href)) return href;
  return '#';
}

function splitStyleDeclarations(style?: string): string[] {
  if (!style) return [];
  return style
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function styleAttrFromList(styleChunks: string[]): string {
  if (styleChunks.length === 0) return '';
  return ` style="${escapeAttr(styleChunks.join(';'))}"`;
}

function blockStyleAttr(attrs?: BlockAttrs): string {
  const styles: string[] = splitStyleDeclarations(attrs?.style);
  if (attrs?.background) styles.push(`background-color:${attrs.background}`);
  if (attrs?.textColor) styles.push(`color:${attrs.textColor}`);
  if (attrs?.alignment) styles.push(`text-align:${attrs.alignment}`);
  return styleAttrFromList(styles);
}

function blockStyleCss(attrs?: BlockAttrs): string {
  const styles: string[] = splitStyleDeclarations(attrs?.style);
  if (attrs?.background) styles.push(`background-color:${attrs.background}`);
  if (attrs?.textColor) styles.push(`color:${attrs.textColor}`);
  if (attrs?.alignment) styles.push(`text-align:${attrs.alignment}`);
  return styles.join(';');
}

function listStyleAttr(attrs: BlockAttrs | undefined, kind: 'bulletList' | 'numberedList'): string {
  const styles = splitStyleDeclarations(blockStyleCss(attrs));
  styles.push(
    kind === 'bulletList' ? 'list-style-type:disc' : 'list-style-type:decimal',
    'list-style-position:outside',
  );
  return styleAttrFromList(styles);
}

function mergeClassNames(...values: Array<string | undefined>): string {
  return values
    .flatMap((value) => (value ?? '').split(/\s+/))
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' ');
}

function classAttr(...values: Array<string | undefined>): string {
  const merged = mergeClassNames(...values);
  if (!merged) return '';
  return ` class="${escapeAttr(merged)}"`;
}

function imageFigureStyleAttr(attrs?: BlockAttrs): string {
  const chunks: string[] = splitStyleDeclarations(attrs?.style);
  if (attrs?.background) chunks.push(`background-color:${attrs.background}`);
  if (attrs?.textColor) chunks.push(`color:${attrs.textColor}`);
  const alignment = attrs?.alignment;
  if (!alignment || alignment === 'left') {
    chunks.push('margin-right:auto');
  } else if (alignment === 'center') {
    chunks.push('margin-left:auto', 'margin-right:auto');
  } else if (alignment === 'right') {
    chunks.push('margin-left:auto');
  }
  return styleAttrFromList(chunks);
}

function imageImgStyleAttr(attrs?: BlockAttrs): string {
  const chunks: string[] = [];
  if (attrs?.objectFit) chunks.push(`object-fit:${attrs.objectFit}`);
  if (attrs?.borderRadius) chunks.push(`border-radius:${attrs.borderRadius}`);
  return styleAttrFromList(chunks);
}

function tableToHtml(rows: TableRow[], attrs: BlockAttrs): string {
  const tableClassAttr = classAttr(attrs.tailwindClasses);
  const tableStyleAttr = blockStyleAttr(attrs);
  const headerRowSet: number[] = attrs.headerRows ?? (attrs.headerRow ? [0] : []);
  const headerColSet: number[] = attrs.headerCols ?? (attrs.headerCol ? [0] : []);

  const buildCell = (
    cell: TableRow['cells'][number],
    forceHeader: boolean,
    _rowIdx: number,
    colIdx: number,
  ): string => {
    const useHeader = forceHeader || headerColSet.includes(colIdx);
    const tag = useHeader ? 'th' : 'td';
    const alignAttr = cell.align ? ` align="${escapeAttr(cell.align)}"` : '';
    const spanAttrs = [
      cell.colspan ? ` colspan="${cell.colspan}"` : '',
      cell.rowspan ? ` rowspan="${cell.rowspan}"` : '',
    ].join('');
    const styleChunks = [
      cell.background ? `background-color:${cell.background}` : '',
      cell.color ? `color:${cell.color}` : '',
      cell.width ? `width:${cell.width}` : '',
    ].filter(Boolean);
    const styleAttr = styleChunks.length > 0 ? ` style="${escapeAttr(styleChunks.join(';'))}"` : '';
    return `<${tag}${alignAttr}${spanAttrs}${styleAttr}>${inlineToHtml(cell.content)}</${tag}>`;
  };

  const buildRow = (row: TableRow, isHeader: boolean, rowIdx: number): string => {
    const cells = row.cells.map((c, ci) => buildCell(c, isHeader, rowIdx, ci)).join('');
    return `  <tr>${cells}</tr>`;
  };

  const hasTheadRow = headerRowSet.includes(0);
  if (!hasTheadRow || rows.length === 0) {
    const body = rows.map((r, i) => buildRow(r, headerRowSet.includes(i), i)).join('\n');
    return `<table${tableClassAttr}${tableStyleAttr}>\n${body}\n</table>`;
  }

  const [first, ...rest] = rows;
  const thead = `  <thead>\n    ${buildRow(first, true, 0).trim()}\n  </thead>`;
  const tbody = rest.length
    ? `  <tbody>\n${rest.map((r, i) => '    ' + buildRow(r, headerRowSet.includes(i + 1), i + 1).trim()).join('\n')}\n  </tbody>`
    : '';
  return `<table${tableClassAttr}${tableStyleAttr}>\n${thead}${tbody ? '\n' + tbody : ''}\n</table>`;
}

export class HtmlSerializer {
  static serialize(blocks: Block[], options?: { fullDocument?: boolean }): string {
    const { fullDocument = true } = options ?? {};
    const body = HtmlSerializer.serializeBody(blocks);

    if (fullDocument) {
      return [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="UTF-8" />',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        '  <title></title>',
        '  <style>',
        EMBEDDED_CSS,
        '  </style>',
        '</head>',
        '<body>',
        body,
        '</body>',
        '</html>',
      ].join('\n');
    }

    return body;
  }

  private static serializeBody(blocks: Block[]): string {
    const html: string[] = [];

    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index];

      if (block.type === 'bulletList' || block.type === 'numberedList') {
        const listType = block.type;
        const listBlocks = [block];

        while (index + 1 < blocks.length && blocks[index + 1].type === listType) {
          listBlocks.push(blocks[index + 1]);
          index += 1;
        }

        html.push(HtmlSerializer.listToHtml(listBlocks, listType));
        continue;
      }

      html.push(HtmlSerializer.blockToHtml(block));
    }

    return html.join('\n');
  }

  private static listToHtml(blocks: Block[], type: 'bulletList' | 'numberedList'): string {
    const [firstBlock] = blocks;
    const tag = type === 'bulletList' ? 'ul' : 'ol';
    const items = blocks
      .map((block) => {
        const itemStyle = splitStyleDeclarations(blockStyleCss(block.attrs));
        itemStyle.push('display:list-item');
        const styleAttr = styleAttrFromList(itemStyle);
        return `<li${styleAttr}>${inlineToHtml(block.content ?? [])}</li>`;
      })
      .join('');

    return `<${tag}${classAttr(firstBlock.attrs?.tailwindClasses)}${listStyleAttr(firstBlock.attrs, type)}>${items}</${tag}>`;
  }

  private static blockToHtml(block: Block): string {
    const content = block.content ?? [];
    const styleAttr = blockStyleAttr(block.attrs);

    switch (block.type) {
      case 'paragraph':
        return `<p${classAttr(block.attrs?.tailwindClasses)}${styleAttr}>${inlineToHtml(content)}</p>`;
      case 'heading1':
        return `<h1${classAttr(block.attrs?.tailwindClasses)}${styleAttr}>${inlineToHtml(content)}</h1>`;
      case 'heading2':
        return `<h2${classAttr(block.attrs?.tailwindClasses)}${styleAttr}>${inlineToHtml(content)}</h2>`;
      case 'heading3':
        return `<h3${classAttr(block.attrs?.tailwindClasses)}${styleAttr}>${inlineToHtml(content)}</h3>`;
      case 'bulletList':
        return HtmlSerializer.listToHtml([block], 'bulletList');
      case 'numberedList':
        return HtmlSerializer.listToHtml([block], 'numberedList');
      case 'todo': {
        const checked = block.attrs?.checked ? ' checked' : '';
        const checkedStyle = block.attrs?.checked ? 'text-decoration:line-through;color:var(--pila-muted);' : '';
        const baseStyle = blockStyleCss(block.attrs);
        const mergedStyle = [baseStyle, checkedStyle].filter(Boolean).join(';');
        const todoStyleAttr = mergedStyle ? ` style="${escapeAttr(mergedStyle)}"` : '';
        return `<div${classAttr('todo', block.attrs?.tailwindClasses)}${styleAttr}><input type="checkbox"${checked} disabled /><span${todoStyleAttr}>${inlineToHtml(content)}</span></div>`;
      }
      case 'code': {
        const lang = escapeAttr(block.attrs?.language ?? 'plaintext');
        const code = escapeHtml(content.map((n) => n.text).join(''));
        return `<pre${classAttr(block.attrs?.tailwindClasses)}${styleAttr}><code class="language-${lang}">${code}</code></pre>`;
      }
      case 'quote':
        return `<blockquote${classAttr(block.attrs?.tailwindClasses)}${styleAttr}>${inlineToHtml(content)}</blockquote>`;
      case 'callout': {
        const icon = escapeHtml(block.attrs?.icon ?? '💡');
        const flavor = block.attrs?.flavor ?? 'info';
        const flavorClass = `callout--${flavor}`;
        return `<div${classAttr('callout', flavorClass, block.attrs?.tailwindClasses)}${styleAttr}><span class="callout-icon">${icon}</span><p>${inlineToHtml(content)}</p></div>`;
      }
      case 'divider':
        return `<hr${classAttr(block.attrs?.tailwindClasses)}${styleAttr} />`;
      case 'image': {
        const src = sanitizeHref(block.attrs?.src ?? '');
        const alt = escapeAttr(block.attrs?.alt ?? '');
        const width = block.attrs?.width ? ` width="${escapeAttr(block.attrs.width)}"` : '';
        const height = block.attrs?.height ? ` height="${escapeAttr(block.attrs.height)}"` : '';
        const figureClassAttr = classAttr(block.attrs?.tailwindClasses);
        const figureStyleAttr = imageFigureStyleAttr(block.attrs);
        const imgStyleAttr = imageImgStyleAttr(block.attrs);
        return `<figure${figureClassAttr}${figureStyleAttr}><img src="${escapeAttr(src)}" alt="${alt}"${width}${height}${imgStyleAttr}/></figure>`;
      }
      case 'table': {
        const rows = block.attrs?.rows ?? [];
        return tableToHtml(rows, block.attrs ?? {});
      }
      case 'columns': {
        const defs = block.attrs?.columnDefs ?? [];
        const cols = defs
          .map((def) => {
            const inner = (def.blocks ?? []).map((b) => HtmlSerializer.blockToHtml(b)).join('\n');
            const flex = def.width != null ? ` style="flex:${def.width} 1 0%"` : '';
            return `<div class="pila-column"${flex}>${inner}</div>`;
          })
          .join('\n');
        return `<div${classAttr('pila-columns', block.attrs?.tailwindClasses)}${styleAttr}>${cols}</div>`;
      }
      case 'button': {
        const label = inlineToHtml(content);
        const href = escapeAttr(sanitizeHref(block.attrs?.href ?? '#'));
        const style = block.attrs?.buttonStyle ?? 'primary';
        const align = block.attrs?.alignment ?? 'left';
        const textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
        const buttonStyle = blockStyleCss(block.attrs);
        const buttonStyleAttr = buttonStyle ? ` style="${escapeAttr(buttonStyle)}"` : '';
        return `<div style="text-align:${textAlign};margin:12px 0;"><a href="${href}"${classAttr('pila-button', `pila-button--${style}`, block.attrs?.tailwindClasses)} target="_blank" rel="noopener noreferrer"${buttonStyleAttr}>${label}</a></div>`;
      }
      default:
        return '';
    }
  }
}
