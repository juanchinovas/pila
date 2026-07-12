/// <reference types="./node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { PilaEditor, icon, Icons } from '@sunacchi/pila';
import '@sunacchi/pila/styles';
import ModalWithEditor from './src/components/ModalWithEditor.vue';
const editorEl = ref(null);
let editor = null;
const output = ref('');
const activeFormat = ref('json');
const demoPluginState = { toolbarClicks: 0 };
window.__pilaDemoPluginState = demoPluginState;
const demoPlugin = {
    name: 'demo-plugin',
    install(api) {
        api.registerBlockType({
            type: 'badge',
            slashItem: {
                name: 'Badge',
                description: 'Plugin demo badge block',
                icon: '★',
            },
            factory(block) {
                const el = document.createElement('div');
                el.className = 'pila-plugin-badge rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700';
                el.tabIndex = 0;
                el.textContent = block.content?.map((node) => node.text).join('') || 'Plugin badge';
                return el;
            },
        });
        api.addToolbarButton({
            label: '★',
            title: 'Plugin Marker',
            command: () => {
                demoPluginState.toolbarClicks += 1;
                const active = document.activeElement?.closest('[data-block-id]');
                const blockId = active?.getAttribute('data-block-id')?.split('_cell_')[0] || null;
                if (!blockId)
                    return;
                const block = api.manager.getById(blockId);
                if (!block)
                    return;
                const existing = (block.attrs?.tailwindClasses || '').trim();
                const nextClasses = existing.includes('plugin-marked')
                    ? existing
                    : `${existing} plugin-marked`.trim();
                api.manager.update(blockId, {
                    attrs: {
                        ...(block.attrs || {}),
                        tailwindClasses: nextClasses,
                    },
                });
            },
        });
        api.registerEmojiProvider({
            key: 'demo-emoji',
            priority: 20,
            search(query) {
                const normalized = query.trim().toLowerCase();
                if (!normalized)
                    return [];
                if (!'rocket_plugin ship launch plugin'.includes(normalized) && !'rocket_plugin'.includes(normalized)) {
                    return [];
                }
                return [{
                        emoji: '🚀',
                        name: 'rocket_plugin',
                        insertText: '[[rocket]]',
                        keywords: ['ship', 'launch', 'plugin'],
                    }];
            },
        });
    },
};
const initialContent = [
    // === HEADINGS ===
    { type: 'heading1', content: [{ text: 'Pila Block Editor — Complete Demo Post' }] },
    { type: 'paragraph', content: [{ text: 'A comprehensive showcase of every built-in block type, inline formatting, and plugin capabilities in the Pila editor.' }] },
    { type: 'heading2', content: [{ text: '1. Basic Text Blocks' }] },
    { type: 'paragraph', content: [{ text: 'This is a standard ' }, { text: 'paragraph', bold: true }, { text: ' block. It supports ' }, { text: 'inline formatting', italic: true }, { text: ' including ' }, { text: 'bold', bold: true }, { text: ', ' }, { text: 'italic', italic: true }, { text: ', ' }, { text: 'underline', underline: true }, { text: ', ' }, { text: 'code', code: true }, { text: ', and ' }, { text: 'links', link: 'https://github.com/sunacchi/pila' }, { text: '.' }] },
    { type: 'paragraph', content: [{ text: 'Multiple paragraphs work naturally — just press Enter to create a new one.' }] },
    { type: 'heading2', content: [{ text: '2. Headings' }] },
    { type: 'heading1', content: [{ text: 'Heading 1 — Major Section' }] },
    { type: 'paragraph', content: [{ text: 'Use Heading 1 for top-level document sections.' }] },
    { type: 'heading2', content: [{ text: 'Heading 2 — Subsection' }] },
    { type: 'paragraph', content: [{ text: 'Heading 2 works well for subsections within a major section.' }] },
    { type: 'heading3', content: [{ text: 'Heading 3 — Minor Heading' }] },
    { type: 'paragraph', content: [{ text: 'Heading 3 is perfect for finer-grained organization.' }] },
    { type: 'heading2', content: [{ text: '3. Lists' }] },
    { type: 'heading3', content: [{ text: 'Bullet List' }] },
    { type: 'bulletList', content: [{ text: 'First bullet point with ' }, { text: 'bold text', bold: true }] },
    { type: 'bulletList', content: [{ text: 'Second item — press Enter for new bullets' }] },
    { type: 'bulletList', content: [{ text: 'Third item with ' }, { text: 'a link', link: 'https://example.com' }] },
    { type: 'bulletList', content: [{ text: 'Nested indentation: press Tab to indent, Shift+Tab to outdent' }] },
    { type: 'heading3', content: [{ text: 'Numbered List' }] },
    { type: 'numberedList', content: [{ text: 'First step in a sequence' }] },
    { type: 'numberedList', content: [{ text: 'Second step — numbers auto-update on reorder' }] },
    { type: 'numberedList', content: [{ text: 'Third step with ' }, { text: 'inline code', code: true }] },
    { type: 'numberedList', content: [{ text: 'Fourth and final step' }] },
    { type: 'heading2', content: [{ text: '4. Todo List' }] },
    { type: 'todo', content: [{ text: 'Learn Pila block types' }], attrs: { checked: true } },
    { type: 'todo', content: [{ text: 'Build something awesome' }], attrs: { checked: false } },
    { type: 'todo', content: [{ text: 'Deploy to production' }], attrs: { checked: false } },
    { type: 'todo', content: [{ text: 'Celebrate! 🎉' }], attrs: { checked: false } },
    { type: 'heading2', content: [{ text: '5. Code Block' }] },
    { type: 'code', content: [{ text: '// TypeScript example with syntax highlighting\ninterface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nfunction greet(user: User): string {\n  return `Hello, ${user.name}!`;\n}\n\ngreet({ id: "1", name: "Pila", email: "editor@example.com" });' }], attrs: { language: 'typescript' } },
    { type: 'code', content: [{ text: 'const PI = 3.14159;\nconsole.log(PI);' }], attrs: { language: 'javascript' } },
    { type: 'code', content: [{ text: '<div class="pila-editor">\n  <pila-paragraph></pila-paragraph>\n  <pila-heading></pila-heading>\n</div>' }], attrs: { language: 'html' } },
    { type: 'code', content: [{ text: 'pila-editor {\n  --pila-accent: #2563eb;\n  --pila-radius: 8px;\n  font-family: system-ui;\n}' }], attrs: { language: 'css' } },
    { type: 'heading2', content: [{ text: '6. Quote & Callout Blocks' }] },
    { type: 'quote', content: [{ text: 'The best editor is the one you actually use — simple, powerful, and extensible.' }] },
    { type: 'paragraph', content: [{ text: '— Pila Team' }] },
    { type: 'heading3', content: [{ text: 'Callout Variants' }] },
    { type: 'callout', content: [{ text: 'This is an ' }, { text: 'info', bold: true }, { text: ' callout — use for general tips and information.' }], attrs: { icon: 'ℹ️', flavor: 'info' } },
    { type: 'callout', content: [{ text: 'This is a ' }, { text: 'warning', bold: true }, { text: ' callout — highlights potential issues.' }], attrs: { icon: '⚠️', flavor: 'warning' } },
    { type: 'callout', content: [{ text: 'This is an ' }, { text: 'error', bold: true }, { text: ' callout — indicates critical problems.' }], attrs: { icon: '❌', flavor: 'error' } },
    { type: 'callout', content: [{ text: 'This is a ' }, { text: 'success', bold: true }, { text: ' callout — confirms successful actions.' }], attrs: { icon: '✅', flavor: 'success' } },
    { type: 'callout', content: [{ text: 'This is a ' }, { text: 'tip', bold: true }, { text: ' callout — shares helpful suggestions.' }], attrs: { icon: '💡', flavor: 'tip' } },
    { type: 'divider' },
    { type: 'heading2', content: [{ text: '7. Image Block' }] },
    { type: 'image', attrs: { src: 'https://picsum.photos/seed/pila-editor/800/400', alt: 'Pila editor showcase image', width: '100%', alignment: 'center' } },
    { type: 'paragraph', content: [{ text: 'Images support captions (click to edit), alignment (left/center/right), resizing via drag handle, and an edit overlay for properties.' }] },
    { type: 'divider' },
    { type: 'heading2', content: [{ text: '8. Table Block' }] },
    { type: 'table', attrs: { rows: [
                { cells: [
                        { content: [{ text: 'Feature', bold: true }], background: '#f0f4f8' },
                        { content: [{ text: 'Status', bold: true }], background: '#f0f4f8' },
                        { content: [{ text: 'Notes', bold: true }], background: '#f0f4f8' },
                    ] },
                { cells: [
                        { content: [{ text: 'Drag & Drop Reordering' }] },
                        { content: [{ text: '✅ Complete' }, { text: ' (green)', italic: true }] },
                        { content: [{ text: 'Full keyboard support' }] },
                    ] },
                { cells: [
                        { content: [{ text: 'Inline Formatting' }] },
                        { content: [{ text: '✅ Complete' }] },
                        { content: [{ text: 'Bold, italic, code, links, underline' }] },
                    ] },
                { cells: [
                        { content: [{ text: 'Table Cell Merging' }] },
                        { content: [{ text: '✅ Complete' }] },
                        { content: [{ text: 'Select cells → merge/unmerge' }] },
                    ] },
                { cells: [
                        { content: [{ text: 'Column Resizing' }] },
                        { content: [{ text: '✅ Complete' }] },
                        { content: [{ text: 'Drag column handles' }] },
                    ] },
                { cells: [
                        { content: [{ text: 'Row/Column Headers' }] },
                        { content: [{ text: '✅ Complete' }] },
                        { content: [{ text: 'Toggle per row/column' }] },
                    ] },
            ] } },
    { type: 'paragraph', content: [{ text: 'Tables support: cell merging, row/column drag-and-drop, header toggles, background/text colors, alignment, and cell styling via the cell settings menu (⚙️ icon on hover).' }] },
    { type: 'divider' },
    { type: 'heading2', content: [{ text: '9. Columns Layout' }] },
    { type: 'columns', attrs: { columnDefs: [
                { width: 1, blocks: [
                        { type: 'heading3', content: [{ text: 'Left Column' }] },
                        { type: 'paragraph', content: [{ text: 'This is the left column in a 50/50 split. You can add any block type inside columns.' }] },
                        { type: 'bulletList', content: [{ text: 'Paragraphs' }] },
                        { type: 'bulletList', content: [{ text: 'Lists' }] },
                        { type: 'bulletList', content: [{ text: 'Code blocks' }] },
                        { type: 'bulletList', content: [{ text: 'Even nested columns!' }] },
                    ] },
                { width: 1, blocks: [
                        { type: 'heading3', content: [{ text: 'Right Column' }] },
                        { type: 'paragraph', content: [{ text: 'Right column — drag the handle between columns to resize. Columns are fully editable mini-editors.' }] },
                        { type: 'callout', content: [{ text: 'Pro tip: Press Escape at column edges to exit.' }], attrs: { icon: '💡', flavor: 'tip' } },
                        { type: 'code', content: [{ text: 'columns: [\n  { width: 1, blocks: [...] },\n  { width: 2, blocks: [...] },\n]' }], attrs: { language: 'json' } },
                    ] },
            ] } },
    { type: 'columns', attrs: { columnDefs: [
                { width: 1, blocks: [
                        { type: 'heading3', content: [{ text: 'Narrow' }] },
                        { type: 'paragraph', content: [{ text: '1/3 width' }] },
                    ] },
                { width: 2, blocks: [
                        { type: 'heading3', content: [{ text: 'Wide' }] },
                        { type: 'paragraph', content: [{ text: '2/3 width — columns use flex-grow ratios for proportional sizing.' }] },
                    ] },
            ] } },
    { type: 'divider' },
    { type: 'heading2', content: [{ text: '10. Button Block' }] },
    { type: 'paragraph', content: [{ text: 'Buttons are fully customizable links styled as buttons:' }] },
    { type: 'button', content: [{ text: 'Primary Button' }], attrs: { buttonStyle: 'primary', href: 'https://github.com/sunacchi/pila', alignment: 'left' } },
    { type: 'button', content: [{ text: 'Secondary Button' }], attrs: { buttonStyle: 'secondary', href: '#', alignment: 'center' } },
    { type: 'button', content: [{ text: 'Outline Button' }], attrs: { buttonStyle: 'outline', href: '#', alignment: 'right' } },
    { type: 'paragraph', content: [{ text: 'Click any button to edit its label, URL, style (primary/secondary/outline), and alignment.' }] },
    { type: 'divider' },
    { type: 'heading2', content: [{ text: '11. Plugin Block — Badge (Custom)' }] },
    { type: 'paragraph', content: [{ text: 'This badge block is provided by the demo plugin. It demonstrates how plugins can register custom block types, toolbar buttons, and emoji providers.' }] },
    // Plugin block type "badge" - will be registered by demoPlugin
    { type: 'badge', content: [{ text: 'Plugin Badge Example' }] },
    { type: 'paragraph', content: [{ text: 'The demo plugin also adds a "★ Plugin Marker" toolbar button (click selected block to toggle a CSS class) and an emoji provider for 🚀 (type [[rocket]]).' }] },
    { type: 'divider' },
    { type: 'heading2', content: [{ text: '12. Serializers — Export Formats' }] },
    { type: 'paragraph', content: [{ text: 'Pila includes four built-in serializers. Use the toolbar buttons above to export:' }] },
    { type: 'bulletList', content: [{ text: 'JSON — Full block data for storage/round-tripping' }] },
    { type: 'bulletList', content: [{ text: 'HTML — Semantic HTML with Tailwind classes' }] },
    { type: 'bulletList', content: [{ text: 'Markdown — GitHub-flavored markdown' }] },
    { type: 'bulletList', content: [{ text: 'Email HTML — Inline styles, tables → divs for email compatibility' }] },
    { type: 'heading2', content: [{ text: '13. Inline Formatting Reference' }] },
    { type: 'paragraph', content: [{ text: 'Select any text to see the floating toolbar with:' }] },
    { type: 'bulletList', content: [{ text: 'Bold (', code: true }, { text: 'Ctrl+B', code: true }, { text: ')' }] },
    { type: 'bulletList', content: [{ text: 'Italic (', code: true }, { text: 'Ctrl+I', code: true }, { text: ')' }] },
    { type: 'bulletList', content: [{ text: 'Underline (', code: true }, { text: 'Ctrl+U', code: true }, { text: ')' }] },
    { type: 'bulletList', content: [{ text: 'Inline Code (', code: true }, { text: 'Ctrl+`', code: true }, { text: ')' }] },
    { type: 'bulletList', content: [{ text: 'Link (', code: true }, { text: 'Ctrl+K', code: true }, { text: ')' }] },
    { type: 'bulletList', content: [{ text: 'Strikethrough (', code: true }, { text: 'Ctrl+Shift+X', code: true }, { text: ')' }] },
    { type: 'paragraph', content: [{ text: 'Markdown shortcuts also work while typing:' }] },
    { type: 'bulletList', content: [{ text: '**bold** → ', bold: true }, { text: 'bold' }] },
    { type: 'bulletList', content: [{ text: '*italic* → ', italic: true }, { text: 'italic' }] },
    { type: 'bulletList', content: [{ text: '~strikethrough~ → ', underline: true }, { text: 'strikethrough (rendered as underline)' }] },
    { type: 'bulletList', content: [{ text: '`code` → ', code: true }, { text: 'inline code' }] },
    { type: 'bulletList', content: [{ text: '[link](url) → ', link: 'https://example.com' }, { text: 'link' }] },
    { type: 'divider' },
    { type: 'heading2', content: [{ text: '14. Keyboard Shortcuts' }] },
    { type: 'table', attrs: { rows: [
                { cells: [
                        { content: [{ text: 'Shortcut', bold: true }], background: '#f0f4f8' },
                        { content: [{ text: 'Action', bold: true }], background: '#f0f4f8' },
                    ] },
                { cells: [
                        { content: [{ text: '/' }] },
                        { content: [{ text: 'Open slash menu to add blocks' }] },
                    ] },
                { cells: [
                        { content: [{ text: 'Enter' }] },
                        { content: [{ text: 'New block (paragraph by default)' }] },
                    ] },
                { cells: [
                        { content: [{ text: 'Shift+Enter' }] },
                        { content: [{ text: 'Exit current block, add paragraph after' }] },
                    ] },
                { cells: [
                        { content: [{ text: 'Backspace (empty block)' }] },
                        { content: [{ text: 'Delete block / merge with previous' }] },
                    ] },
                { cells: [
                        { content: [{ text: '↑/↓' }] },
                        { content: [{ text: 'Navigate between blocks' }] },
                    ] },
                { cells: [
                        { content: [{ text: 'Drag handle (⋮⋮)' }] },
                        { content: [{ text: 'Drag to reorder blocks' }] },
                    ] },
                { cells: [
                        { content: [{ text: 'Tab (in lists)' }] },
                        { content: [{ text: 'Indent list item' }] },
                    ] },
                { cells: [
                        { content: [{ text: 'Shift+Tab (in lists)' }] },
                        { content: [{ text: 'Outdent list item' }] },
                    ] },
                { cells: [
                        { content: [{ text: 'Ctrl/Cmd+B, I, U, K, `, Shift+X' }] },
                        { content: [{ text: 'Inline formatting shortcuts' }] },
                    ] },
                { cells: [
                        { content: [{ text: '[[emoji]]' }] },
                        { content: [{ text: 'Emoji picker (try [[rocket]])' }] },
                    ] },
            ] } },
    { type: 'divider' },
    { type: 'heading2', content: [{ text: '15. Events & Plugin API' }] },
    { type: 'paragraph', content: [{ text: 'The editor emits events for integration:' }] },
    { type: 'code', content: [{ text: 'editor.on("block:add", ({ block, index }) => {})\neditor.on("block:update", ({ id, block }) => {})\neditor.on("block:delete", ({ id }) => {})\neditor.on("block:move", ({ id, toIndex }) => {})\neditor.on("blocks:change", ({ blocks }) => {})' }], attrs: { language: 'typescript' } },
    { type: 'paragraph', content: [{ text: 'Plugins can register custom blocks, slash menu items, toolbar buttons, and emoji providers via the install(api) function.' }] },
    { type: 'divider' },
    { type: 'heading2', content: [{ text: '🎉 That\'s Everything!' }] },
    { type: 'paragraph', content: [{ text: 'This demo post showcases all ' }, { text: '12 built-in block types', bold: true }, { text: ', ' }, { text: '5 callout flavors', bold: true }, { text: ', ' }, { text: '3 button styles', bold: true }, { text: ', ' }, { text: 'column layouts', bold: true }, { text: ', advanced tables, images, code highlighting, and the plugin system.' }] },
    { type: 'callout', content: [{ text: 'Try exporting this content as JSON, HTML, Markdown, or Email HTML using the toolbar buttons above!' }], attrs: { icon: '🚀', flavor: 'success' } },
];
onMounted(() => {
    if (editorEl.value) {
        editor = new PilaEditor(editorEl.value, {
            placeholder: 'Type / to add a block…',
            initialContent,
            plugins: [demoPlugin],
        });
        editor.mount();
        window.__pilaEditor = editor;
    }
});
onBeforeUnmount(() => {
    editor?.destroy();
    window.__pilaEditor = undefined;
});
const updateOutput = (format) => {
    if (!editor)
        return;
    activeFormat.value = format;
    if (format === 'clear') {
        output.value = '';
        return;
    }
    output.value = editor.getContent(format);
};
// Wrapper to use library icons in Vue
const getIcon = (iconNode) => icon(iconNode, 14).innerHTML;
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "demo-wrapper" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "content-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-center text-2xl font-bold mb-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-8 flex justify-center" },
});
/** @type {[typeof ModalWithEditor, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(ModalWithEditor, new ModalWithEditor({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    id: "editor",
    ref: "editorEl",
});
/** @type {typeof __VLS_ctx.editorEl} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.updateOutput('json');
        } },
    id: "btn-json",
    ...{ class: ({ active: __VLS_ctx.activeFormat === 'json' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.getIcon(__VLS_ctx.Icons.FileJson)) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.updateOutput('html');
        } },
    id: "btn-html",
    ...{ class: ({ active: __VLS_ctx.activeFormat === 'html' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.getIcon(__VLS_ctx.Icons.FileCode)) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.updateOutput('markdown');
        } },
    id: "btn-md",
    ...{ class: ({ active: __VLS_ctx.activeFormat === 'markdown' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.getIcon(__VLS_ctx.Icons.FileText)) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.updateOutput('email');
        } },
    id: "btn-email",
    ...{ class: ({ active: __VLS_ctx.activeFormat === 'email' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.getIcon(__VLS_ctx.Icons.Mail)) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.updateOutput('clear');
        } },
    id: "btn-clear",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.getIcon(__VLS_ctx.Icons.Eraser)) }, null, null);
if (__VLS_ctx.output) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        id: "output",
    });
    (__VLS_ctx.output);
}
if (__VLS_ctx.output && __VLS_ctx.activeFormat !== 'json') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section)({
        id: "preview",
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.output) }, null, null);
}
/** @type {__VLS_StyleScopedClasses['demo-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['content-container']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Icons: Icons,
            ModalWithEditor: ModalWithEditor,
            editorEl: editorEl,
            output: output,
            activeFormat: activeFormat,
            updateOutput: updateOutput,
            getIcon: getIcon,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
