import { expect, test } from '@playwright/test'
import { getEditorJson, mainBlockNth, waitForEditor } from './helpers/editor'

function currentSlashMenu(page: import('@playwright/test').Page) {
  return page.locator('[data-pila-ui="slash-menu"]:visible').last()
}

async function openSlashOnSecondBlock(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const editable = document.querySelector<HTMLElement>('#editor .pila-editor > .pila-block:nth-child(2) [contenteditable]')
    if (!editable) throw new Error('Second block editable not found')
    editable.focus()
    editable.textContent = ''
    editable.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'deleteContentBackward' }))
  })

  const slashTarget = page.locator(`${mainBlockNth(2)} [contenteditable]`).first()
  await slashTarget.click()
  await slashTarget.type('/')

  const menu = currentSlashMenu(page)
  await expect(menu).toBeVisible()
  return { slashTarget, menu }
}

test.describe('Slash menu keyboard workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForEditor(page)
  })

  test('opens with slash trigger and closes with Escape', async ({ page }) => {
    const { slashTarget, menu } = await openSlashOnSecondBlock(page)

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()

    await slashTarget.type('x')
    await expect(slashTarget).toContainText('x')
  })

  test('keyboard confirm inserts callout block and keeps focus inside block', async ({ page }) => {
    const calloutsBefore = await page.locator('#editor .pila-editor > pila-callout').count()
    const { menu } = await openSlashOnSecondBlock(page)
    await menu.locator('.pila-slash-item', { hasText: 'Callout · Info' }).first().click()

    await expect.poll(async () => page.locator('#editor .pila-editor > pila-callout').count()).toBe(calloutsBefore + 1)

    await expect.poll(async () => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      return Boolean(active && active.closest('#editor .pila-editor') && active.getAttribute('contenteditable') === 'true')
    })).toBe(true)
  })

  test('arrow navigation changes selected item before confirm', async ({ page }) => {
    const before = await getEditorJson(page)
    const blockBefore = before[1] as { type?: string } | undefined
    expect(blockBefore?.type).toBe('paragraph')

    await openSlashOnSecondBlock(page)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    const after = await getEditorJson(page)
    const blockAfter = after[1] as { type?: string } | undefined
    expect(blockAfter?.type).toBe('heading1')
  })
})
