/**
 * Captures an animated GIF of the Pila demo page.
 * Usage: node scripts/capture-demo.mjs
 * Starts its own Vite dev server — no separate `npm run dev` needed.
 */

import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import gifencPkg from 'gifenc'
const { GIFEncoder, quantize, applyPalette } = gifencPkg
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT  = resolve(ROOT, 'assets/demo.gif')
const PORT = 5174

const W = 800
const H = 560

/** Spawn Vite and resolve once it prints its "Local:" URL */
function startVite() {
  return new Promise((res, rej) => {
    const vite = spawn(
      process.execPath,
      ['node_modules/.bin/vite', '--port', String(PORT)],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: false }
    )
    const onData = (chunk) => {
      if (chunk.toString().includes('Local:')) {
        vite.stdout.off('data', onData)
        res(vite)
      }
    }
    vite.stdout.on('data', onData)
    vite.stderr.on('data', () => {})
    vite.on('error', rej)
    setTimeout(() => rej(new Error('Vite start timeout')), 15000)
  })
}

async function shot(page) {
  const buf = await page.screenshot({ type: 'png' })
  const png = PNG.sync.read(buf)
  // Return Uint8ClampedArray of RGBA pixels
  return { data: new Uint8ClampedArray(png.data.buffer), width: png.width, height: png.height }
}

function frame(gif, { data, width, height }, delay) {
  const palette = quantize(data, 256, { format: 'rgba4444' })
  const index   = applyPalette(data, palette)
  gif.writeFrame(index, width, height, { palette, delay })
}

;(async () => {
  console.log('Starting Vite…')
  const vite = await startVite()
  console.log(`Vite ready on port ${PORT}`)

  const browser = await chromium.launch()
  const page    = await browser.newPage()
  await page.setViewportSize({ width: W, height: H })
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' })

  const gif = GIFEncoder()

  // --- frame 1: top of editor ---
  await page.waitForTimeout(600)
  frame(gif, await shot(page), 2400)

  // --- frame 2: scroll down to see code/quote/callouts ---
  await page.evaluate(() => window.scrollBy({ top: 480, behavior: 'instant' }))
  await page.waitForTimeout(200)
  frame(gif, await shot(page), 2000)

  // --- frame 3: scroll to table + columns ---
  await page.evaluate(() => window.scrollBy({ top: 480, behavior: 'instant' }))
  await page.waitForTimeout(200)
  frame(gif, await shot(page), 2000)

  // --- frame 4: scroll to buttons ---
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'instant' }))
  await page.waitForTimeout(200)
  frame(gif, await shot(page), 1800)

  // --- frame 5: click "Get JSON" and show output ---
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(200)
  await page.click('#btn-json')
  await page.waitForTimeout(300)
  // scroll a little to show the output panel
  await page.evaluate(() => window.scrollBy({ top: 320, behavior: 'instant' }))
  await page.waitForTimeout(200)
  frame(gif, await shot(page), 2800)

  // --- frame 6: scroll back to top (loop start) ---
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(200)
  frame(gif, await shot(page), 1200)

  gif.finish()

  mkdirSync(resolve(ROOT, 'assets'), { recursive: true })
  writeFileSync(OUT, gif.bytesView())
  console.log(`Saved → ${OUT}`)

  await browser.close()
  vite.kill()
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
