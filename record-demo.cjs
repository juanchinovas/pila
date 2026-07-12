const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: '/tmp', size: { width: 800, height: 900 } }
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  
  // Wait for editor to be ready - use the actual editor element ID
  await page.waitForSelector('#editor', { timeout: 15000 });
  await page.waitForTimeout(1000);
  
  // Click in the editor to focus
  await page.click('#editor');
  await page.waitForTimeout(300);
  
  // Scroll down to show different blocks
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.waitForTimeout(500);
  
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(500);
  
  await page.evaluate(() => window.scrollTo(0, 1300));
  await page.waitForTimeout(500);
  
  await page.evaluate(() => window.scrollTo(0, 1700));
  await page.waitForTimeout(500);
  
  await page.evaluate(() => window.scrollTo(0, 2100));
  await page.waitForTimeout(500);
  
  await page.evaluate(() => window.scrollTo(0, 2500));
  await page.waitForTimeout(500);
  
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  
  // Type slash menu
  await page.keyboard.type('/');
  await page.waitForTimeout(1500);
  
  // Close context to finalize video
  await context.close();
  await browser.close();
  
  // Find the recorded video
  const videos = fs.readdirSync('/tmp').filter(f => f.endsWith('.webm'));
  if (videos.length === 0) {
    console.error('No video recorded!');
    process.exit(1);
  }
  
  const videoPath = '/tmp/' + videos[0];
  console.log('Video recorded:', videoPath);
  
  // Convert to GIF using ffmpeg with higher quality
  try {
    execSync(`ffmpeg -y -i "${videoPath}" -vf "fps=15,scale=700:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" /tmp/pila-demo.gif`);
    fs.copyFileSync('/tmp/pila-demo.gif', '/Users/juanchinovas/LMD/pila/assets/demo.gif');
    console.log('Demo GIF saved to assets/demo.gif');
  } catch (e) {
    console.error('Failed to convert to GIF:', e.message);
    process.exit(1);
  }
})();