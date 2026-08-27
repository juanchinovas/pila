import { describe, it, expect } from 'vitest';
import { HtmlSerializer } from './HtmlSerializer';
import { Block } from '../types';

describe('HtmlSerializer', () => {
  // ── Embedded CSS ──────────────────────────────────────────────────────────

  it('includes embedded CSS in full document output', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'paragraph', content: [{ text: 'hello' }] },
    ]);
    expect(html).toContain('<style>');
    expect(html).toContain('--pila-font');
    expect(html).toContain('--pila-accent');
    expect(html).toContain('.pila-button--primary');
    expect(html).toContain('.callout');
    expect(html).toContain('</style>');
  });

  it('includes embedded CSS when fullDocument is false but includeCSS is true', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'paragraph', content: [{ text: 'hello' }] }],
      { fullDocument: false, includeCSS: true },
    );
    expect(html).toContain('<style>');
    expect(html).toContain('--pila-font');
    expect(html).toContain('--pila-accent');
    expect(html).toContain('</style>');
    expect(html).toContain('<p>hello</p>');
  });

  it('does not include embedded CSS when fullDocument is false', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'paragraph', content: [{ text: 'hello' }] }],
      { fullDocument: false },
    );
    expect(html).not.toContain('<style>');
    expect(html).not.toContain('--pila-font');
  });
  it('serializes paragraph', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'paragraph', content: [{ text: 'hello' }] }],
      { fullDocument: false },
    );
    expect(html).toBe('<p>hello</p>');
  });

  it('serializes headings h1–h3', () => {
    expect(HtmlSerializer.serialize([{ id: '1', type: 'heading1', content: [{ text: 'H1' }] }])).toContain('<h1>');
    expect(HtmlSerializer.serialize([{ id: '2', type: 'heading2', content: [{ text: 'H2' }] }])).toContain('<h2>');
    expect(HtmlSerializer.serialize([{ id: '3', type: 'heading3', content: [{ text: 'H3' }] }])).toContain('<h3>');
  });

  it('serializes bullet list', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'bulletList', content: [{ text: 'item' }] }],
      { fullDocument: false },
    );
    expect(html).toBe('<ul style="list-style-type:disc;list-style-position:outside;padding-left:1.5em"><li style="display:list-item">item</li></ul>');
  });

  it('serializes numbered list', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'numberedList', content: [{ text: 'one' }] }],
      { fullDocument: false },
    );
    expect(html).toBe('<ol style="list-style-type:decimal;list-style-position:outside;padding-left:1.5em"><li style="display:list-item">one</li></ol>');
  });

  it('groups consecutive numbered list blocks into one ordered list', () => {
    const html = HtmlSerializer.serialize(
      [
        { id: '1', type: 'numberedList', content: [{ text: 'one' }] },
        { id: '2', type: 'numberedList', content: [{ text: 'two' }] },
        { id: '3', type: 'numberedList', content: [{ text: 'three' }] },
      ],
      { fullDocument: false },
    );
    expect(html).toBe('<ol style="list-style-type:decimal;list-style-position:outside;padding-left:1.5em"><li style="display:list-item">one</li><li style="display:list-item">two</li><li style="display:list-item">three</li></ol>');
  });

  it('serializes unchecked todo', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'todo', content: [{ text: 'task' }], attrs: { checked: false } },
    ]);
    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain('checked');
  });

  it('serializes checked todo', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'todo', content: [{ text: 'done' }], attrs: { checked: true } },
    ]);
    expect(html).toContain(' checked');
  });

  it('checked todo applies strikethrough style', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'todo', content: [{ text: 'done' }], attrs: { checked: true } },
    ]);
    expect(html).toContain('text-decoration:line-through');
  });

  it('unchecked todo does not have strikethrough', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'todo', content: [{ text: 'task' }], attrs: { checked: false } },
    ]);
    expect(html).not.toContain('text-decoration:line-through');
  });

  it('serializes code block with language class', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'code', content: [{ text: 'const x = 1' }], attrs: { language: 'typescript' } },
    ]);
    expect(html).toContain('class="language-typescript"');
    expect(html).toContain('class="token keyword"');
    expect(html).toContain('class="token number"');
  });

  it('escapes HTML entities in code block', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'code', content: [{ text: '<script>' }] },
    ]);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('serializes quote', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'quote', content: [{ text: 'wise words' }] }],
      { fullDocument: false },
    );
    expect(html).toBe('<blockquote>wise words</blockquote>');
  });

  it('serializes callout', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'callout', content: [{ text: 'note' }], attrs: { icon: '📝' } },
    ]);
    expect(html).toContain('📝');
    expect(html).toContain('note');
  });

  it('serializes divider', () => {
    expect(HtmlSerializer.serialize([{ id: '1', type: 'divider' }], { fullDocument: false })).toBe('<hr />');
  });

  it('serializes image with safe src', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'image', attrs: { src: 'https://example.com/img.png', alt: 'a pic' } },
    ]);
    expect(html).toContain('src="https://example.com/img.png"');
    expect(html).toContain('alt="a pic"');
  });

  it('blocks unsafe javascript: src', () => {
     
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'image', attrs: { src: 'javascript:alert(1)', alt: '' } },
    ]);
    expect(html).toContain('src="#"');
    expect(html).not.toContain('javascript:');
  });

  it('escapes attribute values', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'image', attrs: { src: 'https://x.com', alt: '"quoted"' } },
    ]);
    expect(html).toContain('&quot;quoted&quot;');
  });

  it('serializes inline bold/italic/code in paragraph', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'paragraph',
        content: [
          { text: 'Hello ', bold: false },
          { text: 'bold', bold: true },
          { text: ' and ', italic: false },
          { text: 'italic', italic: true },
        ],
      },
    ]);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('serializes inline links with safe href', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'paragraph',
        content: [{ text: 'click', link: 'https://example.com' }],
      },
    ]);
    expect(html).toContain('href="https://example.com"');
  });

  it('blocks javascript: link in inline content', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'paragraph',
        content: [{ text: 'evil', link: 'javascript:alert(1)' }],
      },
    ]);
    expect(html).toContain('href="#"');
    expect(html).not.toContain('javascript:');
  });

  it('serializes table', () => {
    const blocks: Block[] = [
      {
        id: '1',
        type: 'table',
        attrs: {
          headerRow: true,
          rows: [
            { cells: [{ content: [{ text: 'Name' }] }, { content: [{ text: 'Age' }] }] },
            { cells: [{ content: [{ text: 'Alice' }] }, { content: [{ text: '30' }] }] },
          ],
        },
      },
    ];
    const html = HtmlSerializer.serialize(blocks);
    expect(html).toContain('<table>');
    expect(html).toContain('<th>');
    expect(html).toContain('<td>');
    expect(html).toContain('Alice');
  });

  // ── Phase 5: image new attrs ──────────────────────────────────────────────

  it('serializes image with width and height attributes', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'image',
        attrs: { src: 'https://example.com/img.png', alt: '', width: '400px', height: '200px' },
      },
    ]);
    // width and height are serialized as inline styles on the img element
    expect(html).toContain('width:400px');
    expect(html).toContain('height:200px');
  });

  it('omits width/height attributes when not set', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'image', attrs: { src: 'https://example.com/img.png', alt: '' } }],
      { fullDocument: false },
    );
    expect(html).not.toContain('width=');
    expect(html).not.toContain('height=');
  });

  it('omits class attribute when tailwindClasses is not set', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'image', attrs: { src: 'https://example.com/img.png', alt: '' } },
    ]);
    expect(html).not.toContain('class=');
  });

  // ── Phase 5: table structure ──────────────────────────────────────────────

  it('serializes table without headerRow as plain rows (no thead/tbody)', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          rows: [
            { cells: [{ content: [{ text: 'A' }] }, { content: [{ text: 'B' }] }] },
          ],
        },
      },
    ]);
    expect(html).not.toContain('<thead>');
    expect(html).not.toContain('<tbody>');
    expect(html).toContain('<td>');
    expect(html).not.toContain('<th>');
  });

  it('serializes table with headerRow using thead/tbody', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          headerRow: true,
          rows: [
            { cells: [{ content: [{ text: 'Header' }] }] },
            { cells: [{ content: [{ text: 'Body' }] }] },
          ],
        },
      },
    ]);
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('<th>Header</th>');
    expect(html).toContain('<td>Body</td>');
  });

  it('serializes table with headerRow but no body rows (thead only)', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          headerRow: true,
          rows: [{ cells: [{ content: [{ text: 'Only Row' }] }] }],
        },
      },
    ]);
    expect(html).toContain('<thead>');
    expect(html).not.toContain('<tbody>');
  });

  it('serializes table with headerCol — first cell of each row is <th>', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          headerCol: true,
          rows: [
            { cells: [{ content: [{ text: 'Label' }] }, { content: [{ text: 'Value' }] }] },
          ],
        },
      },
    ]);
    expect(html).toContain('<th>Label</th>');
    expect(html).toContain('<td>Value</td>');
  });

  it('serializes table with both headerRow and headerCol', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          headerRow: true,
          headerCol: true,
          rows: [
            { cells: [{ content: [{ text: 'R0C0' }] }, { content: [{ text: 'R0C1' }] }] },
            { cells: [{ content: [{ text: 'R1C0' }] }, { content: [{ text: 'R1C1' }] }] },
          ],
        },
      },
    ]);
    // header row: all cells are <th>
    expect(html).toContain('<th>R0C0</th>');
    expect(html).toContain('<th>R0C1</th>');
    // body row: first cell is <th> (headerCol), second is <td>
    expect(html).toContain('<th>R1C0</th>');
    expect(html).toContain('<td>R1C1</td>');
  });

  it('serializes table cell with align attribute', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          rows: [
            {
              cells: [
                { content: [{ text: 'Left' }], align: 'left' },
                { content: [{ text: 'Center' }], align: 'center' },
                { content: [{ text: 'Right' }], align: 'right' },
                { content: [{ text: 'None' }] },
              ],
            },
          ],
        },
      },
    ]);
    expect(html).toContain('align="left"');
    expect(html).toContain('align="center"');
    expect(html).toContain('align="right"');
    // cell without align should not have align attribute
    expect(html).toContain('<td>None</td>');
  });

  it('serializes block background/text colors when present', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'paragraph',
        content: [{ text: 'Styled paragraph' }],
        attrs: { background: '#ffeeaa', textColor: '#113355' },
      },
    ]);
    expect(html).toContain('style="background-color:#ffeeaa;color:#113355"');
  });

  it('preserves tailwind classes and custom style on blocks', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'paragraph',
        content: [{ text: 'Styled paragraph' }],
        attrs: {
          tailwindClasses: 'text-sm md:text-lg font-medium',
          style: 'letter-spacing:0.02em;line-height:1.7',
        },
      },
    ]);
    expect(html).toContain('class="text-sm md:text-lg font-medium"');
    expect(html).toContain('style="letter-spacing:0.02em;line-height:1.7"');
  });

  it('merges built-in classes with tailwind classes for callout', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'callout',
        content: [{ text: 'Keep classes' }],
        attrs: { tailwindClasses: 'rounded-xl shadow-sm' },
      },
    ]);
    expect(html).toContain('class="callout callout--info rounded-xl shadow-sm"');
  });

  it('serializes image object-fit, border-radius, and alignment styles', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'image',
        attrs: {
          src: 'https://example.com/img.png',
          alt: 'sample',
          alignment: 'center',
          objectFit: 'cover',
          borderRadius: '12px',
        },
      },
    ]);
    // Figure gets alignment styles, img gets object-fit, border-radius, and alignment
    expect(html).toContain('<figure style="object-fit:cover;margin-left:auto;margin-right:auto">');
    expect(html).toContain('object-fit:cover;border-radius:12px;margin-left:auto;margin-right:auto');
  });

  it('serializes block background/text colors for special block wrappers', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'callout',
        content: [{ text: 'Styled callout' }],
        attrs: { icon: '📝', background: '#ecfeff', textColor: '#155e75' },
      },
      {
        id: '2',
        type: 'button',
        content: [{ text: 'Styled button' }],
        attrs: { href: 'https://example.com', background: '#111827', textColor: '#f9fafb' },
      },
      {
        id: '3',
        type: 'code',
        content: [{ text: 'const ready = true;' }],
        attrs: { background: '#0f172a', textColor: '#e2e8f0' },
      },
    ]);
    expect(html).toContain('<div class="callout callout--info" style="background-color:#ecfeff;color:#155e75">');
    expect(html).toContain('<a href="https://example.com" class="pila-button pila-button--primary" target="_blank" rel="noopener noreferrer" style="background-color:#111827;color:#f9fafb">Styled button</a>');
    expect(html).toContain('<div class="pila-code-block" style="background-color:#0f172a;color:#e2e8f0"><div class="pila-code-lang">plaintext</div><pre><code class="language-plaintext">const ready = true;</code></pre></div>');
  });

  it('serializes table cell background/color/width/colspan/rowspan', () => {
    const html = HtmlSerializer.serialize([
      {
        id: '1',
        type: 'table',
        attrs: {
          rows: [
            {
              cells: [
                {
                  content: [{ text: 'Styled cell' }],
                  background: '#eef2ff',
                  color: '#1e3a8a',
                  width: '240px',
                  colspan: 2,
                  rowspan: 3,
                },
              ],
            },
          ],
        },
      },
    ]);
    expect(html).toContain('colspan="2"');
    expect(html).toContain('rowspan="3"');
    expect(html).toContain('background-color:#eef2ff');
    expect(html).toContain('color:#1e3a8a');
    expect(html).toContain('width:240px');
  });

  it('serializes empty table as empty <table>', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'table', attrs: { rows: [] } }],
      { fullDocument: false },
    );
    expect(html).toBe('<table>\n\n</table>');
  });

  // ── Button block ─────────────────────────────────────────────────────────

  it('serializes button with href and label', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Click me' }], attrs: { href: 'https://example.com' } },
    ]);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('Click me');
    expect(html).toContain('pila-button');
  });

  it('button defaults to primary style', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com' } },
    ]);
    expect(html).toContain('pila-button--primary');
  });

  it('button respects secondary style', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com', buttonStyle: 'secondary' } },
    ]);
    expect(html).toContain('pila-button--secondary');
  });

  it('button respects outline style', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com', buttonStyle: 'outline' } },
    ]);
    expect(html).toContain('pila-button--outline');
  });

  it('button falls back to # when no href', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }] },
    ]);
    expect(html).toContain('href="#"');
  });

  it('button blocks javascript: href', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'javascript:alert(1)' } },
    ]);
    expect(html).toContain('href="#"');
    expect(html).not.toContain('javascript:');
  });

  it('button opens in new tab with rel=noopener', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com' } },
    ]);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('button respects alignment', () => {
    const centerHtml = HtmlSerializer.serialize([
      { id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com', alignment: 'center' } },
    ]);
    expect(centerHtml).toContain('text-align:center');

    const rightHtml = HtmlSerializer.serialize([
      { id: '2', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com', alignment: 'right' } },
    ]);
    expect(rightHtml).toContain('text-align:right');
  });

  // ─── fullDocument option ──────────────────────────────────────────────────

  it('returns full document by default when fullDocument is not set', () => {
    const html = HtmlSerializer.serialize([
      { id: '1', type: 'paragraph', content: [{ text: 'hello' }] },
    ]);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<body>');
    expect(html).toContain('<p>hello</p>');
  });

  it('returns body-only when fullDocument is false', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'paragraph', content: [{ text: 'hello' }] }],
      { fullDocument: false },
    );
    expect(html).toBe('<p>hello</p>');
    expect(html).not.toContain('<!DOCTYPE html>');
  });

  it('returns full HTML document when fullDocument is true', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'paragraph', content: [{ text: 'hello' }] }],
      { fullDocument: true },
    );
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<head>');
    expect(html).toContain('</head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</body>');
    expect(html).toContain('</html>');
    expect(html).toContain('<p>hello</p>');
  });

  it('fullDocument wraps multiple blocks correctly', () => {
    const html = HtmlSerializer.serialize(
      [
        { id: '1', type: 'heading1', content: [{ text: 'Title' }] },
        { id: '2', type: 'paragraph', content: [{ text: 'Content' }] },
      ],
      { fullDocument: true },
    );
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<p>Content</p>');
    expect(html).toContain('<!DOCTYPE html>');
  });
});

describe('HtmlSerializer regression — no editor DOM leakage', () => {
  it('does not leak pila-* editor classes', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'paragraph', content: [{ text: 'hello' }] }],
      { fullDocument: false },
    );
    expect(html).not.toContain('pila-paragraph');
    expect(html).not.toContain('pila-block');
    expect(html).not.toContain('pila-code-block');
    expect(html).not.toContain('pila-callout');
    expect(html).not.toContain('pila-divider-line');
    expect(html).not.toContain('pila-todo-content');
    expect(html).not.toContain('pila-quote-content');
  });

  it('does not leak Tailwind editing utility classes', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'paragraph', content: [{ text: 'hello' }] }],
      { fullDocument: false },
    );
    expect(html).not.toContain('outline-none');
    expect(html).not.toContain('m-0');
    expect(html).not.toContain('px-0.5');
    expect(html).not.toContain('py-[');
    expect(html).not.toContain('min-h-[');
    expect(html).not.toContain('whitespace-pre-wrap');
    expect(html).not.toContain('break-words');
    expect(html).not.toContain('flex-1');
  });

  it('does not leak editor UI inline styles', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'paragraph', content: [{ text: 'hello' }] }],
      { fullDocument: false },
    );
    expect(html).not.toContain('cursor: text');
    expect(html).not.toContain('user-select: text');
    expect(html).not.toContain('display: table');
    expect(html).not.toContain('margin-top: 4px');
    expect(html).not.toContain('min-width: 80px');
  });

  it('does not duplicate built-in classes (e.g. pila-button)', () => {
    const html = HtmlSerializer.serialize(
      [{ id: '1', type: 'button', content: [{ text: 'Go' }], attrs: { href: 'https://example.com' } }],
      { fullDocument: false },
    );
    const matches = html.match(/pila-button pila-button--primary pila-button pila-button--primary/);
    expect(matches).toBeNull();
  });

  it('round-trips model tailwindClasses and style attrs', () => {
    const html = HtmlSerializer.serialize(
      [
        {
          id: '1',
          type: 'paragraph',
          content: [{ text: 'styled' }],
          attrs: { tailwindClasses: 'my-custom-class', style: 'letter-spacing:0.1em;' },
        },
      ],
      { fullDocument: false },
    );
    expect(html).toContain('my-custom-class');
    expect(html).toContain('letter-spacing:0.1em');
  });
});
