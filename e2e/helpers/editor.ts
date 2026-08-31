import { expect, Page } from '@playwright/test'

const MAIN_EDITOR_BLOCKS = '#editor .pila-editor > .pila-block'

export async function waitForEditor(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector(`${MAIN_EDITOR_BLOCKS}:nth-child(3)`)
}

export async function topLevelBlockIds(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('#editor .pila-editor > .pila-block'))
      .map((el) => el.dataset.blockId ?? ''),
  )
}

export async function topLevelBlockTags(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('#editor .pila-editor > .pila-block'))
      .map((el) => el.tagName.toLowerCase()),
  )
}

export async function getEditorJson(page: Page): Promise<Array<Record<string, unknown>>> {
  await page.evaluate(() => {
    const button = document.querySelector<HTMLButtonElement>('#btn-json')
    button?.click()
  })
  await page.locator('#output').waitFor({ state: 'visible' })
  const text = (await page.locator('#output').textContent()) ?? '[]'
  const parsed = JSON.parse(text)
  expect(Array.isArray(parsed)).toBe(true)
  return parsed as Array<Record<string, unknown>>
}

export async function placeCaretAtStart(page: Page, selector: string): Promise<void> {
  await page.evaluate((targetSelector) => {
    const editable = document.querySelector<HTMLElement>(targetSelector)
    if (!editable) throw new Error(`Editable not found: ${targetSelector}`)

    const textNode = Array.from(editable.childNodes).find((node) => node.nodeType === Node.TEXT_NODE)
      ?? editable.firstChild
    const selection = window.getSelection()
    if (!textNode) throw new Error(`No text node found for ${targetSelector}`)

    const range = document.createRange()
    range.setStart(textNode, 0)
    range.collapse(true)
    selection?.removeAllRanges()
    selection?.addRange(range)
    editable.focus()
  }, selector)
}

export async function html5DragTo(
  page: Page,
  sourceSelector: string,
  targetSelector: string,
  insertAfter = true,
): Promise<{ targetId: string; insertAfter: string; visible: boolean }> {
  return page.evaluate(
    ({ src, tgt, after }) => {
      const source = document.querySelector(src) as HTMLElement | null
      const target = document.querySelector(tgt) as HTMLElement | null
      if (!source || !target) throw new Error(`Element not found: ${src} -> ${tgt}`)

      const rect = target.getBoundingClientRect()
      const clientX = rect.left + rect.width / 2
      const clientY = after ? rect.top + rect.height * 0.75 : rect.top + rect.height * 0.25

      const data = new DataTransfer()
      data.effectAllowed = 'move'

      source.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))

      for (let i = 0; i < 3; i += 1) {
        target.dispatchEvent(new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer: data,
          clientX,
          clientY,
        }))
      }

      const indicator = document.querySelector('.pila-drop-indicator') as HTMLElement | null
      const state = {
        targetId: indicator?.dataset.targetId ?? '',
        insertAfter: indicator?.dataset.insertAfter ?? '',
        visible: (indicator?.style.display ?? 'none') !== 'none',
      }

      target.dispatchEvent(new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: data,
        clientX,
        clientY,
      }))
      source.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: data }))
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))

      return state
    },
    { src: sourceSelector, tgt: targetSelector, after: insertAfter },
  )
}

export async function hoverBlockAndGetHandle(page: Page, nthChild: number): Promise<string> {
  const blockSelector = `${MAIN_EDITOR_BLOCKS}:nth-child(${nthChild})`
  const blockId = await page.locator(blockSelector).getAttribute('data-block-id')
  if (!blockId) throw new Error(`Missing data-block-id for ${blockSelector}`)

  await page.hover(blockSelector)
  await page.evaluate((id) => {
    const editor = document.querySelector('#editor .pila-editor') as HTMLElement
    const wrapper = editor?.querySelector(`[data-block-id="${id}"]`) as HTMLElement
    if (wrapper) wrapper.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  }, blockId)
  const handleSelector = `.pila-drag-handle[data-block-id="${blockId}"]`
  await expect(page.locator(handleSelector)).toBeVisible()
  return handleSelector
}

export async function selectWordInFirstParagraph(page: Page): Promise<void> {
  await page.evaluate(() => {
    const editable = document.querySelector<HTMLElement>('#editor .pila-editor > .pila-block:nth-child(2) [contenteditable]')
    if (!editable) throw new Error('First paragraph editable not found')
    const textNode = Array.from(editable.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim()) ?? editable.firstChild
    if (!textNode) throw new Error('No text node available for selection')

    const text = textNode.textContent ?? ''
    const start = text.indexOf('framework-agnostic')
    const end = start + 'framework-agnostic'.length
    const range = document.createRange()
    range.setStart(textNode, Math.max(0, start))
    range.setEnd(textNode, Math.min(text.length, end))

    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    editable.focus()
  })
}

export function mainBlockNth(nthChild: number): string {
  return `${MAIN_EDITOR_BLOCKS}:nth-child(${nthChild})`
}

export function activeSlashMenu(page: Page) {
  return page.locator('[data-pila-ui="slash-menu"]:visible').first()
}
