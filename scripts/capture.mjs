// Review captures through the Chrome DevTools Protocol, so mobile widths below headless Chrome's ~500px window minimum work.
// Usage: node scripts/capture.mjs <outDir> <width>x<height> <name>=<path> [<name>=<path> ...]
// Needs the dev server on :5180 and Google Chrome installed. Add `full:` before a name for a full-page capture.
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [outDir, size, ...shots] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9300 + Math.floor(Math.random() * 500)
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cap-'))}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let target
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200)
  target = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).then((l) => l.find((t) => t.type === 'page')).catch(() => null)
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let seq = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) pending.get(m.id)(m.result), pending.delete(m.id)
})
const send = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: width < 640 })
for (const shot of shots) {
  const [name, path] = shot.split(/=(.*)/s)
  await send('Page.navigate', { url: `http://localhost:5180${path}` })
  // The dataset loads with a top-level await; wait for the app to paint real content.
  for (let i = 0; i < 40; i++) {
    await sleep(250)
    const r = await send('Runtime.evaluate', { expression: 'document.querySelector("main")?.innerText.length ?? 0', returnByValue: true })
    if (r?.result?.value > 20) break
  }
  // Wait for simulated loading to finish (skeletons gone), then scroll through so lazy images load, then wait for images.
  const settle = async (expr) => { for (let i = 0; i < 60; i++) { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); if (!r?.result?.value) return; await sleep(250) } }
  await settle('document.querySelectorAll(".skeleton,[aria-busy=true]").length')
  const fullShot = name.startsWith('full:')
  const h = (await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true })).result.value
  // Full-page: lay the page out at its full height first, so nothing re-renders during the capture.
  if (fullShot) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: Math.min(h, 6000), deviceScaleFactor: 2, mobile: width < 640 })
    await sleep(800)
  }
  for (let y = 0; y < (fullShot ? Math.min(h, 6000) : height * 2); y += Math.floor(height * 0.8)) {
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y})` })
    await sleep(350)
  }
  await settle('document.querySelectorAll(".skeleton,[aria-busy=true]").length')
  await settle(`[...document.images].filter((im) => !im.complete && (im.loading !== 'lazy' || im.getBoundingClientRect().top < ${fullShot ? 6000 : height * 2})).length`)
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' })
  if (process.env.DEBUG) console.log(name, (await send('Runtime.evaluate', { expression: 'JSON.stringify([document.querySelectorAll(".skeleton").length, document.querySelectorAll("[aria-busy=true]").length, [...document.images].filter(i=>!i.complete).length])', returnByValue: true })).result.value)
  await sleep(500)
  const file = fullShot ? name.slice(5) : name
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  if (fullShot) await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: width < 640 })
  writeFileSync(join(outDir, `${file}.png`), Buffer.from(data, 'base64'))
  console.log('captured', file)
}
ws.close()
chrome.kill()
