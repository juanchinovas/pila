import { expect, test } from '@playwright/test'
import { mainBlockNth, waitForEditor } from './helpers/editor'

async function setTopBlockText(page: import('@playwright/test').Page, nth: number, text: string): Promise<void> {
  await page.evaluate(({ blockIndex, value }) => {
    const editable = document.querySelector<HTMLElement>(
      `#editor .pila-editor > .pila-block:nth-child(${blockIndex}) [contenteditable]`,
    )
    if (!editable) throw new Error(`Editable not found for block ${blockIndex}`)

    editable.focus()
    editable.textContent = value
    editable.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }))
  }, { blockIndex: nth, value: text })
}

test.describe('Post example export coverage', () => {
  test.beforeEach(async ({ page }) => {
    await waitForEditor(page)
  })

  test('builds a post example and exports to json, html, email and markdown', async ({ page }) => {
    const title = 'Launch Day: Pila 1.1'
    const intro = 'Today we shipped a major editor update focused on reliability, speed, and authoring joy.'
    const section = 'What shipped'
    const bullet1 = 'A hardened overlay lifecycle with deterministic mount/unmount behavior.'
    const bullet2 = 'Keyboard-first slash workflows that stay predictable under stress.'
    const bullet3 = 'Export parity across JSON, HTML, Email HTML, and Markdown outputs.'
    const todo = 'Publish migration notes and upgrade guide before Friday.'
    const quote = 'Quality is not a phase, it is a product feature.'
    const callout = 'Heads-up: plugin authors should verify slash item labels after upgrading.'

    await expect(page.locator(`${mainBlockNth(1)} [contenteditable]`).first()).toBeVisible()
    await setTopBlockText(page, 1, title)
    await setTopBlockText(page, 2, intro)
    await setTopBlockText(page, 3, section)
    await setTopBlockText(page, 4, bullet1)
    await setTopBlockText(page, 5, bullet2)
    await setTopBlockText(page, 6, todo)
    await setTopBlockText(page, 7, bullet3)
    await setTopBlockText(page, 9, quote)
    await setTopBlockText(page, 10, callout)

    const markers = [title, intro, section, bullet1, bullet2, bullet3, todo, quote, callout]

    await page.evaluate(() => (document.querySelector<HTMLButtonElement>('#btn-json')?.click()))
    const jsonText = (await page.locator('#output').textContent()) ?? '[]'
    const json = JSON.parse(jsonText) as Array<Record<string, unknown>>

    expect(Array.isArray(json)).toBe(true)
    const serializedJson = JSON.stringify(json)
    for (const marker of markers) {
      expect(serializedJson).toContain(marker)
    }

    await page.evaluate(() => (document.querySelector<HTMLButtonElement>('#btn-html')?.click()))
    const html = (await page.locator('#output').textContent()) ?? ''
    for (const marker of markers) {
      expect(html).toContain(marker)
    }
    expect(html.toLowerCase()).toContain('<h1')

    await page.evaluate(() => (document.querySelector<HTMLButtonElement>('#btn-email')?.click()))
    const email = (await page.locator('#output').textContent()) ?? ''
    for (const marker of markers) {
      expect(email).toContain(marker)
    }
    expect(email.toLowerCase()).not.toContain('javascript:')

    await page.evaluate(() => (document.querySelector<HTMLButtonElement>('#btn-md')?.click()))
    const markdown = (await page.locator('#output').textContent()) ?? ''
    expect(markdown).toContain(`# ${title}`)
    for (const marker of markers.slice(1)) {
      expect(markdown).toContain(marker)
    }
  })
})
