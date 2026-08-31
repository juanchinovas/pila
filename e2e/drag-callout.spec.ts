import { expect, test, type Page } from '@playwright/test';
import { waitForEditor } from './helpers/editor';

async function getBlockIds(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('.pila-editor > .pila-block'))
      .map((b) => b.dataset.blockId ?? ''),
  );
}

async function findFirstCalloutNth(page: Page): Promise<number> {
  return page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>('.pila-editor > .pila-block'));
    return blocks.findIndex((b) => b.tagName.toLowerCase() === 'pila-callout') + 1;
  });
}

async function html5DragTo(
  page: Page,
  sourceSelector: string,
  targetSelector: string,
  insertAfter = true,
): Promise<{ targetId: string; insertAfter: string; visible: boolean }> {
  return page.evaluate(
    ({ src, tgt, after }) => {
      const source = document.querySelector(src) as HTMLElement | null;
      const target = document.querySelector(tgt) as HTMLElement | null;
      if (!source || !target) throw new Error(`Element not found: ${src} -> ${tgt}`);

      const targetRect = target.getBoundingClientRect();
      const dropY = after ? targetRect.top + targetRect.height * 0.75 : targetRect.top + targetRect.height * 0.25;
      const dropX = targetRect.left + targetRect.width / 2;

      const dt = new DataTransfer();
      dt.effectAllowed = 'move';

      source.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));

      for (let step = 0; step < 3; step += 1) {
        target.dispatchEvent(new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
          clientX: dropX,
          clientY: dropY,
        }));
      }

      const indicator = document.querySelector('.pila-drop-indicator') as HTMLElement | null;
      const indicatorState = {
        visible: (indicator?.style.display ?? 'none') !== 'none',
        targetId: indicator?.dataset.targetId ?? '',
        insertAfter: indicator?.dataset.insertAfter ?? '',
      };

      target.dispatchEvent(new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
        clientX: dropX,
        clientY: dropY,
      }));

      source.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

      return indicatorState;
    },
    { src: sourceSelector, tgt: targetSelector, after: insertAfter },
  );
}

async function nativeDrag(page: Page, fromX: number, fromY: number, toX: number, toY: number): Promise<void> {
  const safeToY = Math.min(toY, 860);
  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  await page.mouse.move(fromX, fromY + 6, { steps: 4 });
  await page.mouse.move(toX, safeToY, { steps: 20 });
  await page.mouse.up();
}

test.describe('Callout block drag and drop', () => {
  test.beforeEach(async ({ page }) => {
    await waitForEditor(page);
    await page.waitForSelector('.pila-editor > .pila-block:nth-child(10)');
  });

  test('handle tracks hovered callout block id', async ({ page }) => {
    const calloutNth = await findFirstCalloutNth(page);
    const calloutSel = `.pila-editor > .pila-block:nth-child(${calloutNth})`;
    const blockId = await page.locator(calloutSel).getAttribute('data-block-id');

    expect(blockId).toBeTruthy();
    await page.hover(calloutSel);

    await expect(page.locator('.pila-drag-handle').first()).toBeVisible();
    const handleBlockId = await page.locator('.pila-drag-handle').first().getAttribute('data-block-id');
    expect(handleBlockId).toBe(blockId);
  });

  test('html5 drag updates indicator target and reorders callout', async ({ page }) => {
    const idsBefore = await getBlockIds(page);
    const calloutNth = await findFirstCalloutNth(page);
    const targetNth = calloutNth + 1;

    const calloutSel = `.pila-editor > .pila-block:nth-child(${calloutNth})`;
    const targetSel = `.pila-editor > .pila-block:nth-child(${targetNth})`;
    const targetId = await page.locator(targetSel).getAttribute('data-block-id');

    await page.hover(calloutSel);
    await expect(page.locator('.pila-drag-handle').first()).toBeVisible();

    const indicator = await html5DragTo(page, '.pila-drag-handle', targetSel, true);
    expect(indicator.visible).toBe(true);
    expect(indicator.targetId).toBe(targetId ?? '');
    expect(indicator.insertAfter).toBe('true');

    const calloutId = idsBefore[calloutNth - 1];
    await expect.poll(async () => {
      const idsAfter = await getBlockIds(page);
      return idsAfter.indexOf(calloutId);
    }).toBe(calloutNth);
  });
});

test.describe('Native mouse drag - callout', () => {
  test.beforeEach(async ({ page }) => {
    await waitForEditor(page);
    await page.waitForSelector('.pila-editor > .pila-block:nth-child(10)');
  });

  test('native drag shows drop indicator while in-flight', async ({ page }) => {
    const calloutNth = await findFirstCalloutNth(page);
    const targetNth = calloutNth + 2;

    await page.hover(`.pila-editor > .pila-block:nth-child(${calloutNth})`);
    await expect(page.locator('.pila-drag-handle').first()).toBeVisible();

    const pos = await page.evaluate(({ tNth }) => {
      const handle = document.querySelector('.pila-drag-handle') as HTMLElement;
      const target = document.querySelector(`.pila-editor > .pila-block:nth-child(${tNth})`) as HTMLElement;
      const hr = handle.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      return {
        hx: hr.left + hr.width / 2,
        hy: hr.top + hr.height / 2,
        tx: tr.left + tr.width / 2,
        ty: tr.top + tr.height * 0.75,
      };
    }, { tNth: targetNth });

    await page.mouse.move(pos.hx, pos.hy);
    await page.mouse.down();
    await page.mouse.move(pos.hx, pos.hy + 6, { steps: 4 });
    await page.mouse.move(pos.tx, pos.ty, { steps: 20 });

    await expect(page.locator('.pila-drop-indicator').first()).toBeVisible();
    await page.mouse.up();
  });

  test('native drag reorders a callout with adjacent target', async ({ page }) => {
    const idsBefore = await getBlockIds(page);
    const calloutNth = await findFirstCalloutNth(page);
    const targetNth = calloutNth + 1;

    const calloutSel = `.pila-editor > .pila-block:nth-child(${calloutNth})`;
    const targetSel = `.pila-editor > .pila-block:nth-child(${targetNth})`;

    await page.hover(calloutSel);
    await expect(page.locator('.pila-drag-handle').first()).toBeVisible();

    await html5DragTo(page, '.pila-drag-handle', targetSel, true);

    await expect.poll(async () => {
      const idsAfter = await getBlockIds(page);
      return [idsAfter[calloutNth - 1], idsAfter[calloutNth]];
    }).toEqual([idsBefore[calloutNth], idsBefore[calloutNth - 1]]);
  });
});
