import { test, expect, Page, Locator } from '@playwright/test'

/**
 * Simulate an HTML5 drag from a sourceSelector element to a targetSelector.
 * Returns the dragover target blockId and insertAfter state that was captured
 * on the drop-indicator dataset at drop time, for debugging.
 */
async function html5DragTo(
  page: Page,
  sourceSelector: string,
  targetSelector: string,
  insertAfter = true,
) {
  return page.evaluate(
    ({ src, tgt, after }) => {
      const source = document.querySelector(src) as HTMLElement
      const target = document.querySelector(tgt) as HTMLElement
      if (!source || !target) throw new Error(`Element not found: ${src} → ${tgt}`)

      const targetRect = target.getBoundingClientRect()
      const dropY = after
        ? targetRect.top + targetRect.height * 0.75
        : targetRect.top + targetRect.height * 0.25
      const dropX = targetRect.left + targetRect.width / 2

      const dt = new DataTransfer()
      dt.effectAllowed = 'move'

      source.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }))

      for (let step = 0; step < 3; step++) {
        target.dispatchEvent(new DragEvent('dragover', {
          bubbles: true, cancelable: true, dataTransfer: dt,
          clientX: dropX, clientY: dropY,
        }))
      }

      // Capture indicator state before drop
      const indicator = document.querySelector('.pila-drop-indicator') as HTMLElement
      const indicatorState = {
        visible: indicator?.style.display !== 'none',
        targetId: indicator?.dataset.targetId ?? '',
        insertAfter: indicator?.dataset.insertAfter ?? '',
      }

      target.dispatchEvent(new DragEvent('drop', {
        bubbles: true, cancelable: true, dataTransfer: dt,
        clientX: dropX, clientY: dropY,
      }))
      source.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }))
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))

      return indicatorState
    },
    { src: sourceSelector, tgt: targetSelector, after: insertAfter },
  )
}

/** Returns [{ id, type, text }] for all top-level blocks in order */
async function blockInfo(page: Page) {
  return page.evaluate(() => {
    const editor = document.querySelector('.pila-editor')!
    return Array.from(editor.querySelectorAll<HTMLElement>(':scope > .pila-block'))
      .map((b) => ({
        id:   b.dataset.blockId ?? '',
        tag:  b.tagName.toLowerCase(),
        text: (b.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60),
      }))
  })
}

/** Returns the isDragging flag and dragBlockId from the DragHandle instance via a debug helper */
async function dragHandleState(page: Page) {
  return page.evaluate(() => {
    const handle = document.querySelector('.pila-drag-handle') as HTMLElement
    const indicator = document.querySelector('.pila-drop-indicator') as HTMLElement
    return {
      handleDisplay:    handle?.style.display,
      handleBlockId:    handle?.dataset.blockId,
      indicatorDisplay: indicator?.style.display,
      indicatorTargetId: indicator?.dataset.targetId,
    }
  })
}

test.describe('Callout block drag and drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait until at least 10 blocks are rendered (callouts start at index 10)
    await page.waitForSelector('.pila-editor > .pila-block:nth-child(10)')
  })

  test('debug: identify callout blocks in the DOM', async ({ page }) => {
    const blocks = await blockInfo(page)
    console.log('All blocks:')
    blocks.forEach((b, i) => console.log(`  [${i}] <${b.tag}> id=${b.id} "${b.text}"`))
    // Just find callout blocks and confirm they're present
    const callouts = blocks.filter(b => b.tag === 'pila-callout')
    console.log(`Found ${callouts.length} callout blocks`)
    expect(callouts.length).toBeGreaterThanOrEqual(2)
  })

  test('debug: handle shows with correct blockId when hovering callout', async ({ page }) => {
    // Find the nth-child index of the first callout
    const calloutIndex = await page.evaluate(() => {
      const editor = document.querySelector('.pila-editor')!
      const blocks = Array.from(editor.querySelectorAll<HTMLElement>(':scope > .pila-block'))
      return blocks.findIndex(b => b.tagName.toLowerCase() === 'pila-callout') + 1 // 1-indexed
    })
    console.log(`First callout is at nth-child(${calloutIndex})`)

    const calloutSel = `.pila-editor > .pila-block:nth-child(${calloutIndex})`
    await page.hover(calloutSel)
    await page.waitForTimeout(50)

    const state = await dragHandleState(page)
    console.log('Handle state after hover:', state)
    expect(state.handleDisplay).toBe('flex')
    expect(state.handleBlockId).toBeTruthy()
  })

  test('debug: isDragging is set during dragstart from callout handle', async ({ page }) => {
    const calloutIndex = await page.evaluate(() => {
      const editor = document.querySelector('.pila-editor')!
      const blocks = Array.from(editor.querySelectorAll<HTMLElement>(':scope > .pila-block'))
      return blocks.findIndex(b => b.tagName.toLowerCase() === 'pila-callout') + 1
    })

    const calloutSel = `.pila-editor > .pila-block:nth-child(${calloutIndex})`
    await page.hover(calloutSel)
    await page.waitForTimeout(50)

    // Fire dragstart on the handle and check dragBlockId was captured
    const result = await page.evaluate(() => {
      const handle = document.querySelector('.pila-drag-handle') as HTMLElement
      const blockId = handle?.dataset.blockId
      const dt = new DataTransfer()
      handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      handle.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }))
      return { blockId, mimeData: dt.getData('application/x-pila-block-id') }
    })
    console.log('DragStart result:', result)
    expect(result.blockId).toBeTruthy()
  })

  test('debug: dragover on callout shows indicator', async ({ page }) => {
    const { calloutIndex, nextIndex } = await page.evaluate(() => {
      const editor = document.querySelector('.pila-editor')!
      const blocks = Array.from(editor.querySelectorAll<HTMLElement>(':scope > .pila-block'))
      const idx = blocks.findIndex(b => b.tagName.toLowerCase() === 'pila-callout')
      return { calloutIndex: idx + 1, nextIndex: idx + 2 }
    })

    const calloutSel = `.pila-editor > .pila-block:nth-child(${calloutIndex})`
    const nextSel    = `.pila-editor > .pila-block:nth-child(${nextIndex})`

    await page.hover(calloutSel)
    await page.waitForTimeout(50)

    // Start drag on handle, fire dragover on next block
    const result = await page.evaluate(({ src, tgt }) => {
      const handle = document.querySelector(src) as HTMLElement
      const target = document.querySelector(tgt) as HTMLElement
      const rect   = target.getBoundingClientRect()
      const dt     = new DataTransfer()

      handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      handle.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }))

      // Fire dragover on the next block
      target.dispatchEvent(new DragEvent('dragover', {
        bubbles: true, cancelable: true, dataTransfer: dt,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height * 0.75,
      }))

      const indicator = document.querySelector('.pila-drop-indicator') as HTMLElement
      return {
        indicatorVisible: indicator?.style.display !== 'none',
        targetId: indicator?.dataset.targetId,
        insertAfter: indicator?.dataset.insertAfter,
        targetBlockId: target.dataset.blockId,
      }
    }, { src: '.pila-drag-handle', tgt: nextSel })

    console.log('Dragover result:', result)
    expect(result.indicatorVisible).toBe(true)
    expect(result.targetId).toBe(result.targetBlockId)
  })

  test('move callout block to a different position', async ({ page }) => {
    const idsBefore = await page.evaluate(() => {
      const editor = document.querySelector('.pila-editor')!
      return Array.from(editor.querySelectorAll<HTMLElement>(':scope > .pila-block'))
        .map(b => b.dataset.blockId ?? '')
    })

    // Find the first callout index
    const calloutIndex = await page.evaluate(() => {
      const editor = document.querySelector('.pila-editor')!
      const blocks = Array.from(editor.querySelectorAll<HTMLElement>(':scope > .pila-block'))
      return blocks.findIndex(b => b.tagName.toLowerCase() === 'pila-callout') + 1
    })
    const nextIndex = calloutIndex + 1
    console.log(`Dragging callout at nth-child(${calloutIndex}) after nth-child(${nextIndex})`)

    const calloutSel = `.pila-editor > .pila-block:nth-child(${calloutIndex})`
    const nextSel    = `.pila-editor > .pila-block:nth-child(${nextIndex})`

    await page.hover(calloutSel)
    await page.waitForTimeout(50)

    const indicatorState = await html5DragTo(page, '.pila-drag-handle', nextSel, true)
    console.log('Indicator state at drop:', indicatorState)
    await page.waitForTimeout(100)

    const idsAfter = await page.evaluate(() => {
      const editor = document.querySelector('.pila-editor')!
      return Array.from(editor.querySelectorAll<HTMLElement>(':scope > .pila-block'))
        .map(b => b.dataset.blockId ?? '')
    })

    const calloutId = idsBefore[calloutIndex - 1]
    const afterIdx  = idsAfter.indexOf(calloutId)
    const beforeIdx = idsBefore.indexOf(calloutId)
    console.log(`Callout moved from index ${beforeIdx} to index ${afterIdx}`)

    // After dragging callout at idx N after the block at idx N+1,
    // the callout should now be at idx N+1 (swapped)
    expect(afterIdx).toBe(calloutIndex) // nth-child is 1-indexed, array is 0-indexed → same value
  })
})

// ─── Native-mouse drag tests ──────────────────────────────────────────────
// Use page.mouse (real CDP events) to trigger Chrome's actual HTML5 drag
// machinery: mousedown → tiny move (crosses drag threshold) → move → mouseup.
// This is closer to what a real user does vs synthetic DragEvent dispatches.

async function nativeDrag(
  page: Parameters<typeof test.describe>[1] extends (fn: () => void) => void ? never : import('@playwright/test').Page,
  fromX: number, fromY: number, toX: number, toY: number,
) {
  // Clamp target to safe viewport area (avoid triggering drag-exit-window)
  const safeToY = Math.min(toY, 860)
  await page.mouse.move(fromX, fromY)
  await page.mouse.down()
  await page.waitForTimeout(50)                                    // let Chrome arm the drag gesture
  await page.mouse.move(fromX, fromY + 5, { steps: 3 })          // cross drag threshold
  await page.mouse.move(toX, safeToY, { steps: 20 })             // slow approach to target
  await page.waitForTimeout(50)
  await page.mouse.up()
  await page.waitForTimeout(200)
}

test.describe('Native mouse drag — callout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.pila-editor > .pila-block:nth-child(10)')
  })

  test('native: dragstart fires when dragging the handle', async ({ page }) => {
    const calloutNth = await page.evaluate(() => {
      const blocks = Array.from(document.querySelectorAll<HTMLElement>('.pila-editor > .pila-block'))
      return blocks.findIndex(b => b.tagName.toLowerCase() === 'pila-callout') + 1
    })

    await page.hover(`.pila-editor > .pila-block:nth-child(${calloutNth})`)
    await page.waitForTimeout(100)

    // Inject event tracker
    await page.evaluate(() => {
      (window as any).__dragLog = [] as string[]
      document.addEventListener('dragstart', (e) => {
        (window as any).__dragLog.push('dragstart:' + (e.target as HTMLElement).className)
      }, { capture: true })
      document.addEventListener('drop', () => { (window as any).__dragLog.push('drop') }, { capture: true })
      document.addEventListener('dragend', () => { (window as any).__dragLog.push('dragend') }, { capture: true })
    })

    // Get handle and target positions
    const targetNth = calloutNth + 2
    const pos = await page.evaluate(({ tNth }) => {
      const h = document.querySelector('.pila-drag-handle') as HTMLElement
      const hr = h.getBoundingClientRect()
      const t = document.querySelector(`.pila-editor > .pila-block:nth-child(${tNth})`) as HTMLElement
      const tr = t.getBoundingClientRect()
      return {
        hx: hr.left + hr.width / 2, hy: hr.top + hr.height / 2,
        tx: tr.left + tr.width / 2, ty: tr.top + tr.height * 0.75,
      }
    }, { tNth: targetNth })

    await nativeDrag(page, pos.hx, pos.hy, pos.tx, pos.ty)

    const log = await page.evaluate(() => (window as any).__dragLog as string[])
    console.log('Drag event log:', log)
    expect(log.some(e => e.startsWith('dragstart'))).toBe(true)
  })

  test('native: drop indicator visible mid-drag', async ({ page }) => {
    const calloutNth = await page.evaluate(() => {
      const blocks = Array.from(document.querySelectorAll<HTMLElement>('.pila-editor > .pila-block'))
      return blocks.findIndex(b => b.tagName.toLowerCase() === 'pila-callout') + 1
    })
    const targetNth = calloutNth + 2

    await page.hover(`.pila-editor > .pila-block:nth-child(${calloutNth})`)
    await page.waitForTimeout(100)

    const pos = await page.evaluate(({ tNth }) => {
      const h = document.querySelector('.pila-drag-handle') as HTMLElement
      const hr = h.getBoundingClientRect()
      const t = document.querySelector(`.pila-editor > .pila-block:nth-child(${tNth})`) as HTMLElement
      const tr = t.getBoundingClientRect()
      return {
        hx: hr.left + hr.width / 2, hy: hr.top + hr.height / 2,
        tx: tr.left + tr.width / 2, ty: tr.top + tr.height * 0.75,
      }
    }, { tNth: targetNth })

    // Start drag but stay mid-way to check indicator
    await page.mouse.move(pos.hx, pos.hy)
    await page.mouse.down()
    await page.waitForTimeout(50)
    await page.mouse.move(pos.hx, pos.hy + 5, { steps: 3 })
    await page.mouse.move(pos.tx, pos.ty, { steps: 20 })

    const indicatorVisible = await page.evaluate(() => {
      const ind = document.querySelector('.pila-drop-indicator') as HTMLElement
      return ind?.style.display !== 'none'
    })
    console.log('Indicator visible mid-drag:', indicatorVisible)

    await page.mouse.up()
    expect(indicatorVisible).toBe(true)
  })

  test('native: callout block reorders after real drag', async ({ page }) => {
    const idsBefore = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('.pila-editor > .pila-block'))
        .map(b => b.dataset.blockId ?? '')
    )
    const calloutNth = await page.evaluate(() => {
      const blocks = Array.from(document.querySelectorAll<HTMLElement>('.pila-editor > .pila-block'))
      return blocks.findIndex(b => b.tagName.toLowerCase() === 'pila-callout') + 1
    })
    const targetNth = calloutNth + 1

    await page.hover(`.pila-editor > .pila-block:nth-child(${calloutNth})`)
    await page.waitForTimeout(100)

    const pos = await page.evaluate(({ tNth }) => {
      const h = document.querySelector('.pila-drag-handle') as HTMLElement
      const hr = h.getBoundingClientRect()
      const t = document.querySelector(`.pila-editor > .pila-block:nth-child(${tNth})`) as HTMLElement
      const tr = t.getBoundingClientRect()
      return {
        hx: hr.left + hr.width / 2, hy: hr.top + hr.height / 2,
        tx: tr.left + tr.width / 2, ty: tr.top + tr.height * 0.75,
      }
    }, { tNth: targetNth })

    console.log(`Dragging callout at [${calloutNth}] → after [${targetNth}]`)
    await nativeDrag(page, pos.hx, pos.hy, pos.tx, pos.ty)

    const idsAfter = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('.pila-editor > .pila-block'))
        .map(b => b.dataset.blockId ?? '')
    )
    console.log('Before:', idsBefore.slice(calloutNth - 1, calloutNth + 2))
    console.log('After: ', idsAfter.slice(calloutNth - 1, calloutNth + 2))

    // callout (was at calloutNth-1) should now be at calloutNth after moving past next block
    expect(idsAfter[calloutNth - 1]).toBe(idsBefore[calloutNth])
    expect(idsAfter[calloutNth]).toBe(idsBefore[calloutNth - 1])
  })
})
