# CONTEXTO DEL PROYECTO — extreweb

> Documento de traspaso. Contiene todo el contexto acumulado del proyecto: quién soy,
> stack, decisiones tomadas, lo que YA funciona (y no hay que tocar), los errores
> cometidos y por qué, y lo que queda pendiente.
> **Léelo entero antes de proponer cambios.**
>
> Última actualización: **24/09/2026**.

---

## 1. Quién soy

- **Saúl Correyero Pañero**, desarrollador web **junior**.
- **Co-fundador de extreweb**, agencia web de **Extremadura** (futura base en **Villanueva de la Serena**;
  aún **sin oficina**).
- Socio: **Pedro Fernández Sánchez** (gestión, sistemas y redes). Yo llevo **desarrollo y diseño**.
- Formación: **DAW** en I.E.S. Ágora (Cáceres), finalizado junio 2026. Grado medio SMR.
- Portfolio personal: **sauldev.es**
- Idioma de trabajo: **español, informal (tuteo)**, directo y conciso.

### Cómo quiero que trabajes conmigo
- **Paso a paso.** Una pieza → la pruebo → siguiente. No vuelques todo de golpe.
- Cuando reemplaces un archivo, dilo claro: **"reemplaza ENTERO"** vs. edición puntual.
- Explícame el **porqué técnico breve** y dame **pasos de prueba concretos**.
- **Sé honesto.** Si algo no va a funcionar o es mala idea, dímelo. Si te estancas repitiendo
  la misma solución, para y pregunta.
- **Mobile-first** y **modo claro/oscuro** en todo lo que toques.
- A veces trabajo desde el **iPhone**: los bloques de código muy largos se cortan al pegar.
  Si algo deja de animar o sale en blanco, sospechar de eso primero.
- **Los commits y el push los hago yo.**

### Otros proyectos míos (contexto)
| Proyecto | Stack | Estado |
|---|---|---|
| **guadicar.es** — GuadiCar Multimarcas (concesionario, cliente José Juan) | Astro + Supabase + Netlify (adaptador, `/api/lead`, Resend) | En producción, mantenido |
| **carmeet.es** — CarMeet ESP (red social motor) | React + Vite + Supabase | TFG de DAW, en migración |
| **Físicas Élite** | Next.js + Supabase + Stripe + Bunny Stream | Traspasado a Pedro |
| **toldospallares.com** | WordPress + Elementor | Cliente |
| **Taller Guzmán** | Astro 6 + Tailwind | Cliente (aún en `project-r5m3o.vercel.app`) |

> Nota: **sí uso React y Tailwind** en otros proyectos (CarMeet, taller Guzmán), aunque en
> extreweb.es el sitio público va en Astro vanilla. Si la web lo menciona como servicio, es honesto.

---

## 2. El proyecto: extreweb.es

Web de la **agencia**. Es un híbrido: **negocio local** (confianza, contacto, geografía) +
**agencia** (se vende por portfolio y E-E-A-T).

- **Servicios:** diseño y desarrollo web, SEO, redes sociales, sistemas/soporte técnico.
- **Zona SEO:** Don Benito, Villanueva de la Serena, Cáceres, Miajadas + online.
- **Estética:** **estilo Apple** — limpio, mucho aire, tipografía protagonista, animación fluida,
  claro/oscuro. Simple, elegante, rápido.

### ⚠️ Rebranding pendiente
La empresa se ha **registrado fiscalmente con otro nombre**. Habrá que hacer un **rebranding de
nombre** (y probablemente de dominio). **De momento se mantiene "extreweb" y extreweb.es.**
Cuando llegue: el nombre está repartido por textos, títulos, schema (`src/lib/site.js`), logo del
Navbar/Footer, panel `/admin` y legales. Conviene centralizarlo antes (ver §14).

---

## 3. Stack técnico (versiones exactas)

- **Astro 6.4.8** (requiere Node ≥ 22.12)
- **GSAP 3.15** + ScrollTrigger · **Lenis 1.3.x** (smooth scroll)
- **Inter** vía `@fontsource-variable/inter` → `'Inter Variable'` (subset latino **precargado**
  en `BaseLayout`)
- `@astrojs/sitemap` (con `site:` configurado → genera `sitemap-index.xml`; **filtra `/admin`**)
- `@astrojs/react` + `react` + `react-dom` → **solo para el panel `/admin`**
- `@supabase/supabase-js` → panel `/admin` **y** funciones de Netlify
- Alias **`@/*` → `src/*`** (en `tsconfig.json`)
- CSS: un `global.css` con tokens + estilos **scoped** por componente Astro.
  **Sin Tailwind, sin Sass** en este proyecto.
- JS vanilla en los `<script>` de componentes, con `// @ts-nocheck`.
- Dependencias sin usar en `package.json`: `@fontsource-variable/space-grotesk` y
  `@fontsource/space-mono` (no se importan; inofensivas).

---

## 4. Infraestructura y despliegue

### Dominio y DNS (¡CUIDADO AQUÍ!)
- **extreweb.es** registrado en **DonDominio**.
- **El DNS lo gestiona DonDominio** (`ns1.dondominio.com`, `ns2.dondominio.com`).
  **La zona DNS de Netlify fue ELIMINADA** (era huérfana y rompía el SSL, ver §10).
- Registros clave en DonDominio:
  - `extreweb.es` **A** → `75.2.60.5` (Netlify) ✅
  - `www.extreweb.es` **CNAME** → `extreweb.netlify.app` ✅
  - **MX de Zoho** (`mx.zoho.eu`, `mx2.zoho.eu`, `mx3.zoho.eu`) + SPF + DKIM + verificaciones
    (Zoho, Google Search Console) → **NO TOCAR.**
  - CNAMEs residuales de DonDominio (`mail`, `imap`, `pop`, `smtp`, `webmail`, `ftp`, `bbdd`) —
    inofensivos.
- ⛔ **NUNCA debe existir un CNAME comodín `*.extreweb.es`** ni un `ANAME` al parking.
  Eso fue lo que rompió la renovación del certificado SSL (ver §10).

### Correo
- **Email público de la web: `contactoextreweb@gmail.com`** (decisión 18/09/2026: el Gmail lo
  tenemos más a mano; Zoho apenas se abre). Aparece en contacto, footer, menú móvil, legales y
  schema (`SITE.email`).
- `contacto@extreweb.es` (Zoho) sigue existiendo, pero ya no se muestra en la web.

### Hosting
- **GitHub → Netlify**, auto-deploy en cada `git push`.
- `netlify.toml`: `command = "npm run build"`, `publish = "dist"`, `NODE_VERSION = "22"`.
- `public/_redirects` → `/blog` y `/blog/*` → `/` (301). Se copia tal cual a `dist/`.
- `public/_headers` → caché de 1 año para `/_astro/*` (llevan hash) + cabeceras de seguridad
  (`nosniff`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`).
- Subdominio de pruebas: **extreweb.netlify.app** (útil para aislar problemas de dominio/SSL).
- Local: `npm run dev` → `localhost:4321`. `npx astro preview --port 4322` sirve el `dist/`.
- SSL: Let's Encrypt, dominios `extreweb.es, www.extreweb.es`, auto-renovación activa.

### Netlify Forms (formulario de contacto)
- Formulario `contacto` en `src/pages/contacto.astro`: `data-netlify`, honeypot `bot-field`,
  **reCAPTCHA de Netlify** (`data-netlify-recaptcha`), casilla RGPD `privacidad`.
- Se envía por `fetch` a `/` (sin salir de la página). Sin JS, POST normal + página de Netlify.
- **El reCAPTCHA solo aparece desplegado** (lo inyecta Netlify); en local no sale.
- **Aviso por email:** Netlify → Forms → *Submission notifications* → `contactoextreweb@gmail.com`.
- Cada envío verificado dispara `netlify/functions/submission-created.mjs`, que lo copia a la
  tabla `mensajes` de Supabase (ver §11). Si falla, el mensaje sigue en Netlify → Forms.

### Funciones de Netlify (`netlify/functions/`)
| Archivo | Qué hace |
|---|---|
| `submission-created.mjs` | Evento de Netlify Forms → inserta en `mensajes` (idempotente por `netlify_id`). No se puede llamar desde fuera (Netlify firma el evento). |
| `calendario.mjs` | `GET /calendario.ics?t=TOKEN` → reuniones en formato iCalendar para suscribirse desde el iPhone. Token en la tabla `ajustes`. |
| `visita.mjs` | `POST /api/visita` → analítica propia: una fila en `visitas` por página vista. Filtra bots, otros orígenes y `/admin`. **No guarda la IP.** |

### ⚠️ Gotcha crítico: variables de entorno
Las `PUBLIC_*` de Astro **se incrustan en el momento del build**. Si cambias una variable en
Netlify, **hay que redesplegar** (`Trigger deploy → Clear cache and deploy site`).

Variables en Netlify:
```
PUBLIC_SUPABASE_URL=https://ihmcqjuztvuxljsiukjo.supabase.co   (scope: All)
PUBLIC_SUPABASE_ANON_KEY=eyJ...                                (scope: All)
SUPABASE_SERVICE_KEY=...   (SECRETA · solo la usan las funciones · recomendado: scope solo Functions)
```
> La URL es **solo la base**, sin `/rest/v1/`. La `anon key` es pública por diseño;
> la seguridad la da la RLS. La `service key` **nunca** con prefijo `PUBLIC_` (se saltaría la RLS
> y acabaría en el navegador).

### Imágenes
En `public/proyectos/`, referenciadas **sin** `/public/` (ej. `/proyectos/Guadicar.webp`).
**OJO con mayúsculas** — Netlify/Linux distingue, Windows no: `Guadicar.webp`, `Car-MeetESP.webp`,
`Fichar.webp`, `Guzman.webp`, `Toldos-Pallares.webp`. Todas ~1905×952; los `<img>` llevan
`width`/`height` para evitar saltos de maquetación.
Cada una tiene versiones **`-800.webp`** (~20 KB) y **`-1200.webp`** (~35 KB), generadas con `sharp`,
que la portada usa con `srcset` (Showcase y Projects): el móvil ya no baja la de ~85 KB.
**Si se cambia o se añade una captura, generar también sus dos versiones.**

---

## 5. Sistema de diseño (`src/styles/global.css`)

### Tokens
```css
/* Claro */
--bg:#ffffff  --surface:#f5f5f7  --fg:#1d1d1f  --muted:#6e6e73
--accent:#0071e3  --accent-hover:#0077ed  --accent-fg:#ffffff  --border:#d2d2d7

/* Oscuro — html[data-theme="dark"] */
--bg:#000000  --surface:#1d1d1f  --fg:#f5f5f7  --muted:#a1a1a6
--accent:#2997ff  --accent-hover:#2b9bff  --border:#2a2a2c

--font: 'Inter Variable', system-ui, -apple-system, sans-serif;
--font-mono: ui-monospace, 'SF Mono', 'Fira Code', monospace;

/* Easings fuertes (las de CSS por defecto son flojas) */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out:    cubic-bezier(0.65, 0, 0.35, 1);

--dur-fast:140ms  --dur-mid:240ms  --dur-slow:440ms
--radius:14px  --radius-lg:22px  --radius-pill:980px  --border-w:1px
--maxw:1200px  --pad: clamp(1.25rem, 5vw, 2rem)
```

### Reglas de estilo
- Botones `.btn`: pastilla, `:active { transform: scale(0.97) }` (feedback táctil).
  El hover de `.btn` usa `color-mix` con `--fg` (antes era `#e8e8ed` fijo y rompía el oscuro).
- **Hover SOLO** dentro de `@media (hover: hover) and (pointer: fine)` — en táctil no se dispara.
- **Grises de texto: siempre `var(--muted)`.** Se eliminó el `#86868b` fijo (no llegaba al
  contraste mínimo sobre blanco).
- Utilidad `.mono` (usa `--font-mono`).
- Modo oscuro: toggle sol/luna en `Navbar.astro` (pone `data-theme` en `<html>` + `localStorage`)
  + script `is:inline` anti-FOUC en el `<head>` de `BaseLayout.astro`.

---

## 6. Sistema de animación (revisado el 22/09/2026 para que vaya fluido)

### `src/lib/motion.js`
Exporta: `gsap`, `ScrollTrigger`, `reduceMotion`, `finePointer`, `spring(…)` (sin uso ahora).
Al importarse arranca (`boot()`, marca `data-motion-ready` en `<html>`):
1. `initLenis()` — smooth scroll **solo escritorio con ratón**; móvil usa el scroll nativo.
2. `initReveals()` — pone `.is-in` a `.fx-up` / `.fx-row` cuando entran en pantalla
   (IntersectionObserver). La animación en sí es CSS.
3. `initPausaFuera()` — pone `.is-fuera` a los bloques con `data-anim-pausa` cuando no se ven:
   sus animaciones infinitas (marquee, brillos, pulsos) se pausan.
4. `initAutoRefresh()` — si cambia la altura de la página (FAQ abierta, pestaña del configurador,
   fuente cargada…), `ScrollTrigger.refresh()`. Sin esto las secciones fijadas se descuadraban.

### Clases de animación (`global.css`) — CSS puro, van en la GPU
| Clase | Cuándo entra | Uso |
|---|---|---|
| `.fx-in` | al cargar, sin esperar al JS | titular de la cabecera (sube 40 px) |
| `.fx-in-soft` | al cargar | resto de la cabecera (sube 20 px) |
| `.fx-up` | al llegar con el scroll | tarjetas y bloques (40 px) |
| `.fx-row` | al llegar con el scroll | filas de lista (60 px) |

- **Cascada automática** entre hermanos `.fx-in`/`.fx-in-soft` (0,1 · 0,25 · 0,4 · 0,55 s).
  Retraso a mano: `style="--fx-delay: 120ms"`.
- Animan **`translate` y `opacity`, nunca `transform`**: así no pisan los `:hover` de las
  tarjetas. Antes, GSAP dejaba un `transform` en línea y el hover dejaba de moverse (Process, Areas).
- Antes eran `.gsap-reveal/.gsap-fade/.gsap-up/.gsap-row` animadas con `gsap.from()`: el titular
  se pintaba, desaparecía al cargar GSAP y volvía a entrar (el "parpadeo" de las páginas interiores).

### GSAP se queda solo para lo que va pegado al scroll
Showcase (capas), Services (baraja, **solo ≥901 px**), Projects (solo como respaldo, ver abajo),
Trust (contadores), Nosotros (contadores), Proceso (línea con `scaleY`),
Proyectos (baraja fijada) y las pestañas de Servicios. Usar `gsap.matchMedia()` para los
efectos que dependen del ancho (se activan/desactivan solos al cambiar la ventana).

### 🔑 Invariantes
- **El contenido nunca depende del JS.** `.fx-in` es CSS y siempre termina. `.fx-up` solo se
  oculta con `html.js-motion`, y el script del `<head>` quita esa clase si `motion.js` no arranca
  en 2,5 s. Con "reducir movimiento" no hay `js-motion`: todo visible y quieto.
- `Showcase.astro` oculta los pasos no activos también **solo con `html.js-motion`**
  (`:global(html:not(.js-motion))` = lista normal). Mismo patrón para cualquier sección nueva.

### ⚡ Reglas de rendimiento (lo que hacía que fuera a tirones)
- **Nada de `backdrop-filter` sobre fondo liso ni en elementos grandes o animados.** Se recalcula
  cada frame. Se quitó de: tarjetas de Services (4 de 70vh con escala por scroll), marquee del
  Hero, Process, Cta, tarjeta de cristal, texto de Proyectos. Queda en la navbar y el menú (pequeños).
- **Nada de `filter: blur()` para halos.** Un `radial-gradient` ya es suave. Los "ambient-glow" de
  las páginas interiores usan `mask-image: radial-gradient(…)` + `scale: 1.7` (mismo halo).
  ⚠️ El degradado tiene que llegar a transparente dentro de su caja: `radial-gradient(closest-side, color, transparent)`.
  Con `circle … transparent 70%` se veía el contorno del círculo (antes lo tapaba el blur).
- **No animar `box-shadow`, `height`, `width`, `top`…** Pulsos = anillo `::after` con
  `transform` + `opacity`; barras = `scaleY`.
- **No mezclar `transition: transform` en CSS con GSAP animando el mismo elemento.**
- `will-change` solo donde de verdad se anima (y por media query si solo es en escritorio).
- Imágenes de un scroll horizontal: se pasan a `loading="eager"` al acercarse (Projects).

## 7. Principios de diseño que rigen el proyecto

Vienen de skills de expertos (Emil Kowalski, "impeccable"/Paul Bakaus, frontend-design de Anthropic):

1. **Nada de "fade-up uniforme en cada sección"** — es EL tell de que lo ha hecho una IA.
2. **El "wow" debe funcionar en MÓVIL** (scroll/táctil), nunca escondido tras el cursor.
   Google indexa solo la versión móvil desde julio 2024.
3. **Easing fuerte** + springs con inercia para lo que sigue al puntero.
4. **"Las cards son la respuesta vaga"** → evitar rejillas de tarjetas genéricas.
5. **Gastar el descaro en UN solo sitio** (una firma); el resto, callado.
6. **Nunca condicionar visibilidad a JS.**
7. Botones con feedback al pulsar, hover gateado a `pointer:fine`, zonas táctiles ~48px.
8. **Mobile-first siempre.**
9. **Nada importante solo en hover** (lección: las tarjetas de proyecto de la home no se podían
   abrir en móvil porque el botón solo salía con hover; ahora toda la tarjeta es el enlace).

---

## 8. Estructura del sitio público

```
src/
├── styles/global.css              tokens + reset + modo oscuro + utilidades
├── lib/
│   ├── motion.js                  motor de animación
│   └── site.js                    datos NAP + constantes SEO (+ instagram, locality)
├── layouts/BaseLayout.astro       <head> SEO + Schema + anti-FOUC + preload fuente + motion.js
├── components/
│   ├── Navbar.astro               toggle de tema, menú móvil, sección activa normalizada
│   ├── Hero.astro                 ⭐ CSS PURO, sin JS (ver §9) + marquee
│   ├── Showcase.astro             "Anatomía de una web que vende" (420vh; 360vh en móvil): la web
│   │                              REAL de GuadiCar se abre en 3 capas (diseño · Google · velocidad)
│   │                              y se vuelve a montar al final. Datos de Google = los reales.
│   ├── Configurador.astro         "¿Cómo quedaría la web de tu negocio?": el visitante monta una
│   │                              web (sector, nombre, foto, color, estilo, extras) y la maqueta
│   │                              FUNCIONA (reservar/comprar, WhatsApp) → "Quiero una web así"
│   ├── Services.astro             tarjetas apiladas con sticky (se encogen solo en escritorio)
│   ├── Projects.astro             scroll horizontal al bajar (móvil y escritorio) · cada
│   │                              tarjeta es un <a> al proyecto
│   ├── Trust.astro                stats con contadores
│   ├── Process.astro
│   ├── Areas.astro                zonas → enlaza a las 3 landings locales
│   ├── Faq.astro                  array `faqs` + JSON-LD FAQPage
│   ├── LocalLanding.astro         plantilla de las páginas por ciudad (diseño común, TEXTO por props)
│   ├── Cta.astro
│   ├── Footer.astro               solo Instagram en redes (SITE.instagram)
│   └── seo/
│       ├── Schema.astro           JSON-LD @graph sitewide
│       └── ServiceSchema.astro    Service + BreadcrumbList (URLs con barra final)
└── pages/
    ├── index.astro
    ├── admin.astro                ⭐ panel interno (ver §11)
    ├── servicios/{index, diseno-web, seo, redes-sociales, sistemas-soporte}.astro
    ├── proyectos/index.astro      array `projects` → enlaces EXTERNOS a las webs en vivo
    ├── nosotros.astro             bios reales de los dos socios
    ├── proceso.astro · contacto.astro
    ├── diseno-web-don-benito.astro            ┐ solo contenido; usan LocalLanding.astro
    ├── diseno-web-villanueva-de-la-serena.astro │ (~700 palabras únicas cada una,
    ├── diseno-web-caceres.astro                ┘ proyectos reales de la zona, FAQs locales)
    └── aviso-legal.astro · privacidad.astro · cookies.astro
netlify/functions/                 submission-created.mjs · calendario.mjs (ver §4)
supabase/                          SQL de las tablas nuevas (ya ejecutadas en producción)
public/_redirects · public/_headers
```

**Orden de la home (`index.astro`):**
`Navbar → Hero → Showcase → Configurador → Services → Projects → Trust → Process → Areas → Faq → Cta → Footer`

**Showcase (`Showcase.astro`) — cómo funciona:**
- Un proxy `{ p }` animado con ScrollTrigger (`scrub: 0.8`) suaviza el scroll; `pintar(p)` calcula
  `--t` (inclinación) y `--s` (separación) con curvas suaves y cambia de paso en 0 / .2 / .42 / .62 / .8.
- La capa activa se ilumina (azul diseño, verde Google, violeta velocidad) y las de encima se
  apartan con `@property --an-up1/--an-up2` (se animan solas sin frenar el scroll).
- La capa de Google usa el título, la descripción y el schema (`AutoDealer`) **reales** de
  guadicar.es. Si GuadiCar los cambia, actualizarlos aquí. Nada de métricas ni reseñas inventadas.
- **Rendimiento (22/09):** las capas llevan `will-change: transform` (se pintan una vez y luego solo
  se recolocan). El brillo de la capa activa es un `::after` con la sombra ya pintada que solo
  cambia de opacidad. Las etiquetas aparecen con la clase `.is-abierta`. El script solo escribe
  `--t`/`--s` si cambian. En móvil, el texto cambia sin `filter: blur`.

**Projects (`Projects.astro`) — cómo funciona:**
- `.projects-pin` mide `100svh + --recorrido` (lo que sobra del carril; lo mide el script y lo
  vuelve a medir si cambia la ventana). Dentro, `.projects-wrapper` es **sticky**: la fija el
  navegador, sin los saltos del "pin" de GSAP al entrar y salir (el motivo de los tirones en móvil).
- El carril lo mueve **CSS con `animation-timeline`** (Chrome, Edge, Safari 26+; va en la GPU,
  sin JS por frame). Donde no existe (Firefox, Safari antiguo), lo mueve **GSAP** con el mismo
  inicio y final.
- `.projects` usa `overflow: clip` (con `hidden` el sticky de dentro no funciona).
- Sin JS o con "reducir movimiento": carrusel nativo que se desliza con el dedo.

**Configurador (`Configurador.astro`) — cómo funciona:**
- **El nombre del negocio es el titular** de la web simulada (el eslogan va debajo); la primera vez
  que se ve la sección se "escribe" solo, y al escribir en el campo se resalta en la maqueta.
- Editor: 1 Negocio (taller/restaurante/tienda/peluquería) · 2 Nombre y foto · 3 Color y estilo
  (Moderno / Clásico serif cálido / Atrevido oscuro en mayúsculas) · 4 Extras (galería, opiniones,
  mapa, WhatsApp) · 🎲 Sorpréndeme.
  - **Escritorio (≥1000 px):** título a todo el ancho; debajo, un panel con cada paso en una fila
    (etiqueta | opciones) y la maqueta *sticky* a la derecha en una columna de 340 px. El panel es
    un *container*: si mide menos de 600 px por dentro (p. ej. con "Ordenador", que pasa a 50/50),
    las etiquetas van encima y los grupos de 4 opciones en cuadrícula 2×2.
  - **Móvil (<1000 px, con JS):** teléfono arriba y pestañas debajo, como un editor de fotos.
  - ⚠️ El bloque CSS de escritorio va **al final** del `<style>`: tiene la misma especificidad que
    las reglas base y, si va antes, estas lo pisan (pasó y no se veían ni las filas ni los separadores).
- La maqueta **funciona**: «Pedir cita / Reservar mesa / Comprar» abre una hoja con opciones y
  confirmación; la burbuja de WhatsApp abre un chat con pregunta y respuesta. Al confirmar salta
  fuera del móvil la notificación "Así te avisa tu web" (lo que le llegaría al dueño).
- Todo el contenido por sector (textos, lista, opiniones, chat y flujo) está en el array `tipos`
  del frontmatter. Las opiniones/precios del mock son de un negocio ficticio de ejemplo.
- La foto se usa con `URL.createObjectURL`: **no sale del dispositivo**.
- Sin GSAP. `@property --brand` anima el color en toda la sección. Estilos en `<style is:global>`
  con prefijo `#configurador` (casi todo el mock lo crea el JS y el CSS scoped no le llegaría).
- ⚠️ La sección usa `overflow: clip`, **no** `hidden`: `hidden` rompe el `position: sticky`.
- La maqueta es una *container query* (`@container (min-width: 420px)` = versión ordenador);
  tamaños en `cqi` para que escale con la pantalla del mock. `data-lenis-prevent` en el scroll
  interno para que Lenis no se lo coma en escritorio.
- "Quiero una web así" guarda en `sessionStorage` (`ew-configurador`) sector, nombre, color,
  estilo y extras; `contacto.astro` escribe el mensaje una sola vez. Nada va en la URL.

**Enlaces internos: SIEMPRE con barra final** (`/servicios/`, no `/servicios`). Netlify sirve las
páginas con barra y sin ella hace una redirección 301 extra en cada clic.

**Borrado a propósito** (no recrear):
- **El blog entero** (18/09/2026): páginas, colección de contenido y artículo de ejemplo. Motivo:
  sin lectores no compensa, y tener un blog con un artículo que daba 404 era peor que no tenerlo.
  `/blog` redirige a la home.
- `proyectos/[slug].astro` → las tarjetas de proyecto enlazan a las **webs reales en vivo** con
  `target="_blank"`, no a fichas internas. Es lo correcto para una agencia.
- `Stats.astro` (estaba vacío).
- `Playground.astro` (18/09/2026): sustituido por `Configurador.astro`. Era la "web dentro de un
  navegador" con cursores, vista SEO y reseñas/métricas **inventadas**. Recuperable en git.

---

## 9. La saga del Hero (CONTEXTO CRÍTICO — no repitas estos errores)

Se dedicaron **muchísimas** iteraciones. Ideas **descartadas definitivamente**:

1. ❌ **"Navegador con una mini-web maquetada dentro"** (web dentro de web). Se intentó una y otra
   vez; siempre salía pequeña, pobre y poco estética. **Rechazada.**
2. ❌ **Simulación de landing de concesionario** dentro del navegador, con la captura de GuadiCar
   encima → quedaba una web dentro de una web dentro de una web. Horrible.
3. ❌ **Tipografía kinética con palabra rotativa** (reales / a medida / que venden / rápidas) →
   bug: todas las palabras apiladas y superpuestas, o el titular desaparecido.
4. ❌ **"Patio de juegos" interactivo** en el hero → *"una portada convence, no entretiene"*;
   además eliminaba los CTAs. Estuvo como `Playground.astro` más abajo en la home; el 18/09/2026
   se sustituyó por el **Configurador** (ver §8), que sí tiene un objetivo: acabar en contacto.

### ✅ HERO ACTUAL (aprobado — "simple pero funcional")
- **Estilo Apple**, **100% CSS, SIN JavaScript** (por eso es imposible que se rompa).
- `h1`: **"Vendemos soluciones reales."** — "reales" con
  `linear-gradient(120deg, var(--accent), #7c5cff)` + `background-clip: text`.
- Kicker eyebrow: "Diseño y desarrollo web · Extremadura".
- Sub: "A medida, rápidas y pensadas para vender. Sin plantillas, sin atajos."
- 2 CTAs: **Empezar proyecto** (/contacto/) y **Ver proyectos** (/proyectos/).
- Chevron de scroll animado abajo + marquee infinito de especialidades.
- `min-height: 100svh`, `@keyframes heroIn` con delays escalonados, `prefers-reduced-motion`
  respetado. Funciona perfecto en claro y oscuro.

> ⚠️ **No propongas volver a meter el navegador/mini-web en el hero.** Si hay que mejorarlo,
> que sea sobre esta base tipográfica.

---

## 10. Incidencia de SSL (resuelta el 15/09/2026) — documentada para que no se repita

**Síntoma:** `extreweb.es` caído con `NET::ERR_CERT_COMMON_NAME_INVALID`. Correos de Netlify:
*"Failed attempt to renew your TLS certificate"* con
`Unable to verify challenge for *.extreweb.es: No TXT record found at _acme-challenge.extreweb.es`.

**Causa (doble):**
1. En DonDominio existían `extreweb.es` **ANAME** → parking y `*.extreweb.es` **CNAME** → parking
   ← **el asesino**: el comodín capturaba `_acme-challenge.extreweb.es`.
2. En Netlify había una **zona DNS huérfana** → Netlify pedía un certificado **wildcard** imposible.

**Solución:** borrar el `ANAME` y el `CNAME *` en DonDominio, borrar la zona DNS de Netlify,
esperar propagación y **Renew certificate**. Resultado: `extreweb.es, www.extreweb.es` (sin wildcard).

**Lecciones:** nunca un comodín en la zona DNS; si el certificado falla, mirar primero el DNS;
el HSTS cachea el error (probar en incógnito o `chrome://net-internals/#hsts`).

---

## 11. Panel de administración (`/admin`)

Herramienta interna tipo mini-CRM para los dos socios. **En producción y funcionando.**

### Arquitectura
Vive **dentro del mismo proyecto Astro**, como una **isla de React** (`client:only="react"`)
en `src/pages/admin.astro`. **El sitio público sigue siendo 100% estático** — no se activó SSR
(lo dinámico va en funciones de Netlify, ver §4).
La seguridad la da **Supabase Auth + RLS**, no el hecho de ocultar la página.
`noindex, nofollow`, `Disallow: /admin` en `robots.txt` y **fuera del sitemap**.

### Supabase
- Proyecto: `https://ihmcqjuztvuxljsiukjo.supabase.co`
- **Auth:** una **única cuenta compartida** para los dos socios. **Registro público desactivado.**
- **RLS activada en todas las tablas**, con política `"auth all" for all to authenticated
  using (true) with check (true)`. El rol `anon` no ve nada. Las funciones de Netlify usan la
  service key (se salta la RLS).
- Cliente en `src/lib/adminClient.js` (`persistSession: true`, `autoRefreshToken: true`).

**Esquema:**
```
clientes       id, nombre, empresa, email, telefono, notas, created_at
proyectos      id, cliente_id→clientes, titulo, descripcion, estado('activo'|'pausado'|'terminado'), created_at
notas          id, proyecto_id→proyectos, contenido, created_at
reuniones      id, proyecto_id→proyectos(null), cliente_id→clientes(null), titulo, descripcion,
               fecha (inicio), fecha_fin, created_at
presupuestos   id, proyecto_id→proyectos, titulo, created_at
partidas       id, presupuesto_id→presupuestos, concepto, importe numeric(10,2),
               pagado bool, fecha_pago date, created_at
mensajes       id, netlify_id (unique), nombre, email, servicio, mensaje, leido bool, created_at
notas_rapidas  id, texto, hecha bool, created_at
ajustes        clave (pk), valor, updated_at        ← 'calendario_token'
visitas        id, creado, ruta, referente, pais, ciudad, movil bool, visitante (huella del día)
```
Las cuatro últimas: SQL en `supabase/*.sql`. Todas con la misma RLS.

> El dinero funciona así: proyecto → presupuesto(s) → **partidas**. Cada partida se marca
> pagada/pendiente. Total, cobrado y pendiente se **calculan sumando partidas**, no se guardan.

### Archivos
```
src/pages/admin.astro               shell mínimo, noindex, script de tema
src/styles/admin.css                todos los estilos del panel
src/lib/adminClient.js              cliente de Supabase
src/components/admin/
  ├── AdminApp.jsx                  raíz: sesión, HEADER, routing por estado, contador de no leídos
  ├── Login.jsx                     email + contraseña
  ├── Inicio.jsx                    hero + resumen + stats + mensajes + reuniones + notas + cobros
  ├── Mensajes.jsx                  mensajes del formulario (leer, responder, crear cliente, borrar)
  ├── NotasRapidas.jsx              post-its del Inicio
  ├── Clientes.jsx                  listado + alta (prop `nuevo` abre el formulario)
  ├── ClienteDetalle.jsx            ficha, edición, borrado + sus proyectos
  ├── ProyectoDetalle.jsx           presupuestos/partidas + notas + reuniones del proyecto
  ├── Calendario.jsx                rejilla mensual + lista + modal (prop `nueva` abre el modal)
  ├── Calculadora.jsx               calculadora de IVA/IRPF (no toca Supabase; localStorage)
  ├── Visitas.jsx                   analítica propia: resumen, barras por día y rankings
  ├── CalendarioSync.jsx            ventana "iPhone": enlace webcal + regenerar token
  └── helpers.js                    euro(), fechaCorta(), fechaHora(), soloHora(), rangoReunion(),
                                    paraInputDatetime(), cuandoReunion() ("Hoy · 17:00"), hace()
```

### Layout — HEADER superior
La **primera versión tenía barra lateral y se descartó**. Header horizontal sticky:
logo (la "E" en squircle) + "extreweb" + badge "panel" · nav (**Inicio · Mensajes · Clientes ·
Calendario · Calculadora · Visitas**, con contador de no leídos) · tema + cerrar sesión + hamburguesa (≤720px, con
puntito azul si hay mensajes sin leer).

### Pantallas
- **Inicio:** saludo según la hora, resumen en una frase (mensajes sin leer, proyectos activos,
  por cobrar), botones de acción (Ver mensajes / Nuevo cliente / Nueva reunión / Calculadora IVA
  — abren directamente el formulario o la pantalla). Franja de stats. Rejilla: **Mensajes** (3 últimos) · **Próximas reuniones**
  ("Hoy"/"Mañana") · **Notas rápidas** · **Cobros pendientes**.
- **Mensajes:** lista (no leídos en negrita, filtro Todos/Sin leer). Al abrir uno se marca leído.
  Acciones: Responder (mailto), Crear cliente (con el mensaje en notas), Marcar no leído, Eliminar.
- **Clientes / ClienteDetalle:** CRUD de clientes y sus proyectos.
- **ProyectoDetalle:** resumen económico con barra de progreso, presupuestos con partidas tipo
  checkbox, notas, reuniones con inicio+fin.
- **Calendario:** rejilla mensual (lunes→domingo, 42 celdas), Mes/Lista (en móvil arranca en
  Lista; en móvil la fecha va bajo el título), modal crear/editar. Botón **iPhone** →
  suscripción `webcal://extreweb.es/calendario.ics?t=…` (solo lectura, aviso 30 min antes,
  el iPhone refresca cada ~1 h). **Importar desde iCloud se descartó.**
- **Calculadora (23/09):** varias líneas (concepto opcional + importe) para añadir o quitar el IVA.
  **Cada línea guarda su propio +IVA / −IVA**, así se mezclan ventas y compras sin que unas cambien
  a las otras. El interruptor de arriba solo decide el modo de las líneas NUEVAS (y el de las que
  aún están vacías). Tipos 21/10/4/0 % y uno a mano; casilla opcional de retención de IRPF (15/7 %), que se
  resta de la base en el total. Acepta "1.234,56" y "1234.56". Intro salta a la línea siguiente.
  "Copiar resumen" lo deja en el portapapeles en texto.
  - **Totales:** un bloque si todas las líneas son del mismo tipo; si se mezclan, dos bloques
    (Ventas · IVA añadido / Compras · IVA ya incluido) y la diferencia de IVA (repercutido −
    soportado), con el aviso de que es orientativo y no el modelo 303.
  - **No usa Supabase:** los ajustes y las líneas se guardan en `localStorage` (`ew-calc-iva`),
    así que son de ese navegador y no se comparten entre Pedro y tú.
  - Cada línea se redondea a céntimos y luego se suman, para que el total cuadre con lo que se ve.
  - Las funciones `aNumero()` y `calcular()` se exportan por si algún día el presupuesto
    (partidas) necesita los mismos cálculos.
- **Visitas (24/09):** analítica propia, sin cookies ni terceros. Periodo de 7 / 30 / 90 días;
  páginas vistas, visitantes, media al día y % de móvil; barras por día (una sola serie, en el
  azul del panel, con el número solo en el día más alto) y rankings de páginas, origen y ciudad.
  - **Cómo entran los datos:** `BaseLayout.astro` lleva un script mínimo que, **solo en
    extreweb.es**, manda con `navigator.sendBeacon` la ruta, el dominio de origen y el ancho de
    pantalla a `/api/visita` (`netlify/functions/visita.mjs`), que escribe en `visitas` con la
    service key. En local y en las previsualizaciones no cuenta nada.
  - **Privacidad (es lo que permite no poner banner):** no se guarda la IP; `visitante` es
    SHA-256(sal del día + IP + navegador) y la sal cambia cada día, así que no se puede seguir a
    nadie. No se escribe nada en el dispositivo. Del referente solo el dominio. Está explicado en
    la política de cookies (punto 3) y en la de privacidad.
  - **Variables en Netlify:** usa las que ya hay; `ANALITICA_SAL` es opcional (si no está, la sal
    sale de la service key).
  - Las cifras son algo más altas que en Google Analytics: al salir de nuestro dominio, los
    bloqueadores no la capan. Para las búsquedas de Google sigue haciendo falta Search Console.
  - Limpieza: borrar lo de más de 12 meses (sentencia comentada al final de `supabase/visitas.sql`).

---

## 12. SEO — lo que ya está hecho

- **`src/lib/site.js`** → objeto `SITE`: name, url, description, email (Gmail), telephone
  (`+34628775619`), `instagram`, **`sameAs: [instagram]`** (solo perfiles externos, nunca la
  propia web), `locality: 'Villanueva de la Serena'`, region, country, `areaServed`, `founders`,
  `ogImage: '/og-portada.jpg'` (existe, 1200×630).
- **`seo/Schema.astro`** → JSON-LD `@graph` con **Organization + ProfessionalService + WebSite**,
  sitewide. La dirección lleva `addressLocality`.
- **`seo/ServiceSchema.astro`** → **Service + BreadcrumbList** en las 4 páginas de servicio.
- **`Faq.astro`** → JSON-LD **FAQPage**.
- **`BaseLayout.astro`** → title, description, canonical, Open Graph, `twitter:card`,
  `theme-color` claro/oscuro, `robots: index, follow`.
- Cada página tiene **título y descripción propios** (las legales repetían la de la home; arreglado).
- **Una sola `<h1>` por página.**
- **`public/robots.txt`** → permite buscadores **y los bots de IA**, `Disallow: /admin`,
  `Sitemap: https://extreweb.es/sitemap-index.xml`.
- **Sitemap** sin `/admin` ni `/blog`.
- **Páginas por ciudad** (18/09/2026): ~700 palabras únicas, proyectos reales de la zona
  (Villanueva: GuadiCar y Toldos Pallares · Cáceres: Taller M. Guzmán · Don Benito: los de
  Villanueva, "a 6 km"), FAQs locales, migas de pan visibles + `Service` (areaServed = la ciudad)
  + `BreadcrumbList`. **Regla: no inventar clientes ni datos locales.**
- Schema global con `hasOfferCatalog` (4 servicios), `foundingDate: 2022`, `knowsAbout`,
  fundadores (Saúl → `sauldev.es`) y `areaServed` con ciudades (`City`) + Extremadura (`State`).
- Título de la home con la palabra clave delante: "Diseño y desarrollo web en Extremadura — extreweb".
- **Google Search Console:** propiedad verificada, sitemap enviado.

### Realidad sobre "que me recomienden las IAs"
Depende sobre todo de la **reputación FUERA de la web**: Google Business Profile, reseñas,
menciones. Es trabajo de meses, no de código. Lo técnico ya está hecho.

---

## 13. Marca

Símbolo: una **"E" formada por barras redondeadas apiladas** dentro de un **squircle** con
gradiente **`#0071e3 → #7c5cff`**. Está en `public/favicon.svg` y **inline** en el panel.

- ⚠️ **Inconsistencia:** el Navbar usa una "E" en cuadrado azul plano y el **Footer usa un rayo**
  con "Extreweb" en mayúscula. Se deja así hasta el rebranding (§2).
- `public/og-portada.jpg` (1200×630) ✅ · `logo-extreweb-horizontal(-dark).png` para usos externos.
- En la web, el wordmark "extreweb" es **texto Inter en vivo**, no imagen.

---

## 14. PENDIENTE

### Bloqueado por datos
1. **Aviso legal:** falta **razón social + NIF** (y datos registrales si es S.L.) de la empresa
   tal como se registró fiscalmente. **Lo exige la LSSI.** Los tiene que pasar Pedro.
2. **Rebranding** (§2): cuando se decida el nombre. Antes conviene **centralizar la marca**:
   un `Logo.astro` único para Navbar y Footer + usar `SITE.name` en títulos y textos.

### Contenido (decisión nuestra, no de código)
3. **Afirmaciones difíciles de sostener** — conviene suavizarlas (credibilidad + publicidad engañosa):
   - `Services.astro`: "+142% Conversión", "monitorización 24/7", "seguridad absoluta".
   - `Process.astro` / `servicios/diseno-web`: "rendimiento (100/100) garantizado".
   - `servicios/index`: "matemáticamente inmune a hackeos masivos", "<0.8s", "24/7".
   - `Faq.astro`: "100/100", "24/7".
   - `Trust.astro`: "+5 años de experiencia" (¿real?) y "4 proyectos en producción" (la home
     enseña 5).
4. **Jerga que el cliente local no entiende:** "Headless", "WPO", "UI/UX", "Edge" en el marquee
   del hero y en servicios. Mejor beneficios en cristiano.
5. **Páginas de servicio muy finas** (~150 palabras). Las de ciudad ya están hechas (18/09).
   Siguiente pieza SEO: servicios → páginas por sector (concesionarios, talleres, instalación)
   → guía de precios ("¿cuánto cuesta una web?").
6. **`/servicios`**: las imágenes al pasar el ratón son **fotos de stock de Unsplash** cargadas
   desde sus servidores. Mejor capturas propias de proyectos.
7. **Web de Taller Guzmán** (otro repo): sigue en `project-r5m3o.vercel.app`; su **canonical y
   og:url apuntan a `http://localhost:4321/`** (le falta `site` en `astro.config`) → Google no
   la indexa bien; enlaza a extreweb con el dominio viejo **`extreweb.ct.ws`**; y muestra nuestro
   Gmail como contacto. Arreglar antes de entregarla.
8. Footer: la columna "Expertise" está en inglés; el lema "Ingeniería digital premium…" es
   genérico.

### Panel `/admin`
9. Repaso responsive general (espaciados, tamaños táctiles, modales, partidas).
10. **Limpiar CSS muerto en `admin.css`**. Verificado el 18/09 que **no se usan** en ningún `.jsx`:
    `.a-shell`, `.a-side*`, `.a-nav`, `.a-nav-btn`, `.a-nav-logout`, `.a-overlay`, `.a-menu-*`,
    `.a-stats`, `.a-stat`, `.a-stat-num`, `.a-partida`, `.a-partida-add`, `.a-quick*`,
    `.a-stats2`, `.a-stat2`, `.a-money`, `.a-badge-toggle`, `.a-btn-xs`.
    ⚠️ `.a-stat-label` **sí** se usa (resumen económico del proyecto): no borrarla.
11. **Calendario móvil (vista Mes):** `.a-cal-ev { display: none }` duplicado y un `::before`
    vacío; la idea era **un puntito por evento**. Está a medias.
12. **`Login.jsx`:** distinguir **error de red** de **credenciales incorrectas** (hoy todo dice
    "Email o contraseña incorrectos", despista si Supabase está pausado).
13. Errores de Supabase silenciados en Clientes/Proyecto/Calendario (si algo falla, no pasa nada).

### SEO fuera de la web (lo que más pesa para salir en búsquedas locales)
- **Google Business Profile** como negocio de zona de servicio (sin dirección visible) → reseñas
  de clientes reales (GuadiCar, Toldos Pallares, Taller Guzmán, Físicas Élite).
- Enlaces desde las webs de clientes: GuadiCar enlaza a `www.extreweb.es` (mejor sin `www`);
  Fichar365 y CarMeet no enlazan; Taller Guzmán, al dominio viejo.
- Mismo nombre, teléfono y web en directorios y redes. Instagram con la web en la bio.
- Search Console: pedir indexación de las páginas nuevas y revisar *Rendimiento → Consultas*.
- ⚠️ Con el rebranding/cambio de dominio: **redirecciones 301 de todas las URLs** para no perder
  lo ganado.

### Técnico / baja prioridad
14. **Keep-alive de Supabase:** probablemente ya no haga falta — la suscripción del calendario del
    iPhone consulta la base cada ~hora. Confirmar que el proyecto no vuelve a pausarse.
15. Saltos de encabezado `h1 → h3` en servicios y proceso (tarjetas en `h3` sin `h2`).
16. Imágenes responsive: **hecho en la portada** (versiones -800/-1200 con `srcset`). Faltan
    `/proyectos/` y las landings locales, que siguen sirviendo la de 1905 px.
17. ~~Limpiar el código muerto de `data-reveal`~~ ✅ hecho (22/09): sustituido por `.fx-*`.
18. Mejoras del panel ya comentadas: buscador de clientes, exportar presupuesto a PDF,
    subir archivos a proyectos, alta de proyecto más completa.

---

## 15. Resumen de gotchas (los que ya nos han mordido)

| Problema | Causa | Regla |
|---|---|---|
| Página en blanco / texto desaparecido | Ocultar contenido con CSS y revelarlo con JS | **Nunca** condicionar visibilidad a JS |
| Algo que solo funciona con ratón | Botón/enlace visible solo en `:hover` | En táctil no hay hover: lo importante siempre visible o la tarjeta entera clicable |
| Animación que no arranca al pegar desde el móvil | `<script>` largo cortado al pegar | Trocear el código; sospechar de esto primero |
| Imagen que no carga solo en producción | Mayúsculas en el nombre | Linux/Netlify distingue mayúsculas |
| `supabaseUrl is required` en producción | Variables añadidas después del último build | Redesplegar con caché limpia tras tocar env vars |
| "Credenciales incorrectas" en el panel | Proyecto de Supabase **pausado** | Mirar la consola; no es la contraseña |
| `ERR_CERT_COMMON_NAME_INVALID` | Comodín `*.extreweb.es` + ANAME al parking | Jamás un CNAME comodín en la zona |
| Error de SSL ya arreglado que sigue saliendo | HSTS cacheado | Incógnito o `chrome://net-internals/#hsts` |
| Build falla en Netlify | Node 20 | `NODE_VERSION = "22"` (Astro 6 lo exige) |
| Cada clic interno tarda más de la cuenta | Enlace sin barra final → 301 de Netlify | Enlaces internos siempre con `/` final |
| El reCAPTCHA no sale en local | Lo inyecta Netlify al desplegar | Probar el formulario en producción |
| `/admin` en blanco en `npm run dev` (`jsxDEV is not a function`) | `astro build` con el dev arrancado corrompe `node_modules/.vite` | Parar el dev, borrar `node_modules/.vite`, recargar con Ctrl+Shift+R |
| Mensaje del formulario que no llega al panel | Falta `SUPABASE_SERVICE_KEY` o la tabla | Netlify → Logs → Functions → `submission-created` |
| Scroll a tirones | `backdrop-filter`/`filter: blur` grandes, `box-shadow` o `height` animados | Ver §6 "Reglas de rendimiento" |
| Titular que parpadea al cargar | `gsap.from()` en la cabecera: se ve, se oculta y vuelve a entrar | Cabeceras con `.fx-in` (CSS) |
| El hover de una tarjeta ya no se mueve | GSAP deja `transform` en línea tras animar | Apariciones con `.fx-up` (usa `translate`) |

---

## 16. Lo que NO hay que tocar

- `package.json`, `netlify.toml`, `tsconfig.json`.
- `astro.config.mjs` — **solo** se añadió el filtro del sitemap (`/admin` fuera), con permiso.
- El **Hero** (está aprobado y es CSS puro a propósito). El 22/09 solo se le quitó el
  `backdrop-filter` al marquee y se le puso `data-anim-pausa` (rendimiento, mismo aspecto).
- Las **reglas del sistema de animación** (§6): clases `.fx-*` en CSS, GSAP solo para lo que va
  pegado al scroll, nada de desenfoques grandes. Si algo va a tirones, mirar §6 antes de tocar.
- Los **registros MX/SPF/DKIM de Zoho** en el DNS.
- La **RLS** de Supabase (las tablas nuevas siguen la misma política; no se ha cambiado ninguna).
