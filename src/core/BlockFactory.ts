/**
 * Creates a PilaBlock custom-element instance for the given block data.
 *
 * NOTE: No block modules are imported here on purpose — they all self-register
 * their custom elements when their own modules are imported (which happens in
 * Editor.ts). Importing them here would create circular dependencies:
 *   ColumnsBlock → ColumnEditor → BlockFactory → ColumnsBlock
 */
import { Block } from '../types'
import { BlockContext, PilaBlock } from '../blocks/PilaBlock'

export function createBlockEl(block: Block, ctx: BlockContext): PilaBlock {
  let el: PilaBlock

  switch (block.type) {
    case 'paragraph':
      el = document.createElement('pila-paragraph') as PilaBlock; break
    case 'heading1':
    case 'heading2':
    case 'heading3':
      el = document.createElement('pila-heading') as PilaBlock; break
    case 'bulletList':
    case 'numberedList':
      el = document.createElement('pila-list') as PilaBlock; break
    case 'todo':
      el = document.createElement('pila-todo') as PilaBlock; break
    case 'code':
      el = document.createElement('pila-code') as PilaBlock; break
    case 'quote':
      el = document.createElement('pila-quote') as PilaBlock; break
    case 'callout':
      el = document.createElement('pila-callout') as PilaBlock; break
    case 'divider':
      el = document.createElement('pila-divider') as PilaBlock; break
    case 'image':
      el = document.createElement('pila-image') as PilaBlock; break
    case 'table':
      el = document.createElement('pila-table') as PilaBlock; break
    case 'columns':
      el = document.createElement('pila-columns') as PilaBlock; break
    default:
      el = document.createElement('pila-paragraph') as PilaBlock; break
  }

  el.block = block
  el.ctx   = ctx
  return el
}
