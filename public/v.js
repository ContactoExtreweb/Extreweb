/* v.js — contador de visitas de extreweb (sin cookies, sin terceros).
 *
 * En extreweb.es lo carga BaseLayout. En la web de un cliente se pega esto
 * antes de </body> (y su dominio se da de alta en el panel → Ajustes):
 *   <script defer src="https://extreweb.es/v.js"></script>
 *
 * Qué manda a /api/visita (netlify/functions/visita.mjs):
 *   1. Al abrir la página: ruta, web de origen, ancho de pantalla, campaña
 *      (utm_source / utm_campaign) y si es la página 404.
 *   2. Al salir: cuánto tardó en cargar en ESE dispositivo (velocidad real).
 * No guarda nada en el dispositivo (ni cookies ni localStorage).
 */
;(function () {
  try {
    var h = location.hostname
    // Nunca desde local ni desde previsualizaciones
    if (!h || h === 'localhost' || h === '127.0.0.1' || /\.local$|--.*\.netlify\.app$/.test(h)) return
    if (location.pathname.indexOf('/admin') === 0) return
    if (navigator.webdriver) return

    var yo = document.currentScript && document.currentScript.src
    var destino = (yo ? new URL(yo).origin : '') + '/api/visita'

    // text/plain: así el navegador lo manda también desde otros dominios sin
    // pedir permiso antes (con application/json haría una petición CORS previa)
    var manda = function (datos) {
      try {
        navigator.sendBeacon(destino, new Blob([JSON.stringify(datos)], { type: 'text/plain' }))
      } catch (e) {}
    }

    var q = new URLSearchParams(location.search)
    var es404 = !!document.querySelector('meta[name="ew-404"]')

    var contada = false
    var visita = function () {
      contada = true
      manda({
        t: 'v',
        ruta: location.pathname,
        ref: document.referrer || '',
        ancho: window.innerWidth,
        c: q.get('utm_campaign') || '',
        f: q.get('utm_source') || '',
        e404: es404,
      })
    }

    // Velocidad: LCP = cuándo se pinta lo más grande de la pantalla (lo que usa Google)
    var lcp = 0
    try {
      new PerformanceObserver(function (lista) {
        var e = lista.getEntries()
        if (e.length) lcp = Math.round(e[e.length - 1].startTime)
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    } catch (e) {}

    var velocidadEnviada = false
    var velocidad = function () {
      if (velocidadEnviada || !contada || es404) return
      var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null
      var carga = nav && nav.loadEventEnd > 0 ? Math.round(nav.loadEventEnd) : 0
      var ttfb = nav ? Math.round(nav.responseStart) : 0
      if (!lcp && !carga) return
      velocidadEnviada = true
      manda({ t: 'r', ruta: location.pathname, ancho: window.innerWidth, lcp: lcp, carga: carga, ttfb: ttfb })
    }
    addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') velocidad()
    })
    addEventListener('pagehide', velocidad)

    // Si el navegador la precargó en segundo plano, se cuenta al mirarla de verdad
    if (document.visibilityState === 'hidden') {
      var alVer = function () {
        if (document.visibilityState !== 'visible') return
        removeEventListener('visibilitychange', alVer)
        visita()
      }
      addEventListener('visibilitychange', alVer)
    } else visita()
  } catch (e) {}
})()
