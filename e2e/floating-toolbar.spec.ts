import { expect, test } from '@playwright/test'
import { getEditorJson, selectWordInFirstParagraph, waitForEditor } from './helpers/editor'

test.describe('Floating toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await waitForEditor(page)
  })

  test('shows on text selection and toggles bold', async ({ page }) => {
    await selectWordInFirstParagraph(page)

    const toolbar = page.locator('[data-pila-ui="floating-toolbar"]').first()
    await expect(toolbar).toBeVisible()

    await toolbar.locator('button[title="Bold"]').click()

    const json = await getEditorJson(page)
    const hasBold = JSON.stringify(json).includes('"bold":true')
    expect(hasBold).toBe(true)
  })

  test('link input applies href and email export sanitizes unsafe schemes', async ({ page }) => {
    await selectWordInFirstParagraph(page)

    const toolbar = page.locator('[data-pila-ui="floating-toolbar"]').first()
    await expect(toolbar).toBeVisible()

    await toolbar.locator('button[title="Link"]').click()

    const input = toolbar.locator('input.pila-toolbar-link-input')
    await expect(input).toBeVisible()
    await input.fill('javascript:alert(1)')
    await input.press('Enter')

    await page.locator('#btn-email').click()
    const emailHtml = (await page.locator('#output').textContent()) ?? ''

    expect(emailHtml.toLowerCase()).not.toContain('javascript:')
  })

  test('toolbar hides when selection collapses', async ({ page }) => {
    await selectWordInFirstParagraph(page)
    await expect(page.locator('[data-pila-ui="floating-toolbar"]').first()).toBeVisible()

    await page.keyboard.press('ArrowRight')
    await expect(page.locator('[data-pila-ui="floating-toolbar"]').first()).toBeHidden()
  })
})
