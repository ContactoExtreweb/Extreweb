// scripts/capturas.mjs
// Capturas de las webs de los proyectos, en directo, con el Chrome instalado y sin ventana (sin dependencias).
// Escritorio 1440 px y móvil 390 px, unas dos pantallas de alto, sin avisos de cookies ni botones flotantes.
// Uso (desde la raíz del repo):  node scripts/capturas.mjs            → todas
//                                node scripts/capturas.mjs carmeet    → solo una
// Salida: public/proyectos/capturas/<id>-escritorio.webp y <id>-movil.webp (los usa Projects.astro)
// Si Chrome está en otra ruta: CHROME="ruta/a/chrome.exe" node scripts/capturas.mjs
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PROYECTOS } from '../src/lib/proyectos.js'

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const SALIDA = 'public/proyectos/capturas'
const SOLO = process.argv[2]
// La misma lista que la web (id y link); los que no tienen link aún no se pueden capturar
const WEBS = PROYECTOS.filter((p) => p.link).map((p) => ({ id: p.id, url: p.link }))
// alto = cuántas pantallas de alto se capturan (para que el 3D pueda desplazarse por la web)
const FORMATOS = {
  escritorio: { w: 1440, h: 900, dpr: 1.25, movil: false, alto: 2.2, ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' },
  movil: { w: 390, h: 844, dpr: 2, movil: true, alto: 2.1, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1' },
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function conectar(url) {
  const ws = new WebSocket(url)
  await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal })
  let n = 0
  const pendientes = new Map()
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.id && pendientes.has(d.id)) { pendientes.get(d.id)(d); pendientes.delete(d.id) }
  }
  const enviar = (method, params = {}) => new Promise((ok, mal) => {
    const id = ++n
    pendientes.set(id, (d) => d.error ? mal(new Error(`${method}: ${d.error.message}`)) : ok(d.result))
    ws.send(JSON.stringify({ id, method, params }))
  })
  return { enviar, cerrar: () => ws.close() }
}

// Se ejecuta dentro de la página: rechaza cookies, recorre la página y oculta botones flotantes de abajo
const PREPARAR = `(async () => {
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
  for (const b of document.querySelectorAll('button, a, [role=button]')) {
    const t = (b.textContent || '').trim().toLowerCase()
    if (/^(rechazar|rechazar todas|denegar|solo necesarias|solo las necesarias)$/.test(t)) { b.click(); break }
  }
  await esperar(600)
  const alto = innerHeight * ALTO
  for (let y = 0; y <= alto; y += innerHeight * 0.5) { scrollTo(0, y); await esperar(350) }
  scrollTo(0, 0)
  await esperar(1200)
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el)
    if (s.position !== 'fixed') continue
    const r = el.getBoundingClientRect()
    if (r.top > innerHeight * 0.45 || /cookie|consent|cmplz/i.test(el.className + ' ' + el.id)) el.style.setProperty('display', 'none', 'important')
  }
  return document.documentElement.scrollHeight
})()`

async function main() {
  mkdirSync(SALIDA, { recursive: true })
  const perfil = mkdtempSync(join(tmpdir(), 'capturas-'))
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${perfil}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' })
  try {
    let pagina
    for (let k = 0; k < 40 && !pagina; k++) {
      await espera(250)
      pagina = await fetch('http://127.0.0.1:9333/json/list').then((r) => r.json()).then((l) => l.find((t) => t.type === 'page')).catch(() => null)
    }
    if (!pagina) throw new Error('Chrome no ha arrancado')
    const c = await conectar(pagina.webSocketDebuggerUrl)
    await c.enviar('Page.enable')
    const lista = WEBS.filter((w) => !SOLO || w.id === SOLO)
    if (!lista.length) throw new Error(`No hay ninguna web con id "${SOLO}" y link en src/lib/proyectos.js`)
    for (const web of lista) {
      for (const [nombre, f] of Object.entries(FORMATOS)) {
        await c.enviar('Emulation.setUserAgentOverride', { userAgent: f.ua })
        await c.enviar('Emulation.setDeviceMetricsOverride', { width: f.w, height: f.h, deviceScaleFactor: f.dpr, mobile: f.movil })
        await c.enviar('Emulation.setTouchEmulationEnabled', f.movil ? { enabled: true, maxTouchPoints: 5 } : { enabled: false })
        await c.enviar('Page.navigate', { url: web.url })
        for (let k = 0; k < 60; k++) {
          await espera(250)
          const r = await c.enviar('Runtime.evaluate', { expression: 'document.readyState' })
          if (r.result.value === 'complete') break
        }
        await espera(2500)
        const r = await c.enviar('Runtime.evaluate', { expression: PREPARAR.replace('ALTO', f.alto), awaitPromise: true, returnByValue: true })
        const altoPagina = r.result.value || f.h
        const alto = Math.min(Math.round(f.h * f.alto), altoPagina)
        const shot = await c.enviar('Page.captureScreenshot', { format: 'webp', quality: 82, captureBeyondViewport: true, clip: { x: 0, y: 0, width: f.w, height: alto, scale: 1 } })
        const archivo = join(SALIDA, `${web.id}-${nombre}.webp`)
        writeFileSync(archivo, Buffer.from(shot.data, 'base64'))
        console.log(`${web.id} ${nombre}: ${Math.round(f.w * f.dpr)}x${Math.round(alto * f.dpr)} → ${archivo}`)
      }
    }
    c.cerrar()
  } finally {
    chrome.kill()
    await espera(500)
    try { rmSync(perfil, { recursive: true, force: true }) } catch {}
  }
}
main().catch((e) => { console.error(e.message); process.exitCode = 1 })
