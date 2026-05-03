/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onBeforeUnmount } from 'vue';
import { PilaEditor } from '@sunacchi/pila';
import '@sunacchi/pila/styles';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from './ui/dialog';
import { Button } from './ui/button';
const editorEl = ref(null);
let editor = null;
const initialContent = [
    { type: 'heading1', content: [{ text: 'Pila inside a Modal ✦' }] },
    { type: 'paragraph', content: [{ text: 'This is a Pila editor running inside a shadcn-vue Dialog component.' }] },
];
const handleOpenChange = (open) => {
    if (open) {
        // Wait for the modal content to be rendered
        setTimeout(() => {
            if (editorEl.value && !editor) {
                editor = new PilaEditor(editorEl.value, {
                    placeholder: 'Type / to add a block…',
                    initialContent,
                });
                editor.mount();
            }
        }, 100);
    }
    else {
        editor?.destroy();
        editor = null;
    }
};
onBeforeUnmount(() => {
    editor?.destroy();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.Dialog;
/** @type {[typeof __VLS_components.Dialog, typeof __VLS_components.Dialog, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onUpdate:open': {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:open': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    'onUpdate:open': (__VLS_ctx.handleOpenChange)
};
var __VLS_8 = {};
__VLS_3.slots.default;
const __VLS_9 = {}.DialogTrigger;
/** @type {[typeof __VLS_components.DialogTrigger, typeof __VLS_components.DialogTrigger, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    asChild: true,
}));
const __VLS_11 = __VLS_10({
    asChild: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.Button;
/** @type {[typeof __VLS_components.Button, typeof __VLS_components.Button, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    variant: "outline",
}));
const __VLS_15 = __VLS_14({
    variant: "outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
var __VLS_16;
var __VLS_12;
const __VLS_17 = {}.DialogContent;
/** @type {[typeof __VLS_components.DialogContent, typeof __VLS_components.DialogContent, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    ...{ class: "sm:max-w-[800px] h-[80vh] flex flex-col" },
}));
const __VLS_19 = __VLS_18({
    ...{ class: "sm:max-w-[800px] h-[80vh] flex flex-col" },
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
__VLS_20.slots.default;
const __VLS_21 = {}.DialogHeader;
/** @type {[typeof __VLS_components.DialogHeader, typeof __VLS_components.DialogHeader, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({}));
const __VLS_23 = __VLS_22({}, ...__VLS_functionalComponentArgsRest(__VLS_22));
__VLS_24.slots.default;
const __VLS_25 = {}.DialogTitle;
/** @type {[typeof __VLS_components.DialogTitle, typeof __VLS_components.DialogTitle, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({}));
const __VLS_27 = __VLS_26({}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_28.slots.default;
var __VLS_28;
const __VLS_29 = {}.DialogDescription;
/** @type {[typeof __VLS_components.DialogDescription, typeof __VLS_components.DialogDescription, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({}));
const __VLS_31 = __VLS_30({}, ...__VLS_functionalComponentArgsRest(__VLS_30));
__VLS_32.slots.default;
var __VLS_32;
var __VLS_24;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1 overflow-y-auto p-4 border rounded-md" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "editorEl",
});
/** @type {typeof __VLS_ctx.editorEl} */ ;
var __VLS_20;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['sm:max-w-[800px]']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[80vh]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Dialog: Dialog,
            DialogContent: DialogContent,
            DialogDescription: DialogDescription,
            DialogHeader: DialogHeader,
            DialogTitle: DialogTitle,
            DialogTrigger: DialogTrigger,
            Button: Button,
            editorEl: editorEl,
            handleOpenChange: handleOpenChange,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
