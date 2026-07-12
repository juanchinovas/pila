import { expect, test } from '@playwright/test'
import { getEditorJson, mainBlockNth, waitForEditor } from './helpers/editor'

test.describe('Block-specific workflows and edge behavior', () => {
  test.beforeEach(async ({ page }) => {
    await waitForEditor(page)
  })

  test('todo checkbox toggles visual/data state', async ({ page }) => {
    const todoCheckbox = page.locator('pila-todo .pila-todo-checkbox').first()
    await expect(todoCheckbox).toBeVisible()

    await todoCheckbox.check()
    await expect(todoCheckbox).toBeChecked()

    const json = await getEditorJson(page)
    const hasCheckedTodo = json.some((block) => {
      const b = block as { type?: string; attrs?: { checked?: boolean } }
      return b.type === 'todo' && b.attrs?.checked === true
    })
    expect(hasCheckedTodo).toBe(true)
  })

  test('code block language change and content persists across focus changes', async ({ page }) => {
    const codeBlock = page.locator('#editor .pila-editor > pila-code').first()
    const codeInput = codeBlock.locator('[contenteditable]').first()
    const language = codeBlock.locator('select').first()

    await language.selectOption('python')
    await codeInput.click()
    await page.keyboard.press('End')
    await codeInput.type('\nprint("ok")')

    await page.locator(`${mainBlockNth(2)} [contenteditable]`).first().click()
    await codeInput.click()

    await expect(language).toHaveValue('python')
    await expect(codeInput).toContainText('print("ok")')
  })

  test('table supports tab navigation and persists edited cells', async ({ page }) => {
    const tableCells = page.locator('#editor .pila-editor > pila-table td [contenteditable]')
    await expect(tableCells.first()).toBeVisible()

    await tableCells.first().click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.type('Cell-A')
    await page.keyboard.press('Tab')

    const values = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('#editor .pila-editor > pila-table td [contenteditable]'))
        .map((el) => (el.textContent ?? '').trim()),
    )
    expect(values).toContain('Cell-A')
  })

  test('button block style + alignment update and serialize', async ({ page }) => {
    const buttonBlock = page.locator('#editor .pila-editor > pila-button').first()
    const label = buttonBlock.locator('[contenteditable]').first()
    await label.click()

    const bar = page.locator('input[type="url"]').first().locator('xpath=ancestor::div[1]')
    await expect(bar).toBeVisible()

    await bar.getByRole('button', { name: 'Outline' }).click()
    await bar.getByRole('button', { name: 'Center' }).click()

    const json = await getEditorJson(page)
    const withAttrs = json.find((block) => {
      const b = block as { type?: string }
      return b.type === 'button'
    }) as { attrs?: { buttonStyle?: string; alignment?: string } } | undefined

    expect(withAttrs?.attrs?.buttonStyle).toBe('outline')
    expect(withAttrs?.attrs?.alignment).toBe('center')
  })
})
