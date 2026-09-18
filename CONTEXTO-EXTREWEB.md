# CONTEXTO DEL PROYECTO — extreweb

> Documento de traspaso. Contiene todo el contexto acumulado del proyecto: quién soy,
> stack, decisiones tomadas, lo que YA funciona (y no hay que tocar), los errores
> cometidos y por qué, y lo que queda pendiente.
> **Léelo entero antes de proponer cambios.**

---

## 1. Quién soy

- **Saúl Correyero Pañero**, desarrollador web **junior**.
- **Co-fundador de extreweb**, agencia web con sede en **Miajadas (Cáceres), Extremadura**.
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

### Otros proyectos míos (contexto)
| Proyecto | Stack | Estado |
|---|---|---|
| **guadicar.es** — GuadiCar Multimarcas (concesionario, cliente José Juan) | Astro + Supabase + Netlify | En producción, mantenido |
| **carmeet.es** — CarMeet ESP (red social motor) | React + Vite + Supabase | TFG de DAW, en migración |
| **Físicas Élite** | Next.js + Supabase + Stripe + Bunny Stream | Traspasado a Pedro |
| **toldospallares.com** | WordPress + Elementor | Cliente |
| **Taller Guzmán** | Astro 6 + Tailwind | Cliente |

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

---

## 3. Stack técnico (versiones exactas)

- **Astro 6.4.8** (requiere Node ≥ 22.12)
- **GSAP 3.15** + ScrollTrigger · **Lenis 1.3.x** (smooth scroll)
- **Inter** vía `@fontsource-variable/inter` → `'Inter Variable'`
- `@astrojs/sitemap` (con `site:` configurado → genera `sitemap-index.xml`)
- `@astrojs/react` + `react` + `react-dom` → **solo para el panel `/admin`**
- `@supabase/supabase-js` → **solo para el panel `/admin`**
- Alias **`@/*` → `src/*`** (en `tsconfig.json`)
- CSS: un `global.css` con tokens + estilos **scoped** por componente Astro.
  **Sin Tailwind, sin Sass** en este proyecto.
- JS vanilla en los `<script>` de componentes, con `// @ts-nocheck`.

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
    (Zoho, Google Search Console) → **NO TOCAR, de ahí depende el correo.**
  - CNAMEs residuales de DonDominio (`mail`, `imap`, `pop`, `smtp`, `webmail`, `ftp`, `bbdd`) —
    inofensivos.
- ⛔ **NUNCA debe existir un CNAME comodín `*.extreweb.es`** ni un `ANAME` al parking.
  Eso fue lo que rompió la renovación del certificado SSL (ver §10).

### Hosting
- **GitHub → Netlify**, auto-deploy en cada `git push`.
- `netlify.toml`: `command = "npm run build"`, `publish = "dist"`, `NODE_VERSION = "22"`.
- Subdominio de pruebas: **extreweb.netlify.app** (útil para aislar problemas de dominio/SSL).
- Local: `npm run dev` → `localhost:4321`.
- SSL: Let's Encrypt, dominios `extreweb.es, www.extreweb.es`, auto-renovación activa.

### ⚠️ Gotcha crítico: variables de entorno
Las `PUBLIC_*` de Astro **se incrustan en el momento del build**. Si cambias una variable en
Netlify, **hay que redesplegar** (`Trigger deploy → Clear cache and deploy site`) o seguirá
sirviéndose el build viejo sin ellas. Esto ya nos costó un "supabaseUrl is required" en producción.

Variables en Netlify (scope: All):
```
PUBLIC_SUPABASE_URL=https://ihmcqjuztvuxljsiukjo.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
> La URL es **solo la base**, sin `/rest/v1/`. La `anon key` es pública por diseño;
> la seguridad la da la RLS. **Nunca** meter aquí la `service_role`.

### Imágenes
En `public/proyectos/`, referenciadas **sin** `/public/` (ej. `/proyectos/Guadicar.webp`).
**OJO con mayúsculas** — Netlify/Linux distingue, Windows no: `Guadicar.webp`, `Car-MeetESP.webp`,
`Fichar.webp`, `Guzman.webp`, `Toldos-Pallares.webp`.

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
- **Hover SOLO** dentro de `@media (hover: hover) and (pointer: fine)` — en táctil no se dispara.
- Utilidad `.mono` (usa `--font-mono`).
- Modo oscuro: toggle sol/luna en `Navbar.astro` (pone `data-theme` en `<html>` + `localStorage`)
  + script `is:inline` anti-FOUC en el `<head>` de `BaseLayout.astro`.

---

## 6. Sistema de animación (ANALIZADO — es coherente y seguro, NO reescribir)

### `src/lib/motion.js`
Exporta: `gsap`, `ScrollTrigger`, `reduceMotion`, `finePointer`, `spring(onUpdate, {stiffness, damping, precision})`.
Internamente: `initLenis()` (smooth scroll **solo escritorio con ratón**; móvil usa scroll nativo),
`initReveals()` (IntersectionObserver para `[data-reveal]` + **red de seguridad `setTimeout` 3s**),
`boot()` que marca `data-motion-ready` en `<html>`.

### Cómo se usa realmente
- Cada página importa `gsap` desde `@/lib/motion.js` → al cargarse arranca el motor.
- Héroes: `.gsap-reveal` / `.gsap-fade` (animan al cargar).
- Tarjetas y secciones: `.gsap-up` con **ScrollTrigger** (`start: "top 85%"`).
- Los componentes de la home (Services, Projects, Process, Showcase, Playground, Trust, Areas)
  tienen su propio `<script>` con ScrollTrigger importando desde `motion.js`.

### 🔑 Invariante que NO se puede romper
**Ninguna clase `gsap-*` está oculta por CSS.** Si el JS falla, el contenido **se ve igual**.
Nunca condicionar la visibilidad del contenido a JavaScript → eso provocó varias veces
páginas en blanco o textos desaparecidos. El movimiento solo realza; nunca es requisito.

### Código muerto conocido
El sistema `data-reveal` / `.is-in` de `global.css` + `initReveals()` **está sin usar**.
Es inofensivo, pero se puede limpiar.

---

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

---

## 8. Estructura del sitio público

```
src/
├── styles/global.css              tokens + reset + modo oscuro + utilidades
├── lib/
│   ├── motion.js                  motor de animación
│   └── site.js                    datos NAP + constantes SEO
├── layouts/BaseLayout.astro       <head> SEO + Schema + anti-FOUC + motion.js
├── components/
│   ├── Navbar.astro               (~511 líneas, con toggle de tema)
│   ├── Hero.astro                 ⭐ CSS PURO, sin JS (ver §9)
│   ├── Showcase.astro             captura de GuadiCar con revelado Apple al scroll
│   ├── Playground.astro           demo interactiva (era el hero descartado, ver §9)
│   ├── Services.astro
│   ├── Projects.astro
│   ├── Trust.astro                stats con contadores, fondo azul
│   ├── Process.astro
│   ├── Areas.astro                zonas → enlaza a las 3 landings locales
│   ├── Faq.astro                  array `faqs` + JSON-LD FAQPage
│   ├── Cta.astro
│   ├── Footer.astro
│   └── seo/
│       ├── Schema.astro           JSON-LD @graph sitewide
│       └── ServiceSchema.astro    Service + BreadcrumbList (reutilizable)
├── content/blog/                  posts .md
└── pages/
    ├── index.astro
    ├── admin.astro                ⭐ panel interno (ver §11)
    ├── servicios/{index, diseno-web, seo, redes-sociales, sistemas-soporte}.astro
    ├── proyectos/index.astro      array `projects` → enlaces EXTERNOS a las webs en vivo
    ├── nosotros.astro             (~709 líneas, con bios reales de los dos socios)
    ├── proceso.astro · contacto.astro
    ├── blog/{index, [slug]}.astro
    ├── diseno-web-don-benito.astro
    ├── diseno-web-villanueva-de-la-serena.astro
    ├── diseno-web-caceres.astro   (las 3 con contenido ÚNICO, no plantilla repetida)
    └── aviso-legal.astro · privacidad.astro · cookies.astro
```

**Orden de la home (`index.astro`):**
`Navbar → Hero → Showcase → Playground → Services → Projects → Trust → Process → Areas → Faq → Cta → Footer`

**Archivos borrados a propósito** (no recrear):
- `blog/[...slug].astro` → colisionaba con `blog/[slug].astro`.
- `proyectos/[slug].astro` → devolvía `[]`; las tarjetas de proyecto enlazan a las **webs reales
  en vivo** con `target="_blank"`, no a fichas internas. Es lo correcto para una agencia.

---

## 9. La saga del Hero (CONTEXTO CRÍTICO — no repitas estos errores)

Se dedicaron **muchísimas** iteraciones. Ideas **descartadas definitivamente**:

1. ❌ **"Navegador con una mini-web maquetada dentro"** (web dentro de web). Se intentó una y otra
   vez; siempre salía pequeña, pobre y poco estética. **Rechazada.**
2. ❌ **Simulación de landing de concesionario** dentro del navegador, con la captura de GuadiCar
   encima → quedaba una web dentro de una web dentro de una web. Horrible.
3. ❌ **Tipografía kinética con palabra rotativa** (reales / a medida / que venden / rápidas) →
   bug: todas las palabras apiladas y superpuestas, o el titular desaparecido.
4. ❌ **"Patio de juegos" interactivo** en el hero (cambiar color de marca, cursor tipo Figma,
   arrastrar tarjetas, claro/oscuro, wireframe/SEO, calculadora de presupuesto) →
   *"una portada convence, no entretiene"*; además eliminaba los CTAs.
   **Guardado como `Playground.astro`** y colocado más abajo en la home.

### ✅ HERO ACTUAL (aprobado — "simple pero funcional")
- **Estilo Apple**, **100% CSS, SIN JavaScript** (por eso es imposible que se rompa).
- `h1`: **"Vendemos soluciones reales."** — "reales" con
  `linear-gradient(120deg, var(--accent), #7c5cff)` + `background-clip: text`.
- Kicker eyebrow: "Diseño y desarrollo web · Extremadura".
- Sub: "A medida, rápidas y pensadas para vender. Sin plantillas, sin atajos."
- 2 CTAs: **Empezar proyecto** (/contacto) y **Ver proyectos** (/proyectos).
- Chevron de scroll animado abajo.
- `min-height: 100svh` (no `100vh`), `@keyframes heroIn` con delays escalonados
  (0.1s / 0.22s / 0.4s / 0.55s), `prefers-reduced-motion` respetado.
- Funciona perfecto en claro y oscuro.

> ⚠️ **No propongas volver a meter el navegador/mini-web en el hero.** Si hay que mejorarlo,
> que sea sobre esta base tipográfica.

---

## 10. Incidencia de SSL (resuelta el 15/09/2026) — documentada para que no se repita

**Síntoma:** `extreweb.es` caído con `NET::ERR_CERT_COMMON_NAME_INVALID`. El panel `/admin`
también inaccesible. Correos de Netlify: *"Failed attempt to renew your TLS certificate"* con
`Unable to verify challenge for *.extreweb.es: No TXT record found at _acme-challenge.extreweb.es`.

**Causa (doble):**
1. En DonDominio existían dos registros de parking:
   - `extreweb.es` **ANAME** → `parkingsrv0.dondominio.com` (competía con el A correcto)
   - `*.extreweb.es` **CNAME** → `parkingsrv0.dondominio.com` ← **el asesino**: el comodín
     capturaba `_acme-challenge.extreweb.es`, así que Let's Encrypt nunca podía validar.
2. En Netlify había una **zona DNS huérfana** (el dominio figuraba como "Netlify DNS") mientras
   los nameservers apuntaban a DonDominio → Netlify pedía un certificado **wildcard**
   `*.extreweb.es` que jamás podría validar.

**Solución aplicada:**
1. Borrar en DonDominio el `ANAME` y el `CNAME *`.
2. Borrar la zona DNS de Netlify (Team → DNS → Danger zone → Delete DNS zone).
3. Esperar propagación (verificado con dnschecker: `75.2.60.5` en todo el mundo).
4. Netlify → Domain management → **Renew certificate**.

**Resultado:** `Domains: extreweb.es, www.extreweb.es` (sin wildcard), auto-renovación 14 dic.

**Lecciones:** nunca dejar un comodín en la zona DNS; si el certificado falla, mirar primero el DNS;
el HSTS hace que el navegador cachee el error (probar en incógnito o limpiar en
`chrome://net-internals/#hsts`).

---

## 11. Panel de administración (`/admin`)

Herramienta interna tipo mini-CRM para los dos socios. **Ya está en producción y funcionando.**

### Arquitectura
Vive **dentro del mismo proyecto Astro**, como una **isla de React** (`client:only="react"`)
en `src/pages/admin.astro`. **El sitio público sigue siendo 100% estático** — no se activó SSR.
La seguridad la da **Supabase Auth + RLS**, no el hecho de ocultar la página.
La página lleva `<meta name="robots" content="noindex, nofollow">` y `robots.txt` tiene `Disallow: /admin`.

### Supabase
- Proyecto: `https://ihmcqjuztvuxljsiukjo.supabase.co`
- **Auth:** una **única cuenta compartida** para los dos socios. **Registro público desactivado.**
- **RLS activada en todas las tablas**, con política `"auth all" for all to authenticated
  using (true) with check (true)`. El rol `anon` no ve nada.
- Cliente en `src/lib/adminClient.js` (`persistSession: true`, `autoRefreshToken: true`).

**Esquema:**
```
clientes      id, nombre, empresa, email, telefono, notas, created_at
proyectos     id, cliente_id→clientes, titulo, descripcion, estado('activo'|'pausado'|'terminado'), created_at
notas         id, proyecto_id→proyectos, contenido, created_at
reuniones     id, proyecto_id→proyectos(null), cliente_id→clientes(null), titulo, descripcion,
              fecha (inicio), fecha_fin, created_at
presupuestos  id, proyecto_id→proyectos, titulo, created_at
partidas      id, presupuesto_id→presupuestos, concepto, importe numeric(10,2),
              pagado bool, fecha_pago date, created_at
```
Todas las FK con `on delete cascade` (salvo las de `reuniones`, que son `set null`).
Índices en las columnas de relación.

> El dinero funciona así: proyecto → presupuesto(s) → **partidas**. Cada partida se marca
> pagada/pendiente. Total, cobrado y pendiente se **calculan sumando partidas**, no se guardan.

### Archivos
```
src/pages/admin.astro               shell mínimo, noindex, script de tema
src/styles/admin.css                todos los estilos del panel
src/lib/adminClient.js              cliente de Supabase
src/components/admin/
  ├── AdminApp.jsx                  raíz: sesión, HEADER superior, routing por estado
  ├── Login.jsx                     email + contraseña
  ├── Inicio.jsx                    hero de bienvenida + stats + cobros pendientes + reuniones
  ├── Clientes.jsx                  listado + alta
  ├── ClienteDetalle.jsx            ficha, edición, borrado + sus proyectos
  ├── ProyectoDetalle.jsx           presupuestos/partidas + notas + reuniones del proyecto
  ├── Calendario.jsx                rejilla mensual + vista lista + modal crear/editar
  └── helpers.js                    euro(), fechaCorta(), fechaHora(), soloHora(),
                                    rangoReunion(), paraInputDatetime()
```

### Layout — HEADER superior (importante)
La **primera versión tenía barra lateral y se descartó**. Ahora hay un **header horizontal
sticky** igual que la web pública:
- Izquierda: logo SVG (la "E" en squircle con gradiente azul→violeta) + "extreweb" + badge "panel".
- Centro: nav (**Inicio · Clientes · Calendario**) con la sección activa resaltada.
- Derecha: toggle de tema + cerrar sesión + hamburguesa (≤720px, despliega el nav debajo).
- Fondo con `backdrop-filter` (efecto cristal), `max-width: 1200px`.

### Pantallas
- **Inicio:** hero de bienvenida que **saluda según la hora** ("Buenos días/tardes/noches, {nombre} 👋",
  el nombre sale del email antes de la @), fecha de hoy, frase-resumen, y 3 botones de acción.
  Debajo: franja de stats (clientes / proyectos activos / pendiente / cobrado), **cobros pendientes
  por proyecto** (ordenados por importe, clicables) y **próximas reuniones**.
- **Clientes / ClienteDetalle:** CRUD de clientes y sus proyectos.
- **ProyectoDetalle:** el corazón. Resumen económico con **barra de progreso** (% cobrado),
  presupuestos con **partidas tipo checkbox** (clic = pagado/pendiente, guarda `fecha_pago` sola),
  edición inline de partidas, notas del cliente, y reuniones del proyecto con inicio+fin y editables.
- **Calendario:** rejilla mensual (lunes→domingo, 42 celdas), navegación de meses, botón "Hoy",
  conmutador **Mes / Lista** (en móvil arranca en Lista automáticamente), clic en un día → panel
  con las reuniones de ese día, clic en una reunión → **modal para editar/eliminar**.
  Modal con título, inicio, fin, cliente y descripción. Varios eventos por día a distintas horas.

---

## 12. SEO — lo que ya está hecho

- **`src/lib/site.js`** → objeto `SITE`: name, url, description, email, telephone, **`sameAs: []`
  (VACÍO, pendiente)**, region, country, `areaServed` (5 ciudades), `founders` (los 2 socios),
  `ogImage: '/og-portada.jpg'`.
- **`seo/Schema.astro`** → JSON-LD `@graph` con **Organization + ProfessionalService + WebSite**,
  renderizado **sitewide** desde `BaseLayout`.
- **`seo/ServiceSchema.astro`** → **Service + BreadcrumbList**, una línea en cada una de las
  4 páginas de servicio ("Diseño y desarrollo web", "Posicionamiento SEO", "Gestión de redes
  sociales", "Sistemas y soporte técnico").
- **`Faq.astro`** → JSON-LD **FAQPage** generado desde el array `faqs`.
- **`nosotros.astro`** → tiene las bios reales de los dos socios (E-E-A-T). Se le quitó el JSON-LD
  inline duplicado porque ya va el global.
- **`BaseLayout.astro`** → title, description, canonical, Open Graph completo, `og:image`,
  `twitter:card`/`twitter:image`, `theme-color` adaptable (light/dark), `robots: index, follow`.
- **`public/robots.txt`** → permite buscadores **y explícitamente los bots de IA**
  (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, PerplexityBot, Perplexity-User,
  Google-Extended, Applebot-Extended, Bytespider, meta-externalagent), `Disallow: /admin`,
  y `Sitemap: https://extreweb.es/sitemap-index.xml`.
- **Sitemap** confirmado (`site:` está en `astro.config.mjs`).
- **Google Search Console:** propiedad verificada, sitemap enviado, indexación solicitada
  página a página. La home ya sale como "indexada".
- **Landings locales** con contenido **único** por ciudad (no plantilla duplicada).

### Realidad sobre "que me recomienden las IAs"
El schema y lo técnico están bien, pero que una IA te recomiende depende sobre todo de la
**reputación FUERA de la web**: Google Business Profile, reseñas, menciones. Es trabajo de meses,
no de código. Lo que sí controlamos (permitir bots de IA, contenido citable, entidad consistente)
ya está hecho.

---

## 13. Marca

Símbolo generado: una **"E" formada por barras redondeadas apiladas** dentro de un **squircle**
con gradiente **`#0071e3 → #7c5cff`**. Lee como la E de extreweb y como bloques de contenido web.
Ese SVG está **incrustado inline** en el header y el login del panel.

Archivos generados (comprobar si están ya en el repo):
- `og-portada.jpg` (1200×630) → debe estar en **`public/og-portada.jpg`** (el meta ya apunta ahí).
- `logo-icon-extreweb.svg` → candidato a sustituir `public/favicon.svg`.
- `logo-extreweb-horizontal.png` / `-dark.png` → para usos fuera de la web (firmas, redes).

En la web, el wordmark "extreweb" es **texto Inter en vivo**, no imagen.

---

## 14. PENDIENTE — en lo que quiero que me ayudes

### Prioridad alta
1. **Formulario de contacto — NUNCA SE TERMINÓ.** Es el agujero más grave: la web no recibe
   mensajes. `contacto.astro` tiene un `<form>` (aparentemente con `data-netlify="true"`) y
   existe un honeypot `.hp-field` en `global.css`. **Verificar y rematar**: que Netlify Forms lo
   detecte en el build (HTML estático, `name` en el form, input oculto `form-name`), activar la
   detección de formularios en Netlify y **redesplegar**, probar un envío real y configurar el
   aviso por email.
2. **Repaso responsive / móvil del panel `/admin`.** Era el paso final acordado y quedó sin hacer.
   Revisar espaciados, tamaños táctiles, el calendario en pantallas pequeñas, los modales y las
   filas de partidas.
3. **Limpiar CSS muerto en `admin.css`.** Al cambiar de barra lateral a header superior quedaron
   sin usar: `.a-shell`, `.a-side`, `.a-side-brand`, `.a-side-foot`, `.a-nav`, `.a-nav-btn`,
   `.a-nav-logout`, `.a-overlay`, `.a-menu-open`, `.a-menu-close`, y probablemente las versiones
   antiguas de `.a-stats` / `.a-stat` y `.a-partida` (sustituidas por `.a-stats2`/`.a-stat2` y
   `.a-partida2`). **Verificar uso real antes de borrar.**
4. **Bloque CSS del calendario en móvil mal rematado:** dentro de `@media (max-width: 720px)` hay
   un `.a-cal-ev { display: none; }` **duplicado** y un `::before` vacío. La idea era mostrar un
   **puntito por evento** en cada celda; está a medias.

### Prioridad media
5. **`Login.jsx`:** distinguir **error de red** de **credenciales incorrectas**. Ahora cualquier
   fallo dice "Email o contraseña incorrectos", lo que despista mucho cuando la base de datos está
   pausada o caída. (Se propuso el arreglo pero no está confirmado que se aplicara.)
6. **Keep-alive de Supabase.** El plan gratuito **pausa el proyecto tras ~7 días sin actividad**
   (ya nos pasó: `ERR_NAME_NOT_RESOLVED` y "credenciales incorrectas" engañosas). Propuesta:
   **Netlify Scheduled Function** (`netlify/functions/keep-alive.js` con `@netlify/functions`,
   cron `0 9 * * *`, un `fetch` a `/rest/v1/clientes?select=id&limit=1` con la anon key).
   **No implementado todavía.**
7. **`sameAs` en `site.js`** sigue vacío — pendiente de definir Instagram / LinkedIn /
   Google Business Profile.
8. **`og-portada.jpg` en `public/`** — confirmar que está subida (si no, al compartir el enlace
   no sale miniatura).
9. **Blog**: solo hay un post de ejemplo (`como-subir-articulos.md`). Faltan artículos reales.
   Ideas: "¿Cuánto cuesta una página web en Extremadura?", "Diseño web en Don Benito",
   "Por qué tu web debe cargar en menos de 2 segundos".
   Formato: `.md` en `src/content/blog/` con frontmatter `title`, `description`, `category` (opc),
   `pubDate` (YYYY-MM-DD, sin comillas), `heroImage` (opc → `public/blog/`).
   El **nombre del archivo es la URL** (minúsculas, guiones, sin tildes).

### Prioridad baja / opcional
10. Breadcrumbs + schema en las **3 landings locales**.
11. Limpiar el **código muerto** del sistema `data-reveal` (en `global.css` y `motion.js`) y
    comprobar si sigue existiendo un `Stats.astro` vacío (0 bytes).
12. Mejoras del panel ya comentadas: **buscador de clientes**, **exportar presupuesto a PDF**,
    **subir archivos/imágenes a los proyectos**, formulario de alta de proyecto más completo.

---

## 15. Resumen de gotchas (los que ya nos han mordido)

| Problema | Causa | Regla |
|---|---|---|
| Página en blanco / texto desaparecido | Ocultar contenido con CSS y revelarlo con JS | **Nunca** condicionar visibilidad a JS |
| Animación que no arranca al pegar desde el móvil | `<script>` largo cortado al pegar | Trocear el código; sospechar de esto primero |
| Imagen que no carga solo en producción | Mayúsculas en el nombre | Linux/Netlify distingue mayúsculas |
| `supabaseUrl is required` en producción | Variables añadidas después del último build | Redesplegar con caché limpia tras tocar env vars |
| "Credenciales incorrectas" en el panel | Proyecto de Supabase **pausado** (`ERR_NAME_NOT_RESOLVED`) | Mirar la consola; no es la contraseña |
| `ERR_CERT_COMMON_NAME_INVALID` | Comodín `*.extreweb.es` + ANAME al parking en el DNS | Jamás un CNAME comodín en la zona |
| El navegador sigue mostrando el error de SSL ya arreglado | HSTS cacheado | Incógnito o `chrome://net-internals/#hsts` |
| Build falla en Netlify | Node 20 | `NODE_VERSION = "22"` (Astro 6 lo exige) |

---

## 16. Lo que NO hay que tocar

- `package.json`, `netlify.toml`, `astro.config.mjs`, `tsconfig.json`.
- El **Hero** (está aprobado y es CSS puro a propósito).
- El **sistema de animación** (`motion.js` + clases `gsap-*`): es coherente y seguro.
- Los **registros MX/SPF/DKIM de Zoho** en el DNS (de ahí depende el correo).
- La **RLS** de Supabase.
