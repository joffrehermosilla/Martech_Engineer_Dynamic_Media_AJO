# Prompt para Claude Design — Shell de la app (header + navegación)

> ✅ **Usado.** Resultado en `claude-design-bundle.html` y `fuente/`; revisión en [`REVISION.md`](REVISION.md). Nota: aquí dice MARTECH 5, pero en realidad ve 6 (ver hallazgo en la revisión).

> **Adjuntar junto al prompt:**
>
> 1. `resources/design/00-design-system/DESIGN_SYSTEM.md`
> 2. `resources/design/00-design-system/tokens.css`
> 3. Captura del login rediseñado (`resources/design/01-login/`)
> 4. Captura del header + pestañas actuales (opcional, solo como referencia de contenido)
>
> Código fuente actual: `agent-hub/public/index.html` (HEADER líneas ~692-720, NAV TABS ~722-733, `showApp()` / `switchTab()` / `doLogout()` / `toggleViewInfo()` / `showToast()` / `loadNotifications()`).

---

## Prompt

Diseña el **shell** de la aplicación **DAM Platform — Agent Hub v2.0**: el marco persistente que el usuario ve después de iniciar sesión (cabecera, navegación entre secciones y notificaciones toast). Es la continuación directa del login que ya diseñaste.

**Usa estrictamente el design system "Pliego de control" adjunto** (`DESIGN_SYSTEM.md` + `tokens.css`): papel `#EEECE6` / `#F8F7F3`, tinta `#0E0E0C`, reglas de 1px, radio 2px, IBM Plex Sans / Mono / Sans Condensed, un único acento cobalto `#1E3FD0` y roles con color + icono + texto. No inventes paleta nueva. Si necesitas un token o componente que no existe, propónlo explícitamente y derívalo de la paleta. Sin marca corporativa ni emojis.

### Contexto

Después del login, cada usuario ve solo las secciones que permite su rol. El producto sigue el flujo **01 Generar → 02 Gobernar → 03 Aprobar y publicar**, y la navegación debería reflejarlo en vez de ser una lista plana de 9 pestañas.

Secciones y quién las ve:

| Sección (id) | Texto actual | Roles | Etapa sugerida |
| --- | --- | --- | --- |
| `governance` | Gobernanza | ADMIN, MARTECH | 02 Gobernar |
| `photocraft` | PhotoCraft Studio | ADMIN, VCD | 01 Generar |
| `catalog` | Catálogo DAM | todos | 03 Publicar |
| `providers` | Agentes IA | ADMIN, MARTECH | Configuración |
| `flow` | Flow Studio | ADMIN, MARTECH, VCD | Herramientas |
| `notifications` | Aprobaciones | ADMIN, MARTECH | 03 Aprobar |
| `connections` | Conexiones | ADMIN | Configuración |
| `admin` | Admin Panel | ADMIN | Administración |
| `places` | Geo Context | ADMIN, MARTECH | 01 Generar |

Número de secciones visibles por rol: ADMIN 9 · MARTECH 5 · VCD 3 · VIEWER 2. El diseño debe verse bien **con 2 y con 9**.

### Lo que no funciona hoy

- Cabecera con el bloque "BCP MARTECH" y un subtítulo técnico largo ("Orquestación de Activos • Gobernanza Mongo Atlas • PhotoCraft Engine").
- 9 pestañas horizontales con emojis, sin agrupación ni relación con el flujo.
- El badge de rol hace de botón de "Salir" sin parecerlo.
- Un botón naranja "Flow Studio" en la cabecera duplica la pestaña Flow Studio.

### Libertad de diseño

- Puedes elegir **barra lateral** o **navegación superior**, siempre que agrupe las secciones por etapa del flujo / configuración / administración, y que los grupos sin secciones visibles para el rol desaparezcan.
- Puedes reordenar las secciones y renombrarlas si mejora la claridad (indica el mapeo nombre nuevo → id).
- La identidad de la cabecera es la del login: isotipo + "DAM Platform" + "Agent Hub v2.0" en mono.

### Contrato técnico — NO se puede romper

El JS existente no se reescribe; el HTML final debe exponer exactamente esto:

| Elemento | Requisito |
| --- | --- |
| Cabecera | `id="mainHeader"`. Oculta al cargar; el JS hace `style.display = "flex"`. |
| Navegación | `id="mainNav"`. Oculta al cargar; el JS hace `style.display = "flex"` (vale `flex-direction: column` si es lateral). |
| Contenido | `<main id="mainContent">`, cuyos hijos directos son `<section id="tab-…">`. El JS hace `style.display = "block"` en la activa y `"none"` en las demás. Diseña solo el marco: el contenido de cada sección se diseñará después. |
| Ítems de navegación | Un `<button class="tab-btn" data-tab="ID" data-roles="ROLES" onclick="switchTab('ID')">` por sección, con los ids y roles de la tabla. El JS añade/quita la clase `active` y oculta los no permitidos con `style.display = "none"`. Los encabezados de grupo deben ocultarse si todos sus ítems lo están (propón el mínimo JS o CSS para ello y dilo). |
| Vista actual | `<span id="viewLabel">`: el JS escribe el nombre del perfil ("Administrador", "Martech Engineer", "Visual Content Designer", "Viewer"). Su contenedor llama a `toggleViewInfo()` al hacer clic (muestra un toast con las secciones permitidas). |
| Notificaciones | Un control que llama a `switchTab('notifications')` y contiene `<span id="notifCount">`. El JS escribe el número y alterna `style.display` entre `"flex"` y `"none"`. |
| Rol y sesión | Contenedor `id="roleBadge"`: el JS le asigna `className = "role-badge ROL"` (ROL = ADMIN, MARTECH, VCD o VIEWER). Dentro: `<span id="roleIcon">` (el JS escribe un **emoji**: ocúltalo con CSS y pinta el icono del rol con CSS según la clase) y `<span id="roleLabel">` (el JS escribe "ROL — usuario"). Separa **Cerrar sesión** como acción propia que llame a `doLogout()` (el JS pide confirmación nativa y recarga). |
| Flow Studio externo | Un enlace a `/flow_studio/index.html` con `target="_blank"` (puede ser secundario). |
| Toast | `<div id="toast">`. El JS escribe el texto y pone `className = "show success"` o `"show error"`; a los 3,5 s lo vacía. Diseña ambos estados con los tokens de éxito y error. |
| Tecnología | HTML + CSS puro con las variables de `tokens.css`; sin frameworks ni JS nuevo salvo el mínimo que declares. Todo en español. |

### Qué quiero ver

1. **Dos direcciones** de navegación (por ejemplo, lateral agrupada por etapas vs. superior con stepper de etapas), ambas dentro del sistema.
2. Para la recomendada, el shell **con cada rol**: ADMIN (9 secciones), MARTECH (5), VCD (3) y VIEWER (2), con la sección activa marcada.
3. Estados: ítem activo, hover, foco con teclado, campana con contador (0 y 12), toast de éxito y toast de error.
4. **Móvil 375px**: cómo se navega (menú, hoja inferior o stepper), con el contrato intacto.
5. Para la recomendada: **HTML + CSS final** del shell con una sección de contenido vacía de ejemplo, más la lista de tokens o componentes nuevos que añadas al design system.

### Criterios de calidad

- Contraste AA, foco visible, áreas táctiles ≥ 44px y navegación completa con teclado (`aria-current="page"` en el ítem activo).
- El acento cobalto se reserva para el estado activo o la acción principal; no lo uses en todos los ítems.
- Reglas de 1px y nada de sombras ni degradados, coherente con el login.
- Al final, una lista de **qué cambia respecto al contrato técnico**, si cambia algo.
