import { expect, test } from '@playwright/test'
import {
  getEditorJson,
  hoverBlockAndGetHandle,
  html5DragTo,
  mainBlockNth,
  topLevelBlockIds,
  topLevelBlockTags,
  waitForEditor,
} from './helpers/editor'

async function indexOfTag(tags: string[], tag: string): Promise<number> {
  return tags.findIndex((value) => value === tag)
}

test.describe('Mixed block reorder and drag edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await waitForEditor(page)
  })

  test('reorders a paragraph around non-text blocks and keeps JSON order in sync', async ({ page }) => {
    const tags = await topLevelBlockTags(page)
    const paragraphIdx = await indexOfTag(tags, 'pila-paragraph')
    const imageIdx = await indexOfTag(tags, 'pila-image')
    expect(paragraphIdx).toBeGreaterThanOrEqual(0)
    expect(imageIdx).toBeGreaterThanOrEqual(0)

    const sourceNth = paragraphIdx + 1
    const targetNth = imageIdx + 1

    const idsBefore = await topLevelBlockIds(page)
    const movingId = idsBefore[paragraphIdx]

    const handle = await hoverBlockAndGetHandle(page, sourceNth)
    await html5DragTo(page, handle, mainBlockNth(targetNth), true)

    const idsAfter = await topLevelBlockIds(page)
    expect(idsAfter.indexOf(movingId)).toBeGreaterThan(idsAfter.indexOf(idsBefore[imageIdx]))

    const json = await getEditorJson(page)
    const jsonIds = json.map((b) => String((b as { id?: string }).id ?? ''))
    expect(jsonIds).toEqual(idsAfter)
  })

  test('drag first block to end and last block to start', async ({ page }) => {
    const initial = await topLevelBlockIds(page)
    expect(initial.length).toBeGreaterThan(4)

    const firstHandle = await hoverBlockAndGetHandle(page, 1)
    await html5DragTo(page, firstHandle, mainBlockNth(initial.length), true)

    const afterFirstMove = await topLevelBlockIds(page)
    expect(afterFirstMove[afterFirstMove.length - 1]).toBe(initial[0])

    const lastHandle = await hoverBlockAndGetHandle(page, afterFirstMove.length)
    await html5DragTo(page, lastHandle, mainBlockNth(1), false)

    const afterSecondMove = await topLevelBlockIds(page)
    expect(afterSecondMove[0]).toBe(initial[0])
  })

  test('dragging onto itself is a no-op and indicator semantics switch by drop half', async ({ page }) => {
    const before = await topLevelBlockIds(page)

    const handle = await hoverBlockAndGetHandle(page, 2)
    const upper = await html5DragTo(page, handle, mainBlockNth(2), false)
    expect(upper.visible).toBe(true)
    expect(upper.insertAfter).toBe('false')

    const lower = await html5DragTo(page, handle, mainBlockNth(2), true)
    expect(lower.visible).toBe(true)
    expect(lower.insertAfter).toBe('true')

    const after = await topLevelBlockIds(page)
    expect(after).toEqual(before)
  })
})
