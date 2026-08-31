import { expect, test } from '@playwright/test'
import { getEditorJson, selectWordInFirstParagraph, waitForEditor } from './helpers/editor'

async function openSlashOnSecondBlock(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const editable = document.querySelector<HTMLElement>('#editor .pila-editor > .pila-block:nth-child(2) [contenteditable]')
    if (!editable) throw new Error('Second block editable not found')
    editable.focus()
    editable.textContent = ''
    editable.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'deleteContentBackward' }))
  })

  const slashTarget = page.locator('#editor .pila-editor > .pila-block:nth-child(2) [contenteditable]').first()
  await slashTarget.click()
  await slashTarget.type('/bad')
  const menu = page.locator('[data-pila-ui="slash-menu"]:visible').last()
  await expect(menu).toBeVisible()
  return { slashTarget, menu }
}

test.describe('Plugin extensibility', () => {
  test.beforeEach(async ({ page }) => {
    await waitForEditor(page)
  })

  test('plugin block appears in slash menu and inserts through the editor', async ({ page }) => {
    const { menu } = await openSlashOnSecondBlock(page)
    await menu.locator('.pila-slash-item', { hasText: 'Badge' }).first().click()

    await expect(page.locator('.pila-plugin-badge').first()).toBeVisible()

    const json = await getEditorJson(page)
    const badgeBlock = json.find((block) => (block as { type?: string }).type === 'badge') as { type?: string } | undefined
    expect(badgeBlock?.type).toBe('badge')
  })

  test('plugin toolbar button executes and persists block state', async ({ page }) => {
    await selectWordInFirstParagraph(page)

    const toolbar = page.locator('[data-pila-ui="floating-toolbar"]:visible').first()
    await expect(toolbar).toBeVisible()
    await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>('[data-pila-ui="floating-toolbar"] button[title="Plugin Marker"]')
      if (!button) throw new Error('Plugin Marker toolbar button not found')
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
      button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }))
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })

    await expect.poll(async () => page.evaluate(() => (window as typeof window & {
      __pilaDemoPluginState?: { toolbarClicks: number }
    }).__pilaDemoPluginState?.toolbarClicks ?? 0)).toBe(1)

    const json = await getEditorJson(page)
    const markedParagraph = json.find((block) => {
      const candidate = block as { type?: string; attrs?: { tailwindClasses?: string } }
      return candidate.type === 'paragraph' && candidate.attrs?.tailwindClasses?.includes('plugin-marked')
    })

    expect(markedParagraph).toBeTruthy()
  })

  test('plugin emoji provider contributes results and custom insert text', async ({ page }) => {
    const editable = page.locator('#editor .pila-editor > .pila-block:nth-child(2) [contenteditable]').first()

    await page.evaluate(() => {
      const target = document.querySelector<HTMLElement>('#editor .pila-editor > .pila-block:nth-child(2) [contenteditable]')
      if (!target) throw new Error('Second block editable not found')
      target.textContent = ':rocket'
      target.focus()

      const range = document.createRange()
      range.selectNodeContents(target)
      range.collapse(false)

      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)

      target.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: 't' }))
    })

    const emojiMenu = page.locator('[data-pila-ui="emoji-popover"]:visible').first()
    await expect(emojiMenu).toBeVisible()
    await expect(emojiMenu).toContainText(':rocket_plugin:')
    await emojiMenu.locator('.pila-emoji-list > div', { hasText: ':rocket_plugin:' }).first().click()

    await expect(editable).toContainText('[[rocket]]')

    const json = await getEditorJson(page)
    const updatedParagraph = json[1] as { content?: Array<{ text?: string }> } | undefined
    expect(updatedParagraph?.content?.some((node) => node.text?.includes('[[rocket]]'))).toBe(true)
  })
})