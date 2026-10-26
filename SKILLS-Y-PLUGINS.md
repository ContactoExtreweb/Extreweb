# Skills y plugins de Claude Code

Inventario para tener los dos PCs iguales. Actualizado el 26/10/2026.

Todo va **en global** (`~/.claude/skills/` y plugins de usuario), nunca dentro de un repo.
Las skills **no** viajan con git ni con la cuenta: en cada PC hay que instalarlas.

## Antes de nada

- **Regla global** en `~/.claude/CLAUDE.md` (cópiala igual en el otro PC):

  ```markdown
  # Modo cavernícola (siempre activo)
  Sigue SIEMPRE las reglas de la skill **cavernicola** (`~/.claude/skills/cavernicola/SKILL.md`) en todas las respuestas, desde el primer mensaje, sin que el usuario lo pida. Solo se desactiva si dice "modo normal" o "para el cavernícola".
  ```

- `npx skills add` **sin `-g`** instala dentro del proyecto. Usa siempre `-a claude-code -g -y`.
- Revisar cada skill antes de instalarla (SKILL.md y scripts). Clonar a una carpeta temporal, no al proyecto.
- Ojo con los nombres repetidos: una skill nueva con el mismo nombre **pisa** a la anterior.

## Plugins

Se instalan desde un terminal de `claude` con `/plugin marketplace add <repo>` y luego `/plugin install <plugin>@<marketplace>`.

| Plugin | Marketplace (repo) | Para qué |
|---|---|---|
| `impeccable@impeccable` | `pbakaus/impeccable` | Diseño de interfaces: crítica, pulido, sistema de diseño |
| `gsap-skills@gsap-skills` | `greensock/gsap-skills` | Skills oficiales de GSAP (core, ScrollTrigger, plugins, timeline…) |
| `21st@21st-dev` | `21st-dev/magic-mcp` | Componentes UI de 21st.dev |
| `ponytail@ponytail` | `DietrichGebert/ponytail` | Modo "solución mínima" (se activa solo con un hook) |
| `humanizer@humanizer` | `blader/humanizer` | Quitar el tono de IA a los textos |
| `claude-code-setup@claude-plugins-official` | `anthropics/claude-plugins-official` | Recomendador de automatizaciones de Claude Code |
| `agent-skills@addy-agent-skills` | `addyosmani/agent-skills` | Activado en `settings.json`, pero **no instalado** en este PC |

## Skills en `~/.claude/skills/`

### Instaladas con `npx skills` (se reinstalan con el comando tal cual)

| Skills | Origen | Comando |
|---|---|---|
| `animate`, `animate-expo`, `animation-performance`, `animation-vocabulary`, `apple-design`, `ask-sonner`, `break-ui`, `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `mobile-native`, `pick-ui-library`, `prototype`, `review-animations`, `write-swift` | `emilkowalski/skill` | `npx -y skills add emilkowalski/skill -a claude-code -g -y` |

### Copiadas a mano desde GitHub

Clonar el repo (`git clone --depth 1 https://github.com/<repo>`) y copiar la carpeta de cada skill a `~/.claude/skills/`.

| Skills | Repo | Carpeta dentro del repo |
|---|---|---|
| `cavecrew`, `caveman`, `caveman-commit`, `caveman-compress`, `caveman-discover`, `caveman-evidence-review`, `caveman-explore`, `caveman-help`, `caveman-learn`, `caveman-manage`, `caveman-optimize`, `caveman-review`, `caveman-setup`, `caveman-stats`, `investigate-first`, `lean-build`, `megacave`, `migration`, `safe-refactor`, `surgical-patch`, `ultracave`, `verify-and-stop` | `JuliusBrussee/caveman` | `skills/*` (todas las que tienen `SKILL.md`) |
| `apple-hig` ⚠️ | `dickwu/apple-design-skill` | la raíz del repo, en una carpeta llamada `apple-hig` |
| `flutter-animations` | `madteacher/mad-agents-skills` | `flutter-animations/` |
| `ui-animation` | `proxify-dev/agentic-playbook` | `.agents/skills/ui-animation/` |
| `scroll-world` | `oso95/scroll-world` | `skills/scroll-world/` |
| `css-development` ⚠️, `css-development-create-component`, `css-development-refactor`, `css-development-validate` | `aiskillstore/marketplace` | `skills/2389-research/css-development*` |
| `karpathy-guidelines` | `multica-ai/andrej-karpathy-skills` | `skills/karpathy-guidelines/` |
| `replica-architect`, `replica-backend`, `replica-brand`, `replica-build`, `replica-deploy`, `replica-design`, `replica-diff`, `replica-entrepreneur`, `replica-launch`, `replica-recon`, `replica-test` | `Jakeschincariol/replica-skill` | `replica-*/` |
| `design-taste-frontend` ⚠️ | `Leonxlnx/taste-skill` | `skills/taste-skill/`, en una carpeta llamada `design-taste-frontend` |
| `svg-animation` | `iart-ai/web-animation-skills` | `skills/svg-animation/` |
| `web-animation-view-transitions` ⚠️ | `agents-inc/skills` | `dist/plugins/web-animation-view-transitions/skills/web-animation-view-transitions/` |
| `threejs-animation`, `threejs-fundamentals`, `threejs-geometry`, `threejs-interaction`, `threejs-lighting`, `threejs-loaders`, `threejs-materials`, `threejs-postprocessing`, `threejs-shaders`, `threejs-textures` | `CloudAI-X/threejs-skills` | `skills/threejs-*/` (aquí hay una versión anterior a la actual) |
| `img2threejs` | `img2threejs/img2threejs` | el repo entero |

⚠️ **Cambios hechos a mano** (repetirlos al reinstalar):

- **`apple-hig`**: en su `SKILL.md`, cambiar `name: apple-design` por `name: apple-hig`. Si no, choca con la `apple-design` de Emil.
- **`css-development`**: en su `SKILL.md`, cambiar `css-development:create-component`, `:validate` y `:refactor` por `css-development-create-component`, `-validate` y `-refactor`. Copiar solo `SKILL.md` y `skill-report.json`, no sus subcarpetas (están repetidas).
- **`design-taste-frontend`**: necesita Node 22 o más y Chrome. Guarda un historial en `~/.taste-skill/history.json`.
- **`web-animation-view-transitions`**: el repo no se descarga entero en Windows (rutas demasiado largas). Clonar y sacar los archivos con `git -c core.longpaths=true show HEAD:<ruta>`, o activar `git config --global core.longpaths true` antes de clonar.

### Propias, desde zip (no están en GitHub)

| Skill | De dónde |
|---|---|
| `cavernicola` | `Downloads\cavernicola.zip` (traducción de `ultracave`, con su `LICENSE` y `NOTICE`) |
| `pdf-ligero` | `Downloads\pdf-ligero.zip` |
| `traspaso` | `Downloads\traspaso.zip` |

Cada zip trae una carpeta con el nombre de la skill: descomprimirla dentro de `~/.claude/skills/`.

### Otras

- **`graphify`**: viene del paquete Python `graphifyy` (versión 0.9.71), instalado con `uv tool`. Reinstalar siguiendo el README del paquete.
- **`synced/`**: skills de claude.ai (docs, pdf, xlsx, deep-research…). La app las sincroniza sola con la cuenta; no hay que hacer nada.

## Descartadas

| Skill | Por qué |
|---|---|
| `frontend-design` (Anthropic) | Se pisa con impeccable y design-taste-frontend |
| `kinetic-typography` (iart-ai) | No renta para nuestra forma de trabajar |
| `animation-designer` (`deve1993/quickfy-website`) | El repo ya no existe |
| `css-animations` (`aiskillstore/marketplace`) | Ya no está en el repo; sustituida por `css-development` |
| `threejs-animation` de `datit309/supergraph` | Idéntica a la que ya hay |
