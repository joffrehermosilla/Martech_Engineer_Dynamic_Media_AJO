# Revisión del shell — Claude Design v1 (2026-10-28)

**Dirección:** navegación **lateral** agrupada por etapas. Claude Design entregó una sola dirección (el prompt pedía dos) y no entregó el HTML + CSS final: el código llega como componente DC y se traduce al integrar.

## Láminas (`fuente/`)

| Archivo | Contenido |
| --- | --- |
| `escritorio-4-roles.html` | Shell 1440×900 con ADMIN (9 secciones), MARTECH (6), VCD (3) y VIEWER (2) |
| `estados-componentes.html` | Ítem de navegación (reposo/hover/activo/foco), campana 0 y 12, vista actual, cerrar sesión, tags de rol, toasts |
| `movil-vcd-toast.html` | Móvil 375 con el menú cerrado y un toast |
| `movil-martech-menu.html` | Móvil 375 con la hoja de navegación abierta |

## Estructura propuesta

- **Header 64px:** isotipo + "DAM Platform" + "Agent Hub v2.0" · a la derecha: Vista ▾, campana, tag de rol, separador y **Cerrar sesión** (botón propio).
- **Navegación lateral 264px:** grupos `01 · Generar` (PhotoCraft Studio, Contexto geográfico) · `02 · Gobernar` (Gobernanza) · `03 · Aprobar y publicar` (Aprobaciones, Catálogo DAM) · `Herramientas` (Flow Studio + enlace "Abrir en pestaña nueva") · `Configuración` (Agentes IA, Conexiones) · `Administración` (Panel de administración). Los grupos vacíos para el rol no aparecen.
- **Cabecera de página:** etapa en mono (p. ej. "03 · Aprobar y publicar") + H1 con el nombre de la sección.
- **Móvil:** header de 2 filas (marca + botón Menú; rol + campana + vista + salir) y la navegación como **hoja inferior** sobre un velo.

## Contrato técnico

| Punto | Estado | Qué hay que hacer al integrar |
| --- | --- | --- |
| `#mainHeader`, `#mainNav`, `#mainContent` + `section#tab-…` | ✅ | Encaja (nav lateral con `flex-direction: column`). |
| `.tab-btn` con `data-tab` / `data-roles` / `switchTab()` | ✅ | — |
| Clase de ítem activo | ⚠️ | El diseño usa `.is-active`; el JS usa `.active`. Se escribe el CSS sobre `.active`. |
| `aria-current="page"` | ⚠️ | El JS no lo pone: 1 línea en `switchTab()`. |
| Ocultar grupos vacíos | ⚠️ | Solo CSS con `:has()`: grupo sin `.tab-btn` visible → `display:none`. Sin JS. |
| Campana oculta para VCD y VIEWER | ⚠️ | Hoy la campana siempre está. Dar `data-roles="ADMIN,MARTECH"` a la campana e incluirla en `filterTabsByRole()` (1 línea). |
| Cabecera de página (etapa + H1) | 🆕 | Elemento nuevo: ~4 líneas en `switchTab()` para escribir etapa y título. |
| `#viewLabel` + `toggleViewInfo()` | ✅ | Opcional: que el toast muestre nombres legibles en lugar de ids. |
| `#notifCount` (`display: flex` / `none`) | ✅ | — |
| `#roleBadge.role-badge.ROL`, `#roleIcon`, `#roleLabel` | ✅ | El emoji de `#roleIcon` se oculta por CSS y el icono va como `::before` según la clase. Ya **no** cierra sesión al hacer clic. |
| `doLogout()` | ✅ | Botón propio "Cerrar sesión" (sigue el `confirm()` nativo). |
| Enlace Flow Studio externo | ✅ | Pasa a la navegación, bajo Herramientas. |
| `#toast.show.success` / `.show.error` | ⚠️ | El JS usa `textContent` (borra cualquier icono interno): el icono va por `::before`. Abajo a la derecha en escritorio y ancho completo en móvil. |
| Menú móvil (hoja + velo) | 🆕 | JS nuevo (~10 líneas): abrir/cerrar con `aria-expanded` y cerrar al cambiar de sección. |

## Renombres

| id | Antes | Ahora |
| --- | --- | --- |
| `places` | Geo Context | Contexto geográfico |
| `admin` | Admin Panel | Panel de administración |

## Hallazgo

**MARTECH ve 6 secciones, no 5.** En el front, `data-roles` de `places` incluye MARTECH, pero en `agent-hub/services/authService.mjs` la lista `tabs` de MARTECH no incluye `places`. El menú lo filtra el front, así que hoy MARTECH ve Geo Context. El diseño refleja lo que pasa realmente (6), pero hay que decidir cuál de las dos fuentes manda.

---

## v2 — `shell-C.html` (HTML + CSS + JS final, 2026-10-28)

Claude Design entregó el código final listo para integrar. Resuelve casi todos los ⚠️ de arriba:

| Punto | Cómo lo resuelve |
| --- | --- |
| Ítem activo | CSS directo sobre `.tab-btn.active`. |
| `aria-current` + grupos vacíos | `MutationObserver` que observa lo que ya hace el JS (no lo modifica), con `:has()` como primera opción. |
| Campana para VCD / VIEWER | Solo CSS: `#mainHeader:has(#roleBadge.VCD) .bell { display:none }`. |
| Cabecera de página | **Estática** dentro de cada `<section>` (`.section-head`); no necesita JS. |
| Emoji de `#roleIcon` y icono del toast | Ocultos y repintados con `mask` SVG por CSS. |
| Menú móvil | Clase `nav-open` en `<body>`; se cierra al elegir sección o al tocar el velo. Corte en 960px. |
| Tokens | Declarados en `.app, #toast` y no en `:root`, para no pisar el dashboard actual. |

### Ajustes al integrar (los hago yo)

1. **Choque de tokens dentro del contenido.** Como los tokens nuevos viven en `.app` y las secciones antiguas están dentro de `.app`, heredarían `--ink-1: #0E0E0C` (texto oscuro) pero conservarían `--surface-card` oscuro: **texto negro sobre tarjetas oscuras**. Solución: restaurar los tokens antiguos en `#mainContent` (y su fondo oscuro) hasta migrar cada sección. La cabecera `.section-head` se pinta con los tokens nuevos.
2. **Quitar el CSS antiguo del shell** que choca: `header {}`, `.brand`, `.badge-bcp`, `.header-right`, `.role-badge*`, `.view-switcher`, `.notif-bell`, `.notif-count`, `.nav-tabs`, `.tab-btn*` y `#toast*` (líneas ~165-285 y ~613-631 de `index.html`).
3. Envolver header + nav + main en `<div class="app">` y no copiar el bloque 5 (stub de previsualización).
4. Añadir `.section-head` a cada una de las 9 secciones existentes.
5. Opcional: `toggleViewInfo()` con nombres legibles en lugar de ids.
