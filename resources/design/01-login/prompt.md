# Prompt para Claude Design — Rediseño del Login (Agent Hub v2.0)

> ✅ **Usado.** Resultado: dirección "C · Pliego de control" → `claude-design-bundle.html` y `fuente/`. Dio origen al design system (`../00-design-system/`).

> Adjuntar junto al prompt: captura actual del login.
>
> Código fuente de la pantalla: `agent-hub/public/index.html` (bloque `MODAL LOGIN`, líneas ~645-690; estilos `:root` líneas ~12-35; lógica `init()` / `showLogin()` / `fillDemo()` / `doLogin()` líneas ~1195-1310).

---

## Prompt

Rediseña desde cero la pantalla de login de una plataforma interna llamada **DAM Platform — Dynamic Media & AJO Agent Hub v2.0**. **No debe llevar marca de ninguna empresa ni banco**: es un producto con identidad propia y neutral. Adjunto la captura de la versión actual **solo como referencia de contenido**: no tienes que respetar su estética. Puedes y debes **retarla**: otra paleta, otra tipografía, otro layout, otra composición. Lo único intocable es el **contrato técnico** descrito más abajo.

### Contexto del producto

Es la puerta de entrada a un hub donde agentes de IA generan y editan piezas gráficas de marketing, un motor de gobernanza valida que cumplan las políticas de marca de la organización y un humano las aprueba antes de publicarlas en Adobe Dynamic Media. Lo usan perfiles internos: administradores, ingenieros Martech, diseñadores (VCD) y observadores. Debe transmitir **confianza, control y precisión técnica**. No debe parecer un SaaS genérico, una plantilla de dashboard "dark + neón" ni un juego.

### Lo que no funciona hoy (para que no lo repitas)

- Tarjeta centrada sobre un fondo casi negro, con mucho espacio vacío desaprovechado.
- El "logo" es un rectángulo con degradado azul→naranja y el texto "BCP MARTECH": se ve improvisado y además ata el producto a una marca concreta. **Elimínalo.**
- El subtítulo se parte mal ("Hub v2.0" queda huérfano en la segunda línea).
- Las etiquetas USUARIO / CONTRASEÑA en mayúsculas gritan más que el contenido.
- Los emojis (🔐, 👤) se ven distintos en cada sistema y restan seriedad.
- El bloque de cuentas demo tiene casi el mismo peso visual que el formulario y compite con el botón principal.
- No están diseñados los estados: foco, error, cargando ni contraseña visible/oculta.

### Libertad creativa

- **Paleta libre.** La actual (fondo `#05080E`, azul `#002A8F`, naranja `#FF7800`, tipografías Archivo + JetBrains Mono) es solo el punto de partida. Propón otra si la justificas: tema claro, oscuro cálido, monocromo con un acento, lo que mejor comunique "gobernanza confiable".
- La paleta se entrega como **tokens CSS** (`--bg`, `--surface`, `--ink-1`, `--accent`, `--danger`, etc.) pensados para extenderse después al resto del dashboard, no solo al login.
- **Colores de rol libres**, con una condición: los 4 roles (ADMIN, MARTECH, VCD, VIEWER) deben distinguirse entre sí a simple vista y con contraste AA. No dependas solo del color: añade también texto o icono.
- Layout, tipografía e iconografía libres.
- **Sin branding corporativo**: nada de BCP, ningún banco ni los colores institucionales de una empresa real. La identidad es la del propio producto: un wordmark tipográfico o un isotipo sencillo para "DAM Platform" (o "Agent Hub"), diseñado por ti.

### Contrato técnico — NO se puede romper

El HTML final se inserta en una página existente cuya lógica JavaScript **no se va a reescribir**. Por eso deben existir exactamente estos elementos y comportamientos:

| Elemento / comportamiento | Requisito |
| --- | --- |
| Contenedor del login | `id="loginModal"`. El JS lo muestra con `style.display = "flex"` y lo oculta con `"none"`. Debe verse bien en display flex y cubrir toda la ventana (es un overlay sobre la app). |
| Campo usuario | `<input id="loginUsername" type="text" autocomplete="username">` |
| Campo contraseña | `<input id="loginPassword" type="password" autocomplete="current-password">`. Pulsar **Enter** en este campo envía el formulario (listener ya existente). El botón de "ver contraseña" solo alterna `type` entre `password` y `text`. |
| Botón principal | `id="loginBtn"`, `onclick="doLogin()"`. **Atención:** el JS sobrescribe su `textContent` con "⏳ Verificando..." mientras carga y lo pone en `disabled`; luego lo restaura. Diseña el estado cargando apoyándote en `:disabled` y piensa que el contenido del botón se reemplaza como texto plano. Si quieres icono o spinner, ponlo con CSS (`::before`) o propón el mínimo cambio en el JS y dilo explícitamente. |
| Contenedor de error | `id="loginError"`, oculto por defecto. El JS le pone `style.display = "block"` y `textContent` con el mensaje. Mensajes reales: "Ingrese usuario y contraseña.", "Usuario no encontrado.", "Contraseña incorrecta.", "Usuario deshabilitado. Contacte al administrador.", "Error de conexión: …". |
| Cuentas demo | 4 elementos clicables con `onclick="fillDemo('usuario','contraseña')"`: `admin / Admin2026!` (ADMIN), `martech1 / Martech2026!` (MARTECH), `designer1 / Design2026!` (VCD), `viewer1 / View2026!` (VIEWER). Deben seguir visibles y a un clic, pero como algo **secundario** (por ejemplo, un panel "Modo demo" plegable o chips discretos). |
| Idioma | Todo el texto en **español**. |
| Tecnología | **HTML + CSS puro** con variables CSS, sin frameworks ni dependencias JS nuevas. Fuentes solo de Google Fonts. |

Al hacer login, la API (`POST /api/auth/login`) devuelve el usuario y su rol, el modal se oculta y aparece la app. **Nada de ese flujo cambia**: el rediseño es solo de presentación.

### Qué quiero ver

1. **Dos o tres direcciones claramente distintas**, cada una con su paleta, por ejemplo:
   - **A:** evolución sobria de la tarjeta centrada, con una paleta nueva.
   - **B:** pantalla dividida en escritorio. Un panel de marca que cuente en 3 pasos qué hace la plataforma (Generar → Gobernar → Publicar), sin ilustraciones genéricas, y el formulario al lado.
   - **C:** una apuesta que te parezca más fuerte, aunque se aleje mucho de lo actual.
2. Por cada dirección, los estados: **reposo, foco en el input, error, cargando (botón deshabilitado)** y **contraseña visible**.
3. Versión **móvil (375px)** de la dirección más fuerte.
4. Iconos lineales coherentes en lugar de emojis (en el HTML estático; el texto que inyecta el JS se queda como está).
5. Para la dirección recomendada, los **tokens CSS** de la paleta y el **HTML + CSS final** del login, respetando el contrato técnico.

### Criterios de calidad

- Contraste AA mínimo, foco visible con teclado, áreas táctiles ≥ 44px y orden lógico de tabulación (Usuario → Contraseña → ver contraseña → Ingresar → cuentas demo).
- Un único color de acento reservado para la acción principal. El resto de la jerarquía se resuelve con tamaño, peso y espaciado.
- Microinteracciones discretas (transición de foco, feedback de carga). Nada de animaciones decorativas, y respeto a `prefers-reduced-motion`.
- Al final, una lista corta de **qué cambia respecto al contrato técnico, si cambia algo** (debería ser nada, o como mucho el mínimo ajuste del botón).
