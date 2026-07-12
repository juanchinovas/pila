import { expect, test } from '@playwright/test'
import { activeSlashMenu, mainBlockNth, selectWordInFirstParagraph, waitForEditor } from './helpers/editor'

test.describe('Overlay lifecycle and dismissal', () => {
  test.beforeEach(async ({ page }) => {
    await waitForEditor(page)
  })

  test('slash menu does not duplicate on repeated open/close cycles', async ({ page }) => {
    const editable = page.locator(`${mainBlockNth(2)} [contenteditable]`).first()
    const initialSlashCount = await page.locator('[data-pila-ui="slash-menu"]').count()

    for (let i = 0; i < 4; i += 1) {
      await editable.click()
      await page.keyboard.press('End')
      await page.keyboard.press('Enter')
      const slashTarget = page.locator(`${mainBlockNth(3)} [contenteditable]`).first()
      await slashTarget.type('/')
      await expect(activeSlashMenu(page)).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(activeSlashMenu(page)).toBeHidden()
    }

    const slashCount = await page.locator('[data-pila-ui="slash-menu"]').count()
    expect(slashCount).toBe(initialSlashCount)
  })

  test('outside click dismisses floating toolbar and editor remains interactive', async ({ page }) => {
    await selectWordInFirstParagraph(page)
    await expect(page.locator('[data-pila-ui="floating-toolbar"]').first()).toBeVisible()

    await page.mouse.click(8, 8)
    await expect(page.locator('[data-pila-ui="floating-toolbar"]').first()).toBeHidden()

    const editable = page.locator(`${mainBlockNth(2)} [contenteditable]`).first()
    await editable.click()
    await editable.type(' ok')
    await expect(editable).toContainText('ok')
  })

  test('opening one overlay closes another predictably', async ({ page }) => {
    const editable = page.locator(`${mainBlockNth(2)} [contenteditable]`).first()

    await editable.click()
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    const slashTarget2 = page.locator(`${mainBlockNth(3)} [contenteditable]`).first()
    await slashTarget2.type('/')
    await expect(activeSlashMenu(page)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(activeSlashMenu(page)).toBeHidden()

    await selectWordInFirstParagraph(page)
    await expect(page.locator('[data-pila-ui="floating-toolbar"]').first()).toBeVisible()

    await editable.click()
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    const slashTarget = page.locator(`${mainBlockNth(3)} [contenteditable]`).first()
    await slashTarget.type('/')
    await expect(activeSlashMenu(page)).toBeVisible()

    await expect(page.locator('[data-pila-ui="floating-toolbar"]').first()).toBeHidden()
  })
})
