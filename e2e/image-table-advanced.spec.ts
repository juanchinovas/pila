import { expect, test } from '@playwright/test'
import { getEditorJson, waitForEditor } from './helpers/editor'

async function clickVisibleTableHandle(page: import('@playwright/test').Page, kind: 'row' | 'col' | 'cell') {
  await page.evaluate((expectedKind) => {
    const visibleHandles = Array.from(document.querySelectorAll<HTMLElement>('.pila-table-handle'))
      .filter((el) => getComputedStyle(el).display !== 'none')

    const target = visibleHandles.find((el) => {
      const rect = el.getBoundingClientRect()
      if (expectedKind === 'row') return rect.height > rect.width * 1.5
      if (expectedKind === 'col') return rect.width > rect.height * 1.5
      return Math.abs(rect.width - rect.height) < 6
    })

    if (!target) throw new Error(`Missing visible ${expectedKind} handle`)

    const rect = target.getBoundingClientRect()
    target.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    }))
  }, kind)
}

async function setTableColor(page: import('@playwright/test').Page, label: 'Background' | 'Text color', value: string) {
  await page.evaluate(({ targetLabel, nextValue }) => {
    const visiblePopovers = Array.from(document.querySelectorAll<HTMLElement>('.pila-block-popover'))
      .filter((el) => getComputedStyle(el).display !== 'none')
    const visiblePopover = visiblePopovers[visiblePopovers.length - 1]
    if (!visiblePopover) throw new Error('Visible table popover not found')

    const items = Array.from(visiblePopover.querySelectorAll<HTMLElement>('.pila-popover-item'))
    const item = items.find((el) => {
      const rowLabel = el.querySelector('.pila-popover-label')?.textContent?.trim()
      return rowLabel === targetLabel
    })
    if (!item) throw new Error(`Table color item not found for label: ${targetLabel}`)

    const input = item.querySelector<HTMLInputElement>('input[type="color"]')
    if (!input) throw new Error(`Table color input not found for label: ${targetLabel}`)
    input.value = nextValue
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, { targetLabel: label, nextValue: value })
}

async function clickVisiblePopoverAction(page: import('@playwright/test').Page, label: string) {
  await page.evaluate((targetLabel) => {
    const visiblePopovers = Array.from(document.querySelectorAll<HTMLElement>('.pila-block-popover'))
      .filter((el) => getComputedStyle(el).display !== 'none')
    const visiblePopover = visiblePopovers[visiblePopovers.length - 1]
    if (!visiblePopover) throw new Error('Visible block popover not found')

    const items = Array.from(visiblePopover.querySelectorAll<HTMLElement>('.pila-popover-item'))
    const target = items.find((el) => {
      const rowLabel = el.querySelector('.pila-popover-label')?.textContent?.trim()
      return rowLabel === targetLabel
    })
    if (!target) throw new Error(`Popover action not found: ${targetLabel}`)

    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }))
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  }, label)
}

async function setImagePopoverInputByLabel(
  page: import('@playwright/test').Page,
  label: string,
  value: string,
) {
  await page.evaluate(({ targetLabel, nextValue }) => {
    const popover = document.querySelector<HTMLElement>('.pila-image-props-popover')
    if (!popover) throw new Error('Image properties popover not found')

    const labels = Array.from(popover.querySelectorAll('label'))
    const target = labels.find((el) => (el.textContent ?? '').trim() === targetLabel)
    if (!target) throw new Error(`Image popover label not found: ${targetLabel}`)

    const wrapper = target.parentElement
    const input = wrapper?.querySelector<HTMLInputElement>('input')
    if (!input) throw new Error(`Image popover input not found for label: ${targetLabel}`)

    input.value = nextValue
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, { targetLabel: label, nextValue: value })
}

async function tableHasHeaderIndex(
  page: import('@playwright/test').Page,
  key: 'headerRows' | 'headerCols',
  index: number,
): Promise<boolean> {
  const json = await getEditorJson(page)
  const table = json.find((block) => (block as { type?: string }).type === 'table') as {
    attrs?: { headerRows?: number[]; headerCols?: number[] }
  } | undefined
  const values = table?.attrs?.[key]
  return Array.isArray(values) && values.includes(index)
}

async function toggleHeaderWithRetry(
  page: import('@playwright/test').Page,
  cell: import('@playwright/test').Locator,
  kind: 'row' | 'col',
  actionLabel: 'Toggle row as header' | 'Toggle column as header',
  key: 'headerRows' | 'headerCols',
): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await cell.hover()
    await clickVisibleTableHandle(page, kind)
    await clickVisiblePopoverAction(page, actionLabel)
    if (await tableHasHeaderIndex(page, key, 0)) return
  }

  expect(await tableHasHeaderIndex(page, key, 0)).toBe(true)
}

test.describe('Advanced image and table workflows', () => {
  test.describe.configure({ timeout: 60_000 })

  test.beforeEach(async ({ page }) => {
    await waitForEditor(page)
  })

  test('image properties, caption edits, resize persistence, and keyboard actions work together', async ({ page }) => {
    const imageFigure = page.locator('#editor .pila-editor > pila-image figure').first()
    const image = page.locator('#editor .pila-editor > pila-image img').first()
    const caption = page.locator('#editor .pila-editor > pila-image figcaption[contenteditable="true"]').first()

    await caption.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.type('Caption from test')

    await imageFigure.hover()
    await page.locator('button[title="Edit image properties"]').first().click()
    const popover = page.locator('.pila-image-props-popover').first()
    await expect(popover).toBeVisible()
    await setImagePopoverInputByLabel(page, 'Alt Text', 'Popover alt text')
    await popover.locator('select').first().selectOption('contain')
    await setImagePopoverInputByLabel(page, 'Border Radius (px)', '12px')
    await popover.getByRole('button', { name: 'Save' }).click()

    await page.evaluate(() => {
      const handle = document.querySelector<HTMLElement>('#editor .pila-editor > pila-image figure .cursor-col-resize')
      if (!handle) throw new Error('Image resize handle not found')
      const rect = handle.getBoundingClientRect()
      handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: rect.left + 1, clientY: rect.top + 1 }))
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: rect.left + 80, clientY: rect.top + 1 }))
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: rect.left + 80, clientY: rect.top + 1 }))
    })

    let json = await getEditorJson(page)
    let imageBlock = json.find((block) => (block as { type?: string }).type === 'image') as {
      attrs?: { alt?: string; width?: string; objectFit?: string; borderRadius?: string }
    } | undefined
    expect(imageBlock?.attrs?.alt).toBe('Popover alt text')
    expect(imageBlock?.attrs?.objectFit).toBe('contain')
    expect(imageBlock?.attrs?.borderRadius).toBe('12px')
    expect(imageBlock?.attrs?.width).toMatch(/px$/)

    const blocksBeforeEnter = await page.locator('#editor .pila-editor > .pila-block').count()
    await image.focus()
    await expect.poll(async () => page.evaluate(() => document.activeElement?.tagName)).toBe('IMG')
    await page.keyboard.press('Enter')
    await expect.poll(async () => page.locator('#editor .pila-editor > .pila-block').count()).toBe(blocksBeforeEnter + 1)

    const imagesBeforeDelete = await page.locator('#editor .pila-editor > pila-image').count()
    await image.focus()
    await page.keyboard.press('Delete')
    if (await page.locator('#editor .pila-editor > pila-image').count() === imagesBeforeDelete) {
      await image.focus()
      await page.keyboard.press('Backspace')
    }
    await expect.poll(async () => page.locator('#editor .pila-editor > pila-image').count()).toBe(imagesBeforeDelete - 1)
  })

  test('table header toggles, merge and unmerge persist through JSON and HTML export', async ({ page }) => {
    const firstCell = page.locator('#editor .pila-editor > pila-table [data-row-index="0"][data-col-index="0"]').first()
    const bodyMergeStart = page.locator('#editor .pila-editor > pila-table [data-row-index="1"][data-col-index="1"]').first()
    const bodyMergeEnd = page.locator('#editor .pila-editor > pila-table [data-row-index="2"][data-col-index="2"]').first()

    await toggleHeaderWithRetry(page, firstCell, 'row', 'Toggle row as header', 'headerRows')
    await toggleHeaderWithRetry(page, firstCell, 'col', 'Toggle column as header', 'headerCols')

    const startBox = await bodyMergeStart.boundingBox()
    const endBox = await bodyMergeEnd.boundingBox()
    if (!startBox || !endBox) throw new Error('Missing table cell geometry for selection')

    await page.mouse.move(startBox.x + 8, startBox.y + 8)
    await page.mouse.down()
    await page.mouse.move(endBox.x + endBox.width - 8, endBox.y + endBox.height - 8, { steps: 12 })
    await page.mouse.up()

    await expect.poll(async () => page.locator('.pila-cell-selected').count()).toBe(4)

    await bodyMergeEnd.hover()
    await clickVisibleTableHandle(page, 'row')
    await expect(page.locator('.pila-block-popover:visible .pila-popover-item', { hasText: 'Merge cells' })).toBeVisible()
    await clickVisiblePopoverAction(page, 'Merge cells')
    await expect(page.locator('#editor .pila-editor > pila-table [data-row-index="1"][data-col-index="1"]').first()).toHaveAttribute('colspan', '2')
    await expect(page.locator('#editor .pila-editor > pila-table [data-row-index="1"][data-col-index="1"]').first()).toHaveAttribute('rowspan', '2')

    let json = await getEditorJson(page)
    const mergedTable = json.find((block) => (block as { type?: string }).type === 'table') as {
      attrs?: { headerRows?: number[]; headerCols?: number[]; rows?: Array<{ cells: Array<{ colspan?: number; rowspan?: number }> }> }
    } | undefined
    expect(mergedTable?.attrs?.headerRows).toContain(0)
    expect(mergedTable?.attrs?.headerCols).toContain(0)
    expect(mergedTable?.attrs?.rows?.[1]?.cells?.[1]?.colspan).toBe(2)
    expect(mergedTable?.attrs?.rows?.[1]?.cells?.[1]?.rowspan).toBe(2)

    await bodyMergeStart.hover()
    await clickVisibleTableHandle(page, 'row')
    await clickVisiblePopoverAction(page, 'Unmerge cells')

    json = await getEditorJson(page)
    const unmergedTable = json.find((block) => (block as { type?: string }).type === 'table') as {
      attrs?: { rows?: Array<{ cells: Array<{ colspan?: number; rowspan?: number }> }> }
    } | undefined
    expect(unmergedTable?.attrs?.rows?.[1]?.cells).toHaveLength(3)
    expect(unmergedTable?.attrs?.rows?.[1]?.cells?.[1]?.colspan).toBeUndefined()
    expect(unmergedTable?.attrs?.rows?.[1]?.cells?.[1]?.rowspan).toBeUndefined()

    await page.locator('#btn-html').click()
    await expect(page.locator('#output')).toContainText('<thead>')
    await expect(page.locator('#output')).toContainText('<th')
  })

  test('table style changes and drag reorder persist through JSON and email/html export', async ({ page }) => {
    const cell = page.locator('#editor .pila-editor > pila-table [data-row-index="1"][data-col-index="1"]').first()
    await cell.hover()
    await clickVisibleTableHandle(page, 'cell')
    await setTableColor(page, 'Background', '#00ff00')
    await expect.poll(async () => cell.evaluate((el) => (el as HTMLElement).style.backgroundColor)).not.toBe('')

    await cell.hover()
    await clickVisibleTableHandle(page, 'cell')
    await setTableColor(page, 'Text color', '#ff0000')
    await expect.poll(async () => cell.evaluate((el) => (el as HTMLElement).style.color)).not.toBe('')

    await cell.hover()
    await clickVisibleTableHandle(page, 'cell')
    await clickVisiblePopoverAction(page, 'Align center')

    await page.evaluate(() => {
      const visibleHandles = Array.from(document.querySelectorAll<HTMLElement>('.pila-table-handle'))
        .filter((el) => getComputedStyle(el).display !== 'none')
      const rowHandle = visibleHandles.find((el) => {
        const rect = el.getBoundingClientRect()
        return rect.height > rect.width * 1.5
      })
      const targetRow = document.querySelector<HTMLTableRowElement>('#editor .pila-editor > pila-table tr[data-row-index="0"]')
      if (!rowHandle || !targetRow) throw new Error('Missing row drag handle or target row')

      const targetRect = targetRow.getBoundingClientRect()
      const data = new DataTransfer()
      rowHandle.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
      targetRow.dispatchEvent(new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: data,
        clientX: targetRect.left + targetRect.width / 2,
        clientY: targetRect.top + targetRect.height * 0.25,
      }))
      rowHandle.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: data }))
    })

    await page.locator('#editor .pila-editor > pila-table [data-row-index="0"][data-col-index="0"]').first().hover()
    await page.evaluate(() => {
      const visibleHandles = Array.from(document.querySelectorAll<HTMLElement>('.pila-table-handle'))
        .filter((el) => getComputedStyle(el).display !== 'none')
      const colHandle = visibleHandles.find((el) => {
        const rect = el.getBoundingClientRect()
        return rect.width > rect.height * 1.5
      })
      const targetCell = document.querySelector<HTMLElement>('#editor .pila-editor > pila-table [data-row-index="0"][data-col-index="0"]')
      if (!colHandle || !targetCell) throw new Error('Missing column drag handle or target cell')

      const targetRect = targetCell.getBoundingClientRect()
      const data = new DataTransfer()
      colHandle.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
      targetCell.dispatchEvent(new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: data,
        clientX: targetRect.left + targetRect.width * 0.25,
        clientY: targetRect.top + targetRect.height / 2,
      }))
      colHandle.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: data }))
    })

    const json = await getEditorJson(page)
    const table = json.find((block) => (block as { type?: string }).type === 'table') as {
      attrs?: {
        rows?: Array<{ cells: Array<{ background?: string; color?: string; align?: string; content?: Array<{ text?: string }> }> }>
      }
    } | undefined

    const styledCenterCell = table?.attrs?.rows
      ?.flatMap((row) => row.cells)
      .find((cellData) => cellData.align === 'center')
    expect(styledCenterCell).toBeTruthy()
    expect(styledCenterCell?.background).toBeTruthy()
    expect(styledCenterCell?.color).toBeTruthy()
    expect(table?.attrs?.rows?.[0]?.cells?.[0]?.content?.[0]?.text).not.toBe('Name')

    await page.locator('#btn-html').click()
    await expect(page.locator('#output')).toContainText(/background-color:(rgb\(0,\s*255,\s*0\)|#00ff00)/i)
    await expect(page.locator('#output')).toContainText(/color:(rgb\(255,\s*0,\s*0\)|#ff0000)/i)

    await page.locator('#btn-email').click()
    await expect(page.locator('#output')).toContainText(/background:(rgb\(0,\s*255,\s*0\)|#00ff00)/i)
    await expect(page.locator('#output')).toContainText(/color:(rgb\(255,\s*0,\s*0\)|#ff0000)/i)
  })
})