import { Block, BlockAttrs, InlineNode, TableRow } from '../types';

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
  // Only allow http, https, mailto — block javascript: and other schemes
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
  return styleAttrFromList(styles);
}

function blockStyleCss(attrs?: BlockAttrs): string {
  const styles: string[] = splitStyleDeclarations(attrs?.style);
  if (attrs?.background) styles.push(`background-color:${attrs.background}`);
  if (attrs?.textColor) styles.push(`color:${attrs.textColor}`);
  return styles.join(';');
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
  // Support both legacy booleans and new per-index arrays
  const headerRowSet: number[] = attrs.headerRows ?? (attrs.headerRow ? [0] : []);
  const headerColSet: number[] = attrs.headerCols ?? (attrs.headerCol ? [0] : []);

  const buildCell = (
    cell: TableRow['cells'][number],
    forceHeader: boolean,
    _rowIdx: number,
    colIdx: number,
  ): string => {
    const useHeader = forceHeader || headerColSet.includes(colIdx);
    const tag       = useHeader ? 'th' : 'td';
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
    const styleAttr = styleChunks.length > 0
      ? ` style="${escapeAttr(styleChunks.join(';'))}"`
      : '';
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
  static serialize(blocks: Block[]): string {
    return blocks
      .map((block) => HtmlSerializer.blockToHtml(block))
      .join('\n');
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
        return `<ul${classAttr(block.attrs?.tailwindClasses)}${styleAttr}><li>${inlineToHtml(content)}</li></ul>`;
      case 'numberedList':
        return `<ol${classAttr(block.attrs?.tailwindClasses)}${styleAttr}><li>${inlineToHtml(content)}</li></ol>`;
      case 'todo': {
        const checked = block.attrs?.checked ? ' checked' : '';
        return `<div${classAttr('todo', block.attrs?.tailwindClasses)}${styleAttr}><input type="checkbox"${checked} disabled /> ${inlineToHtml(content)}</div>`;
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
        return `<div${classAttr('callout', block.attrs?.tailwindClasses)}${styleAttr}><span class="callout-icon">${icon}</span><p>${inlineToHtml(content)}</p></div>`;
      }
      case 'divider':
        return `<hr${classAttr(block.attrs?.tailwindClasses)}${styleAttr} />`;
      case 'image': {
        const src    = sanitizeHref(block.attrs?.src ?? '');
        const alt    = escapeAttr(block.attrs?.alt ?? '');
        const width  = block.attrs?.width  ? ` width="${escapeAttr(block.attrs.width)}"`  : '';
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
            const flex  = def.width != null ? ` style="flex:${def.width} 1 0%"` : '';
            return `<div class="pila-column"${flex}>${inner}</div>`;
          })
          .join('\n');
        return `<div${classAttr('pila-columns', block.attrs?.tailwindClasses)}${styleAttr}>${cols}</div>`;
      }
      case 'button': {
        const label   = inlineToHtml(content);
        const href    = escapeAttr(sanitizeHref(block.attrs?.href ?? '#'));
        const style   = block.attrs?.buttonStyle ?? 'primary';
        const align   = block.attrs?.alignment ?? 'left';
        const textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
        const buttonStyle = blockStyleCss(block.attrs);
        const buttonStyleAttr = buttonStyle ? ` style="${escapeAttr(buttonStyle)}"` : '';
        return `<div style="text-align:${textAlign};"><a href="${href}"${classAttr('pila-button', `pila-button--${style}`, block.attrs?.tailwindClasses)} target="_blank" rel="noopener noreferrer"${buttonStyleAttr}>${label}</a></div>`;
      }
      default:
        return '';
    }
  }
}
