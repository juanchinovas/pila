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

async function setTableColor(page: import('@playwright/test').Page, value: string) {
  await page.evaluate((nextValue) => {
    const input = document.querySelector<HTMLInputElement>('#color_picker_input_table')
    if (!input) throw new Error('Table color picker input not found')
    input.value = nextValue
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}

test.describe('Advanced image and table workflows', () => {
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
    await popover.locator('input[type="text"]').nth(3).fill('Popover alt text')
    await popover.locator('select').selectOption('contain')
    await popover.locator('input[type="text"]').nth(4).fill('12px')
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
    await image.click()
    await page.keyboard.press('Enter')
    await expect.poll(async () => page.locator('#editor .pila-editor > .pila-block').count()).toBe(blocksBeforeEnter + 1)

    const imagesBeforeDelete = await page.locator('#editor .pila-editor > pila-image').count()
    await image.click()
    await page.keyboard.press('Delete')
    await expect.poll(async () => page.locator('#editor .pila-editor > pila-image').count()).toBe(imagesBeforeDelete - 1)
  })

  test('table header toggles, merge and unmerge persist through JSON and HTML export', async ({ page }) => {
    const firstCell = page.locator('#editor .pila-editor > pila-table [data-row-index="0"][data-col-index="0"]').first()
    const bodyMergeStart = page.locator('#editor .pila-editor > pila-table [data-row-index="1"][data-col-index="1"]').first()
    const bodyMergeEnd = page.locator('#editor .pila-editor > pila-table [data-row-index="2"][data-col-index="2"]').first()

    await firstCell.hover()
    await clickVisibleTableHandle(page, 'row')
    await page.locator('.pila-block-popover .pila-popover-item', { hasText: 'Toggle row as header' }).click()

    await firstCell.hover()
    await clickVisibleTableHandle(page, 'col')
    await page.locator('.pila-block-popover .pila-popover-item', { hasText: 'Toggle column as header' }).click()

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
    await expect(page.locator('.pila-block-popover .pila-popover-item', { hasText: 'Merge cells' })).toBeVisible()
    await page.locator('.pila-block-popover .pila-popover-item', { hasText: 'Merge cells' }).click()
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
    await page.locator('.pila-block-popover .pila-popover-item', { hasText: 'Unmerge cells' }).click()

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
    await page.locator('.pila-block-popover .pila-popover-item', { hasText: 'Background' }).click()
    await setTableColor(page, '#00ff00')

    await cell.hover()
    await clickVisibleTableHandle(page, 'cell')
    await page.locator('.pila-block-popover .pila-popover-item', { hasText: 'Text color' }).click()
    await setTableColor(page, '#ff0000')

    await cell.hover()
    await clickVisibleTableHandle(page, 'cell')
    await page.locator('.pila-block-popover .pila-popover-item', { hasText: 'Align center' }).click()

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

    expect(table?.attrs?.rows?.some((row) => row.cells.some((cellData) => cellData.background?.includes('0, 255, 0')))).toBe(true)
    expect(table?.attrs?.rows?.some((row) => row.cells.some((cellData) => cellData.color?.includes('255, 0, 0')))).toBe(true)
    expect(table?.attrs?.rows?.some((row) => row.cells.some((cellData) => cellData.align === 'center'))).toBe(true)
    expect(table?.attrs?.rows?.[0]?.cells?.[0]?.content?.[0]?.text).not.toBe('Name')

    await page.locator('#btn-html').click()
    await expect(page.locator('#output')).toContainText('background-color:rgb(0, 255, 0)')
    await expect(page.locator('#output')).toContainText('color:rgb(255, 0, 0)')

    await page.locator('#btn-email').click()
    await expect(page.locator('#output')).toContainText('background:rgb(0, 255, 0)')
    await expect(page.locator('#output')).toContainText('color:rgb(255, 0, 0)')
  })
})