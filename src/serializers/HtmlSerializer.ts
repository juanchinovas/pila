import { Block, BlockAttrs, InlineNode, SerializerOptions, TableRow } from '../types';
import variablesCss from '../styles/variables.css?raw';
import blockCss from '../styles/serializer.css?raw';
import prismCss from 'prismjs/themes/prism.css?raw';
import { highlightCode } from '../prism-languages';
import { escapeHtml, escapeAttr, sanitizeHref, collectAdjacentLists } from './utils';

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
  if (attrs?.objectFit) styles.push(`object-fit:${attrs.objectFit}`);
  return styleAttrFromList(styles);
}

function blockStyleCss(attrs?: BlockAttrs): string {
  const styles: string[] = splitStyleDeclarations(attrs?.style);
  if (attrs?.background) styles.push(`background-color:${attrs.background}`);
  if (attrs?.textColor) styles.push(`color:${attrs.textColor}`);
  if (attrs?.alignment) styles.push(`text-align:${attrs.alignment}`);
  if (attrs?.objectFit) styles.push(`object-fit:${attrs.objectFit}`);
  return styles.join(';');
}

function listStyleAttr(attrs: BlockAttrs | undefined, kind: 'bulletList' | 'numberedList'): string {
  const styles = splitStyleDeclarations(blockStyleCss(attrs));
  styles.push(
    kind === 'bulletList' ? 'list-style-type:disc' : 'list-style-type:decimal',
    'list-style-position:outside',
    'padding-left:1.5em',
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
  if (attrs?.objectFit) chunks.push(`object-fit:${attrs.objectFit}`);
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
  static serialize(blocks: Block[], options?: SerializerOptions): string {
    const { fullDocument = true, includeCSS = fullDocument } = options ?? {};
    const body = HtmlSerializer.serializeBody(blocks);

    const css = prismCss + '\n' + variablesCss + '\n' + blockCss;

    if (fullDocument) {
      return [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="UTF-8" />',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        '  <title></title>',
        '  <style>',
        css,
        '  </style>',
        '</head>',
        '<body>',
        body,
        '</body>',
        '</html>',
      ].join('\n');
    }

    if (includeCSS) {
      return `<style>${css}</style>\n${body}`;
    }

    return body;
  }

  private static serializeBody(blocks: Block[]): string {
    const html: string[] = [];

    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index];

      const collected = collectAdjacentLists(blocks, index);
      if (collected) {
        html.push(HtmlSerializer.listToHtml(collected.listBlocks, collected.listType));
        index = collected.nextIndex;
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
        const rawLang = block.attrs?.language ?? 'plaintext';
        const lang = escapeAttr(rawLang);
        const code = content.map((n) => n.text).join('');
        const highlighted = highlightCode(code, rawLang);
        const wrapperStyleAttr = blockStyleAttr(block.attrs);
        return `<div${classAttr('pila-code-block', block.attrs?.tailwindClasses)}${wrapperStyleAttr}><div class="pila-code-lang">${lang}</div><pre><code class="language-${lang}">${highlighted}</code></pre></div>`;
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
        const width = block.attrs?.width
        ? `width:${escapeAttr(block.attrs.width)};`
        : 'max-width:100%;';
      const height = block.attrs?.height
        ? `height:${escapeAttr(block.attrs.height)};`
        : 'height:auto;';
        const figureClassAttr = classAttr(block.attrs?.tailwindClasses);
        const figureStyleAttr = imageFigureStyleAttr(block.attrs);
        const imgStyleAttr = imageImgStyleAttr(block.attrs).replace(/"$/, ';');
        const caption = alt ? `<figcaption style="text-align:${block.attrs?.alignment ?? 'left'};font-size:0.85rem;color:var(--pila-muted);">${alt}</figcaption>` : '';
        
        return `<figure${figureClassAttr}${figureStyleAttr}>
          <img src="${escapeAttr(src)}" alt="${alt}" ${imgStyleAttr}${width}${height}"/>
          ${caption}
        </figure>`;
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
      case 'row': {
        const rowBlocks = block.attrs?.rowBlocks ?? [];
        const inner = rowBlocks.map((b) => HtmlSerializer.blockToHtml(b)).join('\n');
        const borderStyle = block.attrs?.borderStyle ?? 'none';
        const borderWidth = block.attrs?.borderWidth ?? '1px';
        const borderColor = block.attrs?.borderColor ?? 'var(--pila-border)';
        const borderRadius = block.attrs?.borderRadius ?? '0px';
        const borderTop = block.attrs?.borderTop ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none';
        const borderBottom = block.attrs?.borderBottom ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none';
        const borderLeft = block.attrs?.borderLeft ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none';
        const borderRight = block.attrs?.borderRight ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none';
        const rowStyle = `border-top:${borderTop};border-bottom:${borderBottom};border-left:${borderLeft};border-right:${borderRight};border-radius:${borderRadius};padding:${borderStyle !== 'none' ? '8px' : '0'};margin:12px 0;${blockStyleCss(block.attrs)}`;

        return `<div${classAttr('pila-row', block.attrs?.tailwindClasses)} style="${escapeAttr(rowStyle)}">${inner}</div>`;
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
