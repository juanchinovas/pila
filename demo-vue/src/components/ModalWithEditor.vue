<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { PilaEditor, Block } from '@sunacchi/pila'
import '@sunacchi/pila/styles'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Button } from './ui/button'

const editorEl = ref<HTMLElement | null>(null)
let editor: PilaEditor | null = null

const initialContent: Block[] = [
  { type: 'paragraph', content: [{ text: 'Start writing...' }] },
];

const handleOpenChange = (open: boolean) => {
  if (open) {
    // Wait for the modal content to be rendered
    setTimeout(() => {
      if (editorEl.value && !editor) {
        editor = new PilaEditor(editorEl.value, {
          placeholder: 'Type / to add a block…',
          initialContent,
          portalTo: () => editorEl.value?.closest('[role="dialog"]') as HTMLElement,
        })
        editor.mount()
      }
    }, 100)
  } else {
    editor?.destroy()
    editor = null
  }
}

onBeforeUnmount(() => {
  editor?.destroy()
})
</script>

<template>
  <Dialog @update:open="handleOpenChange">
    <DialogTrigger as-child>
      <Button variant="outline">
        Open Pila Editor Modal
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-200 h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Edit Content</DialogTitle>
        <DialogDescription>
          Make changes to your content here using the Pila block editor.
        </DialogDescription>
      </DialogHeader>

      <div
        ref="editorEl"
        style="padding-inline: 5rem;"
      />
    </DialogContent>
  </Dialog>
</template>
