import { test, expect, Page } from '@playwright/test'

/**
 * Simulate a real HTML5 drag from a source element to a target element.
 *
 * Playwright's built-in dragTo() uses pointer events which don't trigger
 * the HTML5 DragEvent sequence (dragstart / dragover / drop / dragend).
 * This helper fires the correct events via page.evaluate.
 */
async function html5DragTo(
  page: Page,
  sourceSelector: string,
  targetSelector: string,
  insertAfter = true,
) {
  await page.evaluate(
    ({ src, tgt, after }) => {
      const source = document.querySelector(src) as HTMLElement
      const target = document.querySelector(tgt) as HTMLElement
      if (!source || !target) throw new Error(`Element not found: ${src} → ${tgt}`)

      const targetRect = target.getBoundingClientRect()
      // Drop just below/above the midpoint depending on insertAfter
      const dropY = after
        ? targetRect.top + targetRect.height * 0.75
        : targetRect.top + targetRect.height * 0.25
      const dropX = targetRect.left + targetRect.width / 2

      const dt = new DataTransfer()
      dt.effectAllowed = 'move'

      // 1. pointerdown on source to set isPointerDown
      source.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))

      // 2. dragstart on source
      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }))

      // 3. dragover on target (a few times to let indicator settle)
      for (let step = 0; step < 3; step++) {
        target.dispatchEvent(new DragEvent('dragover', {
          bubbles: true, cancelable: true, dataTransfer: dt,
          clientX: dropX, clientY: dropY,
        }))
      }

      // 4. drop on target
      target.dispatchEvent(new DragEvent('drop', {
        bubbles: true, cancelable: true, dataTransfer: dt,
        clientX: dropX, clientY: dropY,
      }))

      // 5. dragend on source
      source.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }))

      // 6. pointerup cleanup
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    },
    { src: sourceSelector, tgt: targetSelector, after: insertAfter },
  )
}

/** Returns the text content of each top-level block in order. */
async function blockTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const editor = document.querySelector('.pila-editor')!
    return Array.from(editor.querySelectorAll<HTMLElement>('.pila-block'))
      .map((b) => (b.textContent ?? '').trim().replace(/\s+/g, ' '))
  })
}

/** Returns the data-block-id of each top-level block in order. */
async function blockIds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const editor = document.querySelector('.pila-editor')!
    return Array.from(editor.querySelectorAll<HTMLElement>(':scope > .pila-block'))
      .map((b) => b.dataset.blockId ?? '')
  })
}

test.describe('Drag and drop blocks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the editor and at least 3 blocks to be rendered
    await page.waitForSelector('.pila-editor > .pila-block:nth-child(3)')
  })

  test('drag-handle element is appended to body', async ({ page }) => {
    const handle = page.locator('.pila-drag-handle')
    await expect(handle.first()).toBeAttached()
  })

  test('drag-handle appears on block hover', async ({ page }) => {
    const firstBlock = page.locator('.pila-editor > .pila-block').first()
    await firstBlock.hover()
    const handle = page.locator('.pila-drag-handle')
    await expect(handle.first()).toBeVisible()
  })

  test('drop-indicator element is appended to body', async ({ page }) => {
    const indicator = page.locator('.pila-drop-indicator')
    await expect(indicator.first()).toBeAttached()
  })

  test('move second block to first position (insert before block 1)', async ({ page }) => {
    const idsBefore = await blockIds(page)
    expect(idsBefore.length).toBeGreaterThanOrEqual(3)

    const handle = '.pila-drag-handle'
    const block1Sel = `.pila-editor > .pila-block:nth-child(1)`
    const block2Sel = `.pila-editor > .pila-block:nth-child(2)`

    // Hover block 2 to arm the handle with its blockId
    await page.hover(block2Sel)
    await page.waitForTimeout(50)

    // Drag block 2 onto block 1, insert BEFORE it
    await html5DragTo(page, handle, block1Sel, false)
    await page.waitForTimeout(100)

    const idsAfter = await blockIds(page)
    // block that was at index 1 should now be at index 0
    expect(idsAfter[0]).toBe(idsBefore[1])
    expect(idsAfter[1]).toBe(idsBefore[0])
  })

  test('move first block to third position (insert after block 3)', async ({ page }) => {
    const idsBefore = await blockIds(page)

    const handle = '.pila-drag-handle'
    const block1Sel = `.pila-editor > .pila-block:nth-child(1)`
    const block3Sel = `.pila-editor > .pila-block:nth-child(3)`

    // Hover block 1 to arm the handle
    await page.hover(block1Sel)
    await page.waitForTimeout(50)

    // Drag block 1 onto block 3, insert AFTER it
    await html5DragTo(page, handle, block3Sel, true)
    await page.waitForTimeout(100)

    const idsAfter = await blockIds(page)
    // Original block 0 should now appear after original block 2
    expect(idsAfter[0]).toBe(idsBefore[1])
    expect(idsAfter[1]).toBe(idsBefore[2])
    expect(idsAfter[2]).toBe(idsBefore[0])
  })

  test('drop indicator shows while dragging over editor', async ({ page }) => {
    const block1Sel = `.pila-editor > .pila-block:nth-child(1)`
    const block3Sel = `.pila-editor > .pila-block:nth-child(3)`
    const handle = '.pila-drag-handle'

    await page.hover(block1Sel)
    await page.waitForTimeout(50)

    await page.evaluate(
      ({ src, tgt }) => {
        const source = document.querySelector(src) as HTMLElement
        const target = document.querySelector(tgt) as HTMLElement
        const rect   = target.getBoundingClientRect()
        const dt     = new DataTransfer()

        source.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
        source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }))
        target.dispatchEvent(new DragEvent('dragover', {
          bubbles: true, cancelable: true, dataTransfer: dt,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height * 0.75,
        }))
      },
      { src: handle, tgt: block3Sel },
    )

    const indicator = page.locator('.pila-drop-indicator')
    await expect(indicator.first()).toBeVisible()
  })

  test('drag-handle is hidden after dragend', async ({ page }) => {
    const block1Sel = `.pila-editor > .pila-block:nth-child(1)`
    const block2Sel = `.pila-editor > .pila-block:nth-child(2)`
    const handle = '.pila-drag-handle'

    await page.hover(block1Sel)
    await page.waitForTimeout(50)
    await html5DragTo(page, handle, block2Sel, true)
    await page.waitForTimeout(100)

    await expect(page.locator('.pila-drag-handle').first()).toBeHidden()
  })

  test('dragging a block does not insert text into the editor', async ({ page }) => {
    const block1Sel = `.pila-editor > .pila-block:nth-child(1)`
    const block3Sel = `.pila-editor > .pila-block:nth-child(3)`
    const handle = '.pila-drag-handle'

    const textsBefore = await blockTexts(page)

    await page.hover(block1Sel)
    await page.waitForTimeout(50)
    await html5DragTo(page, handle, block3Sel, true)
    await page.waitForTimeout(100)

    const textsAfter = await blockTexts(page)
    // All original text content should still be present (just reordered)
    const sortedBefore = [...textsBefore].sort()
    const sortedAfter  = [...textsAfter].sort()
    expect(sortedAfter).toEqual(sortedBefore)
  })
})
