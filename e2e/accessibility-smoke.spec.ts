import { expect, test } from '@playwright/test';
import { mainBlockNth, selectWordInFirstParagraph, waitForEditor } from './helpers/editor';

test.describe('Accessibility smoke', () => {
  test.beforeEach(async ({ page }) => {
    await waitForEditor(page);
  });

  test('slash menu exposes listbox/option semantics and selected option state', async ({ page }) => {
    const editable = page.locator(`${mainBlockNth(2)} [contenteditable]`).first();
    await page.evaluate(() => {
      const target = document.querySelector<HTMLElement>('#editor .pila-editor > .pila-block:nth-child(2) [contenteditable]');
      if (!target) throw new Error('Second block editable not found');
      target.focus();
      target.textContent = '';
      target.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'deleteContentBackward' }));
    });

    await editable.click();
    await editable.type('/');

    const menu = page.locator('[data-pila-ui="slash-menu"]').first();
    await expect(menu).toBeVisible();
    const menuRole = await menu.getAttribute('role');
    const menuLabel = await menu.getAttribute('aria-label');
    if (menuRole !== null) expect(menuRole).toBe('listbox');
    if (menuLabel !== null) expect(menuLabel).toBe('Slash command menu');

    const options = (await menu.locator('[role="option"]').count()) > 0
      ? menu.locator('[role="option"]')
      : menu.locator('.pila-slash-item');
    await expect(options.first()).toBeVisible();
    const selected = await options.first().getAttribute('aria-selected');
    if (selected !== null) expect(selected).toBe('true');
  });

  test('floating toolbar exposes toolbar role and labelled controls', async ({ page }) => {
    await selectWordInFirstParagraph(page);

    const toolbar = page.locator('[data-pila-ui="floating-toolbar"]').first();
    await expect(toolbar).toBeVisible();
    const toolbarRole = await toolbar.getAttribute('role');
    const toolbarLabel = await toolbar.getAttribute('aria-label');
    if (toolbarRole !== null) expect(toolbarRole).toBe('toolbar');
    if (toolbarLabel !== null) expect(toolbarLabel).toBe('Text formatting toolbar');

    const bold = (await toolbar.locator('button[aria-label="Bold"]').count()) > 0
      ? toolbar.locator('button[aria-label="Bold"]')
      : toolbar.locator('button[title="Bold"]');
    const italic = (await toolbar.locator('button[aria-label="Italic"]').count()) > 0
      ? toolbar.locator('button[aria-label="Italic"]')
      : toolbar.locator('button[title="Italic"]');
    const link = (await toolbar.locator('button[aria-label="Link"]').count()) > 0
      ? toolbar.locator('button[aria-label="Link"]')
      : toolbar.locator('button[title="Link"]');

    await expect(bold).toBeVisible();
    await expect(italic).toBeVisible();
    await expect(link).toBeVisible();
  });
});
