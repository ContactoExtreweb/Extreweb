# PLAN — fgdigitalsl.com (FG Digital) junto a extreweb.es

> Encargo para una conversación nueva. Antes de nada: `git fetch` + `git pull` (Saúl trabaja
> desde 2 PCs) y leer **`CONTEXTO-EXTREWEB.md` entero**. Este documento solo añade lo de FG Digital.
> Escrito el 13/10/2026.

---

## 1. Decisiones de Saúl (13/10/2026) — no volver a preguntarlas

1. **FG Digital SL** es la razón social. Han comprado **fgdigitalsl.com**.
2. **Dos webs abiertas, mismo contenido.** fgdigitalsl.com es la web de extreweb tal cual, pero con
   el nombre **FG Digital**. extreweb.es **no se borra ni se redirige**. Son la misma empresa
   (como Securitas Direct / Verisure).
3. **Mismo proyecto, dos marcas — NO una copia.** Un solo repo. Netlify construye dos webs desde
   él. Un cambio (proyecto nuevo, oferta, arreglo) se hace una vez y sale en las dos.
4. **Para Google la principal es fgdigitalsl.com.** Las dos webs ponen `canonical` (y `og:url`,
   los `@id` del schema y el sitemap) apuntando a **fgdigitalsl.com**. A la gente no se la
   redirige; solo se le dice a Google cuál es la original.
   *Ya se le explicó:* dos webs iguales no suman tráfico en Google (enseña una de las dos). El
   tráfico extra vendrá de redes y de quien escriba la dirección.
5. En redes van a **mencionar fgdigitalsl.com** y a ir unificando todo bajo **un solo nombre**
   para no confundir al cliente.
6. **Alcance: la parte pública.** El panel sigue en **extreweb.es/admin** con la marca actual.
   *(13/10, pregunta 6: el panel también pasa a FG Digital → fase aparte, después de la pública.)*

### Respuestas a las preguntas del §4 (13/10/2026)
1. **Logo:** provisional, mismo estilo (squircle con gradiente `#0071e3 → #7c5cff`) con «FG».
2. **Nombre:** «FG Digital» en la web; «FG Digital SL» solo en legales y `legalName`.
3. **Contacto de fgdigitalsl.com:** email **pedro@fgdigitalsl.com**. extreweb.es sigue con
   `contactoextreweb@gmail.com`.
   **Redes nuevas en LAS DOS webs** (se unifica todo): Instagram
   `https://www.instagram.com/fgdigital_sl` y TikTok `https://www.tiktok.com/@fg.digital.sl`.
   @extreweb deja de salir.
4. **«Extreweb es una marca de FG Digital SL»** en extreweb.es: sí, en el footer y en Nosotros.
5. **NIF y datos registrales:** aún no los tiene. Titular FG Digital SL, NIF pendiente.
6. **Panel:** sí, también pasa a FG Digital (fase 5, después de la parte pública).
   El PDF del presupuesto ya saca el nombre fiscal de Ajustes → Datos de la empresa.

## 2. Cómo se hace (diseño acordado)

- **Variable de entorno `PUBLIC_MARCA`:** sin valor = Extreweb; `fgdigital` = FG Digital.
  Solo se pone en el **segundo sitio de Netlify** (desde su panel). **`netlify.toml` no se toca.**
- **`src/lib/site.js`:** los datos que cambian por marca. `SITE` ya lo usan el schema, el
  BaseLayout y las landings locales. Aquí se elige según `import.meta.env.PUBLIC_MARCA`:
  - nombre visible: `extreweb` / `FG Digital`;
  - dominio propio;
  - `og:image`;
  - email e Instagram, si cambian (pregunta 3);
  - dominio principal (`https://fgdigitalsl.com`, igual en las dos).
- **Centralizar la marca** (ya estaba en CONTEXTO §14.2). Hoy está escrita a mano en ~25
  archivos públicos. Saca la lista con
  `grep -rni extreweb src public astro.config.mjs | grep -v admin`. Lo importante:
  - **Logo:** un `Logo.astro` único para Navbar y Footer. El Navbar usa una «E» y el Footer un
    rayo (§13).
  - **Footer:** el texto grande `EXTREWEB` y la línea del `©`.
  - **Títulos:** los `title` / `seoTitle` de todas las páginas (`— extreweb`) y el título por
    defecto + `og:site_name` del `BaseLayout`.
  - **Textos de marca:** «El Método Extreweb» (`Process.astro`), el código decorativo
    `import { Extreweb }` / `Extreweb.Engine` (`Services.astro`), `nosotros.astro`, `contacto.astro`.
  - **Legales** (`aviso-legal`, `privacidad`, `cookies`, el RGPD de `contacto`): el titular es
    **FG Digital SL en las dos webs** (lo exige la LSSI). Falta el NIF (§14.1).
  - **Archivos de marca:** `public/favicon.svg` (aria-label y dibujo) y `public/og-portada.jpg`.
    Para FG hace falta una versión propia de 1200×630: se puede maquetar en HTML y capturar con
    Chrome sin ventana (§17).
- **Schema:** el mismo negocio en las dos webs: `name: 'FG Digital'`,
  `legalName: 'FG Digital SL'`, `alternateName: 'Extreweb'`, con URLs/`@id` de fgdigitalsl.com.
- **`astro.config.mjs`:** `site` pasa a `https://fgdigitalsl.com` en las dos webs (fase 3).
  Así el canonical del BaseLayout y el sitemap salen solos.
- **`public/robots.txt`:** la línea `Sitemap:` apunta a `https://fgdigitalsl.com/sitemap-index.xml`
  (un robots puede apuntar a otro dominio). Sirve el mismo archivo para las dos.
- **Visitas de fgdigitalsl.com:**
  - `v.js` llama a `/api/visita` del propio sitio, así que el segundo sitio de Netlify necesita
    las mismas variables de Supabase.
  - `visita.mjs` solo acepta `extreweb.es` o las webs de la tabla `sitios`. Basta con dar de alta
    `fgdigitalsl.com` en **panel → Ajustes → Webs medidas**, sin tocar código, y luego se elige
    en el selector de Visitas.
  - Para no contar a Saúl: entrar una vez en `fgdigitalsl.com/admin` con su sesión marca ese
    navegador (`ew-yo`).
- **Formulario:**
  - Netlify Forms va por sitio, así que en el segundo sitio hay que activar los avisos por email.
  - `submission-created.mjs` corre igual y guarda en `mensajes` (necesita las variables).
  - Opcional: saber desde qué web llegó (columna nueva rellenada con `payload.site_url`, SQL en
    `supabase/`). Preguntar si hace falta.

## 3. Fases (en este orden — que extreweb.es no se rompa nunca)

1. ✅ **(13/10) Código: centralizar la marca.** Hecho en 5 piezas:
   - `site.js`: `marca`, `name`, `legalName`, `nif`/`registro` (null = no salen), `url`, `email`,
     `instagram`, `tiktok`, `ogImage`, `favicon`, según `PUBLIC_MARCA`.
   - `Logo.astro` (nuevo) en Navbar y Footer; Footer con TikTok, texto grande y © por marca.
   - Títulos y descripciones de todas las páginas + `og:site_name` con `SITE.name`.
   - Textos: Process, Services (código de adorno), Nosotros («Hoy, extreweb es una marca de FG
     Digital SL», solo en extreweb), emails de Contacto.
   - Legales: titular FG Digital SL en las dos; schema con `legalName`.
   - `public/favicon-fg.svg` y `public/og-fgdigital.jpg` (generada con la plantilla de la og de
     extreweb: HTML + Chrome sin ventana).
   - Cambios visibles en extreweb.es (decididos): símbolo único (la «E» con gradiente del favicon,
     antes «E» plana arriba y rayo abajo), Instagram @fgdigital_sl + TikTok, © y Nosotros con
     «marca de FG Digital SL».
   - Servidor de FG en local: `astro-dev-fg-4324` en `.claude/launch.json`.

   Enunciado original: al terminar, extreweb.es se ve **igual** que ahora.
   Probarlo en local con las dos marcas:
   - PowerShell: `$env:PUBLIC_MARCA='fgdigital'; npm run dev -- --port 4324`;
   - Bash: `PUBLIC_MARCA=fgdigital npm run dev -- --port 4324`;
   - a la vez, Extreweb normal en el 4323.

   Comprobar móvil y escritorio, claro y oscuro.
2. **Saúl (no Claude, no se usan sus credenciales):**
   - Netlify → *Add new site* → **el mismo repo de GitHub**;
   - copiar las variables del sitio de Extreweb (`PUBLIC_SUPABASE_URL`,
     `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `ANALITICA_SAL` si existe) y añadir
     `PUBLIC_MARCA=fgdigital`;
   - dominio **fgdigitalsl.com** + `www`, y los registros DNS donde se compró. Ojo con lo del §10:
     **nada de CNAME comodín**. El dominio ya tiene correo (`pedro@fgdigitalsl.com`): **no tocar
     sus MX/SPF/DKIM**, solo añadir el A y el CNAME de `www`;
   - Forms → avisos al email.

   Comprobar en `*.netlify.app` y en el dominio.
3. **Código: Google apunta a FG Digital.** `site`, canonical, `og:url`, schema y robots →
   fgdigitalsl.com. **Solo cuando la fase 2 esté en marcha** (si no, el canonical apuntaría a
   una web que no existe).
   - Al cambiar el `site`, el `canonical` del BaseLayout ya sale solo. `og:image` y el schema usan
     `SITE.url` (dominio propio de cada build): pasarlos al dominio principal. El `Sitemap:` de
     `robots.txt`, a mano.
4. **Saúl, fuera de la web:**
   - Search Console: añadir fgdigitalsl.com y enviar el sitemap;
   - Ficha de Google: cambiar la web (y el nombre, si lo deciden) — el nombre debe coincidir con
     el rótulo/realidad o Google puede pedir verificar otra vez;
   - bio de Instagram con fgdigitalsl.com.

5. **Panel `/admin` a FG Digital** (decidido el 13/10): cabecera, título de la pestaña, favicon,
   informe de visitas, textos de reseñas… El presupuesto en PDF ya saca el nombre fiscal de
   Ajustes → Datos de la empresa (poner «FG Digital SL» ahí, sin código).

**Pendiente de Saúl:** ¿con qué proveedor va el correo `pedro@fgdigitalsl.com`? La política de
privacidad nombra a Google como proveedor de correo (por el Gmail); si es otro, nombrarlo en la de FG.

**Comprobación final** (con el servidor de desarrollo **apagado**): `npm run build`, luego con
`PUBLIC_MARCA=fgdigital`, y `grep -ri extreweb dist`. En la build de FG solo deberían quedar el
`alternateName` y lo que se decida a propósito (p. ej. la frase de la pregunta 4).

## 4. Preguntar a Saúl al empezar — ✅ respondidas el 13/10 (ver §1)

1. **Logo de FG Digital** (símbolo + nombre). Si aún no hay, ¿provisional con el mismo estilo
   (squircle con gradiente `#0071e3 → #7c5cff` y «FG»)?
2. Cómo se escribe en la web: **«FG Digital»** (¿y «FG Digital SL» solo en legales?).
3. **Email e Instagram** de la web de FG: ¿los mismos (`contactoextreweb@gmail.com`,
   @extreweb) o hay nuevos?
4. **Para no confundir:** ¿poner en extreweb.es «Extreweb es una marca de FG Digital SL» (footer
   y nosotros)? Recomendado.
5. **NIF y datos registrales** de FG Digital SL para el aviso legal (pendiente desde el 05/10).
6. ¿El panel (presupuestos en PDF, informes de visitas) pasa también a FG Digital? Por ahora
   queda fuera.

## 5. Reglas de siempre (resumen, el detalle en CONTEXTO §1 y §16)

- Paso a paso.
- Decir en cada archivo si se **reemplazó ENTERO** o se editó.
- Mobile-first, claro y oscuro.
- Sinceridad.
- **No tocar `package.json`, `netlify.toml` ni `tsconfig.json`.**
- **No hacer build con su servidor de desarrollo encendido.**
- No usar sus credenciales.
- No inventar clientes ni datos.
- **Commit y push los hace Saúl**, salvo que lo pida en ese momento.
- Al acabar, actualizar `CONTEXTO-EXTREWEB.md` (§2, §4, §13, §14).
