/// <reference types="./node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { PilaEditor, icon, Icons } from '@sunacchi/pila';
import '@sunacchi/pila/styles';
import ModalWithEditor from './src/components/ModalWithEditor.vue';
const editorEl = ref(null);
let editor = null;
const output = ref('');
const activeFormat = ref('json');
const initialContent = [
    { type: 'heading1', content: [{ text: 'Welcome to Pila + Vue ✦' }] },
    { type: 'paragraph', content: [{ text: 'A framework-agnostic block editor. This demo mirrors the full functional demo but built with ' }, { text: 'Vue 3', italic: true }, { text: '.' }] },
    { type: 'heading2', content: [{ text: 'Features' }] },
    { type: 'bulletList', content: [{ text: 'Drag & drop blocks' }] },
    { type: 'bulletList', content: [{ text: 'Inline formatting (bold, italic, code, links)' }] },
    { type: 'bulletList', content: [{ text: 'JSON / HTML / Markdown export' }] },
    { type: 'todo', content: [{ text: 'Try checking this off' }], attrs: { checked: false } },
    { type: 'code', content: [{ text: 'const editor = new PilaEditor(el, {\n\tplaceholder: "Type / to add a block…"\n});' }], attrs: { language: 'typescript' } },
    { type: 'quote', content: [{ text: 'The best editor is the one you actually use.' }] },
    { type: 'callout', content: [{ text: 'This is an info callout.' }], attrs: { icon: '💡', flavor: 'info' } },
    { type: 'callout', content: [{ text: 'This is a warning callout.' }], attrs: { icon: '⚠️', flavor: 'warning' } },
    { type: 'callout', content: [{ text: 'This is an error callout.' }], attrs: { icon: '🚨', flavor: 'error' } },
    { type: 'callout', content: [{ text: 'This is a success callout.' }], attrs: { icon: '✅', flavor: 'success' } },
    { type: 'callout', content: [{ text: 'This is a tip callout.' }], attrs: { icon: '💬', flavor: 'tip' } },
    { type: 'divider' },
    { type: 'image', attrs: { src: 'https://picsum.photos/seed/pila/720/240', alt: 'Demo image' } },
    { type: 'table', attrs: { rows: [
                { cells: [{ content: [{ text: 'Name' }] }, { content: [{ text: 'Role' }] }, { content: [{ text: 'Status' }] }] },
                { cells: [{ content: [{ text: 'Alice' }] }, { content: [{ text: 'Engineer' }] }, { content: [{ text: 'Active' }] }] },
                { cells: [{ content: [{ text: 'Bob' }] }, { content: [{ text: 'Designer' }] }, { content: [{ text: 'Active' }] }] },
            ] } },
    { type: 'heading2', content: [{ text: 'Columns layout' }] },
    { type: 'columns', attrs: { columnDefs: [
                { width: 1, blocks: [{ type: 'paragraph', content: [{ text: 'Left column — equal width.' }] }] },
                { width: 1, blocks: [{ type: 'paragraph', content: [{ text: 'Right column — equal width.' }] }] },
            ] } },
    { type: 'button', content: [{ text: 'Start with Pila' }], attrs: { buttonStyle: 'primary', href: 'https://github.com', alignment: 'center' } },
];
onMounted(() => {
    if (editorEl.value) {
        editor = new PilaEditor(editorEl.value, {
            placeholder: 'Type / to add a block…',
            initialContent,
        });
        editor.mount();
    }
});
onBeforeUnmount(() => {
    editor?.destroy();
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.getIcon(__VLS_ctx.Icons.FileJson)) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.updateOutput('html');
        } },
    id: "btn-html",
    ...{ class: ({ active: __VLS_ctx.activeFormat === 'html' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.getIcon(__VLS_ctx.Icons.FileCode)) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.updateOutput('markdown');
        } },
    id: "btn-md",
    ...{ class: ({ active: __VLS_ctx.activeFormat === 'markdown' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.getIcon(__VLS_ctx.Icons.FileText)) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.updateOutput('email');
        } },
    id: "btn-email",
    ...{ class: ({ active: __VLS_ctx.activeFormat === 'email' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.getIcon(__VLS_ctx.Icons.Mail)) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.updateOutput('clear');
        } },
    id: "btn-clear",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.getIcon(__VLS_ctx.Icons.Eraser)) }, null, null);
if (__VLS_ctx.output) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        id: "output",
    });
    (__VLS_ctx.output);
}
if (__VLS_ctx.output && __VLS_ctx.activeFormat !== 'json') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        id: "preview",
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.output) }, null, null);
}
/** @type {__VLS_StyleScopedClasses['demo-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['content-container']} */ ;
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
