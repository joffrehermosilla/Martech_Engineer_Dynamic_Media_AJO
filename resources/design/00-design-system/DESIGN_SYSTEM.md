# Design System — "Pliego de control"

> Fuente de verdad visual de DAM Platform. Nació del rediseño del login en Claude Design (2026-10-28) y se aplica a todas las pantallas siguientes.
>
> - Tokens: [`tokens.css`](tokens.css)
> - Lámina original de tokens: [`tokens-fuente.html`](tokens-fuente.html)
> - Referencia viva: [`../01-login/fuente/escritorio.html`](../01-login/fuente/escritorio.html)

---

## 1. Idea

Un **pliego técnico**: papel cálido, tinta casi negra, reglas de 1px y **un único acento cobalto** reservado para la acción principal. La interfaz se lee como un documento de control: etapas numeradas, datos en monoespaciada y nada decorativo.

**Producto sin marca corporativa.** Identidad propia: isotipo de 3 rectángulos + wordmark "DAM Platform" + "Agent Hub v2.0" en mono.

## 2. Principios

1. **Un solo acento.** `--accent` solo para el CTA principal, el foco y los enlaces. Todo lo demás se jerarquiza con tamaño, peso, espaciado y reglas.
2. **Reglas, no sombras.** La estructura se dibuja con bordes de 1px `--line`. Sin sombras decorativas, sin degradados, sin glassmorphism.
3. **Esquinas casi rectas.** `--radius: 2px` en todo.
4. **Mono para datos.** Usuarios, IDs, códigos, credenciales, metadatos, contadores y estados técnicos van en IBM Plex Mono.
5. **Etapas numeradas.** El flujo del producto es *01 Generar → 02 Gobernar → 03 Aprobar y publicar*. Los numerales grandes en Plex Sans Condensed son el recurso gráfico principal.
6. **Rol = color + icono + texto.** Nunca solo color.
7. **Sin emojis.** Iconos lineales SVG, `viewBox 0 0 24 24`, `stroke-width 1.75`, `stroke-linecap/linejoin round`, `currentColor`.

## 3. Color

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg` | `#EEECE6` | Fondo general, columnas inactivas |
| `--surface` | `#F8F7F3` | Zona de trabajo activa |
| `--field` | `#FFFFFF` | Campos |
| `--ink-1` / `--line` | `#0E0E0C` | Texto principal, reglas estructurales |
| `--ink-2` | `#4A4943` | Texto secundario (7.6:1) |
| `--ink-3` | `#8A877E` | Solo texto ≥ 24px o decorativo (numerales inactivos) |
| `--line-soft` | `#D6D3CA` | Separadores entre filas |
| `--hover` | `#E3E1DA` | Hover de ítems de navegación y botones fantasma |
| `--scrim` | `rgba(14,14,12,.45)` | Velo bajo la hoja de navegación móvil |
| `--accent` | `#1E3FD0` | CTA, foco, enlaces |
| `--accent-hover` / `--accent-active` / `--accent-busy` | `#1834B4` / `#152E9E` / `#4A63D6` | Estados del CTA |
| `--danger` · `--danger-ink` · `--danger-bg` | `#B42318` · `#8C1D13` · `#FBEAE7` | Error |
| `--success` · `--success-ink` · `--success-bg` | `#1C7C4A` · `#145C37` · `#E6F4EC` | Éxito, aprobado |

### Roles

| Rol | Texto / Fondo | Icono |
| --- | --- | --- |
| ADMIN | `#F8F7F3` / `#0E0E0C` (invertido) | llave |
| MARTECH | `#0B5F6B` / `#DCEEF0` | código `</>` |
| VCD | `#6B3591` / `#EFE5F5` | pluma |
| VIEWER | `#4A4943` / `#E3E1DA` | ojo |

> **Pendiente de definir** en próximas pantallas: color de **advertencia / REVIEW_REQUIRED** (la gobernanza devuelve ALLOW / DENY / REVIEW_REQUIRED) y estados de asset (borrador, pendiente, aprobado, rechazado, publicado). Deben derivar de esta paleta, sin competir con `--accent`.

## 4. Tipografía

| Familia | Pesos | Uso |
| --- | --- | --- |
| IBM Plex Sans | 400–700 | UI, títulos, cuerpo |
| IBM Plex Mono | 400–600 | Datos, credenciales, etiquetas técnicas, metadatos |
| IBM Plex Sans Condensed | 500–600 | Numerales de etapa (96px escritorio / 48px láminas) |

Escala usada: numeral 96 · H1 32 (móvil 26) · H2 24 · cuerpo 15–16 · etiqueta 14/600 · mono meta 12–13 · tag de rol 11/600 con `letter-spacing .06em`.

Las etiquetas de formulario van en **sentence case** (no en mayúsculas).

## 5. Componentes (definidos en el login)

| Componente | Especificación |
| --- | --- |
| **Header** | 72px (móvil 56px), borde inferior `--line`. Izquierda: isotipo + "DAM Platform" 18/700 + separador `--line-mid` + "Agent Hub v2.0" mono 12. Derecha: meta en mono 12 `--ink-2`. |
| **Footer** | 48px, borde superior `--line`, mono 12 `--ink-2`, dos extremos. |
| **Columna de etapa** | Padding 40px, borde derecho `--line`. Fila "Etapa →" mono 12, numeral 96px, H2, descripción 15px `--ink-2`, "Responsable · …" mono 12 al pie. La etapa activa usa `--surface`, numeral en `--ink-1` y chip invertido "Responsable · usted". |
| **Input** | Alto 52px, fondo `--field`, borde 1px `--ink-1`, radio 2px, texto mono 16px, icono lineal a la izquierda (padding-left 48px). Foco: borde `--accent` + `--focus-ring`. Error: borde y anillo `--danger`. Deshabilitado: `--field-disabled`. |
| **Botón ver contraseña** | 44×44 dentro del input, `aria-pressed`, `aria-label` "Mostrar/Ocultar contraseña". |
| **Botón primario** | Alto 56px, `--accent`, texto blanco 16/600, icono flecha a la derecha. Hover/active/disabled con los tokens. En carga: spinner + "Verificando…", `cursor: progress`. Foco: outline 2px `--ink-1`, offset 3px. |
| **Alerta** | Padding 14×16, borde 1px, icono 18px, texto 14px. Error: `--danger-bg` / `--danger` / `--danger-ink`, `role="alert"`. Éxito: `--success-bg` / `--success` / `--success-ink`, `role="status"`. |
| **Panel plegable** | `<details>` con regla superior `--line`, summary mono 13 de 52px y chevron que rota 180°. |
| **Fila de lista** | Grid, alto mínimo 48px, separador `--line-soft`, hover `--bg`, texto mono 14. |
| **Tag de rol** | Mono 11/600, padding 5×8, radio 2px, icono 12px + texto. Colores en §3. |
| **Stepper móvil** | `<ol>` de 3 columnas bajo el header; el paso actual va invertido (`--ink-1` de fondo) con `aria-current="step"`. |

### 5.1 Componentes del shell (añadidos desde `02-shell`)

| Componente | Especificación |
| --- | --- |
| **Header de app** | 64px, fondo `--bg`, borde inferior `--line`. Marca a la izquierda (17px/700). A la derecha: Vista ▾ · campana · tag de rol · separador vertical 1px `--line-mid` de 28px · Cerrar sesión. |
| **Navegación lateral** | 264px, fondo `--bg`, borde derecho `--line`, padding 20×12, 20px entre grupos. |
| **Rótulo de grupo** | Mono 12/500 `--ink-2`, padding 0 12px. Grupos: `01 · Generar`, `02 · Gobernar`, `03 · Aprobar y publicar`, `Herramientas`, `Configuración`, `Administración`. |
| **Ítem de navegación** (`.tab-btn`) | Alto ≥ 44px, icono 18px `--ink-2` + texto 14/500. Hover: `--hover`. **Activo:** fondo `--field`, 600, borde interior 1px `--line`, barra izquierda de 4px `--accent` e icono en `--accent`, con `aria-current="page"`. Foco: outline 2px `--accent`, offset -2px. |
| **Enlace externo en la navegación** | Mono 12 `--ink-2`, sangrado 46px, icono ↗. |
| **Botón icono** | 44×44, transparente; hover `--hover`; foco outline `--accent`. |
| **Contador** | En la esquina del botón icono: 20×18, fondo `--ink-1`, texto `--surface` mono 11/600. Se oculta cuando es 0. |
| **Vista ▾** | Botón fantasma de 44px: "Vista" en mono 12 `--ink-2` + nombre del perfil 14/500 + chevron. |
| **Tag de rol (header)** | Alto 32px, mono 12/600, `letter-spacing .04em`, icono + "ROL — usuario", colores de §3. |
| **Botón secundario** | Alto 44px, borde 1px `--ink-1`, transparente, 14/600. Hover invertido (`--ink-1` de fondo y texto `--surface`). |
| **Cabecera de página** | Etapa en mono 12 `--ink-2` + H1 32px/600 (móvil 26px), regla inferior `--line`, padding-bottom 24px. |
| **Toast** | 420px abajo a la derecha (móvil: 16px a cada lado y 24px del borde inferior), mismos colores que la alerta. Icono 18px por `::before`. Dura 3,5 s. |
| **Header móvil** | Dos filas: 56px (marca + botón Menú) y 48px (tag de rol, campana, vista y salir como botones icono), separadas por `--line-soft`. |
| **Hoja de navegación móvil** | Panel inferior, fondo `--bg`, regla superior `--line`, máx. 640px, cabecera "N secciones · Perfil" en mono. Velo `--scrim`. El botón Menú se invierte cuando está abierta y cambia a "Cerrar". |

## 6. Layout

- **Escritorio (login):** header / contenido / footer en columna a pantalla completa. Contenido en grid de columnas separadas por reglas de 1px. La zona de trabajo activa va en `--surface` y el resto en `--bg`.
- **Escritorio (app):** header 64px + [navegación lateral 264px | contenido en `--surface` con padding 40×48]. Dentro del contenido: cabecera de página y luego paneles blancos (`--field`) con borde `--line-soft`.
- **Móvil (≤ 375px):** header 56px, stepper horizontal (login) o header de 2 filas + hoja de navegación (app), con el contenido apilado y 16–20px de margen lateral.
- Contenido de formulario con ancho máximo de ~460px.

## 7. Accesibilidad

- Contraste AA mínimo (`--ink-2` da 7.6:1). `--ink-3` nunca para texto pequeño.
- Foco siempre visible: anillo `--accent` en campos y outline en botones.
- Áreas táctiles ≥ 44px. `aria-invalid` + `aria-describedby` hacia la alerta en los campos con error.
- `prefers-reduced-motion`: sin transiciones y el spinner más lento.

## 8. Implementación

- La app es **HTML + CSS + JS vanilla** (`agent-hub/public/index.html`). Los diseños de Claude Design llegan como componentes "DC" (plantillas `{{…}}` + clase `DCLogic` sobre React). **No se copia ese runtime**: se traduce el marcado a HTML estático y se conecta a las funciones existentes (`doLogin()`, `switchTab()`, etc.).
- Los estilos inline de Claude Design se convierten en clases que usan las variables de `tokens.css`.
- **Tema:** el sistema es claro. La migración es **progresiva**: conviven partes claras (login, shell) y oscuras (contenido aún sin migrar).
- **Ámbito de los tokens durante la migración:** no viven en `:root` (pisarían las variables antiguas del dashboard). Están declarados en `#loginModal` y en `.app, #toast`. Dentro de `#mainContent` se **restauran los tokens antiguos** (bloque "Contenido aún sin migrar" en `index.html`) y `.section-head` se pinta como franja clara. Al migrar una sección, sus estilos deben usar los tokens nuevos; cuando estén todas, los tokens pasan a `:root` y se borra ese bloque.

## 9. Cómo usarlo en cada nueva pantalla

1. Adjuntar a Claude Design este archivo + `tokens.css` + una captura del login rediseñado.
2. Usar el prompt de la carpeta de la pantalla (`resources/design/NN-nombre/prompt.md`).
3. Guardar lo que devuelva Claude Design en la misma carpeta.
4. Si la pantalla introduce un componente o token nuevo, **añadirlo aquí** (§3 o §5).
