/// <reference types="../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { reactiveOmit } from "@vueuse/core";
import { X } from "lucide-vue-next";
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, useForwardPropsEmits, } from "reka-ui";
import { cn } from "@/lib/utils";
const props = defineProps();
const emits = defineEmits();
const delegatedProps = reactiveOmit(props, "class");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.DialogPortal;
/** @type {[typeof __VLS_components.DialogPortal, typeof __VLS_components.DialogPortal, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
const __VLS_5 = {}.DialogOverlay;
/** @type {[typeof __VLS_components.DialogOverlay, typeof __VLS_components.DialogOverlay, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ class: "fixed inset-0 z-[9999] grid place-items-center overflow-y-auto bg-black/80 p-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" },
}));
const __VLS_7 = __VLS_6({
    ...{ class: "fixed inset-0 z-[9999] grid place-items-center overflow-y-auto bg-black/80 p-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" },
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_8.slots.default;
const __VLS_9 = {}.DialogContent;
/** @type {[typeof __VLS_components.DialogContent, typeof __VLS_components.DialogContent, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    ...(__VLS_ctx.forwarded),
    ...{ class: (__VLS_ctx.cn('relative z-[10000] grid w-[calc(100vw-2rem)] max-w-lg gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg', props.class)) },
}));
const __VLS_11 = __VLS_10({
    ...(__VLS_ctx.forwarded),
    ...{ class: (__VLS_ctx.cn('relative z-[10000] grid w-[calc(100vw-2rem)] max-w-lg gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg', props.class)) },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
var __VLS_13 = {};
const __VLS_15 = {}.DialogClose;
/** @type {[typeof __VLS_components.DialogClose, typeof __VLS_components.DialogClose, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    ...{ class: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground" },
}));
const __VLS_17 = __VLS_16({
    ...{ class: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground" },
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
__VLS_18.slots.default;
const __VLS_19 = {}.X;
/** @type {[typeof __VLS_components.X, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    ...{ class: "w-4 h-4" },
}));
const __VLS_21 = __VLS_20({
    ...{ class: "w-4 h-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "sr-only" },
});
var __VLS_18;
var __VLS_12;
var __VLS_8;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-[9999]']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black/80']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['data-[state=open]:animate-in']} */ ;
/** @type {__VLS_StyleScopedClasses['data-[state=closed]:animate-out']} */ ;
/** @type {__VLS_StyleScopedClasses['data-[state=closed]:fade-out-0']} */ ;
/** @type {__VLS_StyleScopedClasses['data-[state=open]:fade-in-0']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['top-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-offset-background']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-ring']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-offset-2']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:pointer-events-none']} */ ;
/** @type {__VLS_StyleScopedClasses['data-[state=open]:bg-accent']} */ ;
/** @type {__VLS_StyleScopedClasses['data-[state=open]:text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
// @ts-ignore
var __VLS_14 = __VLS_13;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            X: X,
            DialogClose: DialogClose,
            DialogContent: DialogContent,
            DialogOverlay: DialogOverlay,
            DialogPortal: DialogPortal,
            cn: cn,
            forwarded: forwarded,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
