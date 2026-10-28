# Entendimiento del Proyecto — Martech Engineer Dynamic Media AJO

> Documento vivo: se actualiza a medida que avanzamos. La sección **Bitácora** al final registra cada avance con fecha.
>
> **Última actualización:** 2026-10-28

---

## 1. Qué es, en una frase

Una plataforma de prueba para un banco (BCP) donde **una IA genera/edita piezas gráficas de marketing**, un **motor de reglas verifica que cumplan las políticas de marca**, un **humano aprueba**, y las imágenes aprobadas se entregarían vía **Adobe AEM Assets / Dynamic Media** a canales como Journey Optimizer, WhatsApp o páginas web.

---

## 2. El repo son dos proyectos distintos

### 2.1 Parte Node.js — donde está el trabajo real

| Carpeta | Qué hace |
|---|---|
| `agent-hub/` | Servidor Express (puerto 3000) con dashboard web: login por roles (ADMIN / MARTECH / VCD / VIEWER), catálogo de assets, aprobaciones, panel admin. |
| `agent-hub/services/providerRouter.mjs` | Pide textos a varias IAs en cascada (Groq → Gemini → OpenAI → DeepSeek) y rota API keys si una se queda sin cuota (429). |
| `agent-hub/services/governanceEngine.mjs` | Revisa contra **MongoDB Atlas** que un brief no use frases prohibidas ("100% garantizado", etc.). Responde `ALLOW` / `DENY` / `REVIEW_REQUIRED`. |
| `agent-hub/services/authService.mjs` · `adminService.mjs` | Login JWT, roles/permisos, CRUD de usuarios, políticas, squads, API keys. |
| `agent-hub/services/photocraftAdapter.mjs` | Puente hacia PhotoCraft. Si no existe el binario Rust compilado, usa un **modo sandbox de respaldo**. |
| `agent-hub/services/placesService.mjs` | Enriquecimiento geográfico con Google Places / Adobe Places. |
| `mcp-server/` | Servidor MCP por stdin/stdout. Expone esas herramientas a agentes como Claude o Cursor. |
| `photocraft/` | Motor de edición de imágenes en **Rust** (recorte, watermark, compresión…). |
| `flow_studio/` | Genera diagramas HTML interactivos de los flujos (documentación). |
| `resources/` | Material de referencia y diagramas HTML. |

### 2.2 Parte AEM (Java / Maven) — por ahora es plantilla

`core/`, `ui.apps/`, `ui.apps.structure/`, `ui.config/`, `ui.content/`, `ui.frontend/`, `dispatcher/`, `all/`, `it.tests/`, `ui.tests/` son un **proyecto generado con el AEM Archetype de Adobe**.

- El Java de `core/` es el de ejemplo (`HelloWorldModel`, `SimpleServlet`, `SimpleScheduledTask`, `LoggingFilter`, `SimpleResourceListener`). No hay lógica de negocio propia.
- `ui.apps` contiene los Core Components estándar.
- **Aún no hay nada que conecte AEM con el Agent Hub.**

---

## 3. Flujo de negocio esperado

```
Usuario pide pieza  →  Router IA genera brief  →  Gobernanza (MongoDB) valida
      →  PhotoCraft edita imagen (sandbox)  →  Humano aprueba (MARTECH)
      →  [futuro] se sube a AEM DAM  →  Dynamic Media la entrega por CDN
      →  AJO / WhatsApp / AEM Sites la consumen
```

---

## 4. Cómo se despliega cada parte

### 4.1 Agent Hub (Node)

**Local:**
```bash
cp .env.example .env.local     # rellenar MONGODB_URI y al menos una API key de IA
npm install
npm run seed                   # carga iniciativas y mandamientos en MongoDB Atlas
npm start                      # → http://localhost:3000
npm run mcp                    # (opcional) servidor MCP para agentes
```

Usuarios demo (según `HANDOFF_v2_2026-10-21.md`):

| Usuario | Contraseña | Rol |
|---|---|---|
| admin | Admin2026! | ADMIN |
| martech1 | Martech2026! | MARTECH |
| designer1 | Design2026! | VCD |
| viewer1 | View2026! | VIEWER |

URLs útiles:
- Dashboard: http://localhost:3000
- Flow Studio: http://localhost:3000/flow_studio/index.html
- Health: http://localhost:3000/api/health

**Docker:**
```bash
docker compose up --build -d    # expone :3000, lee .env.local
```

**Despliegue remoto:** ❌ No existe. El workflow `.github/workflows/docker-build-push.yml` solo **construye** la imagen para validar (`push: false`). No publica en Docker Hub ni en ningún servidor.

### 4.2 AEM (Java)

- **Producción:** vía **Adobe Cloud Manager** (Full Stack Pipeline). Requiere un programa AEM as a Cloud Service con licencia (cuenta corporativa). No hay evidencia de que exista uno conectado.
- **Local:** requiere descargar el **AEM SDK (Quickstart)** y luego:
  ```bash
  mvn clean install -PautoInstallSinglePackage
  ```

---

## 5. Discrepancias encontradas (README vs. realidad)

| README dice | Realidad |
|---|---|
| La imagen Docker incluye "AEM + Node.js + PhotoCraft" | El `Dockerfile` solo tiene Node. No compila Rust → PhotoCraft siempre en modo fallback dentro del contenedor. |
| GitHub Actions publica en Docker Hub | `push: false`: solo valida que la imagen compila. |
| AEM integrado con el Hub | La parte AEM es la plantilla del archetype, sin integración. |

---

## 6. Estado del entorno local (Mac)

| Herramienta | Requerido | Estado |
|---|---|---|
| Node.js | ≥ 20 | ✅ v26.4.0 |
| `node_modules` | `npm install` | ✅ Instalados |
| `.env.local` | Con `MONGODB_URI` + API keys | ❌ No existe (la app cae en una URI de Atlas escrita en el código) |
| Java | 21 (`.cloudmanager/java-version`) | ⚠️ Tienes 26 |
| Maven | 3.9+ | ❌ No instalado |
| Docker | Opcional | ✅ Instalado |
| Rust / cargo | Solo para compilar PhotoCraft | ❌ No instalado |
| AEM SDK | Solo para probar AEM en local | ❌ No instalado |

---

## 6.1 Inventario de pantallas (UI) y estado del rediseño

Diseños, prompts y design system en `resources/design/` (ver su `README.md`): `00-design-system/` + una carpeta por vista (`01-login/` … `12-flow-studio-standalone/`).

Todo vive en `agent-hub/public/index.html` (una sola página; las "pantallas" son pestañas filtradas por rol), salvo Flow Studio standalone.

| # | Pantalla | Ubicación | Roles | Rediseño |
| --- | --- | --- | --- | --- |
| 0 | Login | `#loginModal` | todos | ✅ Integrado |
| 1 | Shell: header + navegación lateral | `#mainHeader`, `#mainNav` | todos | ✅ Integrado |
| 2 | Gobernanza (validar briefs) | `#tab-governance` | ADMIN, MARTECH | ⬜ |
| 3 | PhotoCraft Studio (editar imagen, preview, enviar a aprobación) | `#tab-photocraft` | ADMIN, VCD | ⬜ |
| 4 | Catálogo DAM | `#tab-catalog` | todos | ⬜ |
| 5 | Agentes IA (proveedores) | `#tab-providers` | ADMIN, MARTECH | ⬜ |
| 6 | Flow Studio (embebido) | `#tab-flow` | ADMIN, MARTECH, VCD | ⬜ |
| 7 | Aprobaciones | `#tab-notifications` | ADMIN, MARTECH | ⬜ |
| 8 | Conexiones a DBs externas | `#tab-connections` | ADMIN | ⬜ |
| 9 | Admin Panel: Usuarios · Políticas DAM · Squads · API Keys · Generador de códigos | `#tab-admin` (5 sub-pestañas) | ADMIN | ⬜ |
| 10 | Geo Context (Places) | `#tab-places` | ADMIN, MARTECH | ⬜ |
| 11 | Flow Studio standalone | `flow_studio/public/index.html` | — | ⬜ |

---

## 7. Documentos de referencia en el repo

- `HANDOFF_v2_2026-10-21.md` — estado más reciente (v2: roles, APIs, Flow Studio).
- `HANDOFF_Martech_Engineer_Dynamic_Media_AJO_2026-10-17.md` — handoff v1.
- `ARRANQUE_PROYECTO_AEM_DYNAMIC_MEDIA_AJO.md` — notas de arranque.
- `README.md` — visión general (ver discrepancias en §5).
- `AGENTS.md` — guía del proyecto AEM y comandos Maven.

---

## 8. Próximos pasos

- [ ] `npm install`
- [ ] Verificar/crear `.env.local` con `MONGODB_URI` y al menos una API key de IA
- [ ] `npm run seed` y levantar `npm start`
- [ ] Recorrer el dashboard con cada rol
- [x] Prompt de rediseño del login para Claude Design
- [x] Recibir diseño del login y extraer el design system "Pliego de control"
- [x] Aplicar el rediseño del login y del shell en `agent-hub/public/index.html` (rama `feat/ui-login-shell`)
- [ ] Probar login + shell con el servidor real (requiere `.env.local` / MongoDB)
- [x] Pasar el prompt del shell a Claude Design y revisar el resultado (`resources/design/02-shell/REVISION.md`)
- [ ] Decidir quién manda en los permisos de MARTECH sobre `places` (front `data-roles` vs. `authService.mjs`)
- [ ] Prompt de la siguiente pantalla
- [ ] (Más adelante) Instalar Java 21 + Maven y compilar la parte AEM
- [ ] (Más adelante) Decidir cómo/dónde desplegar el Agent Hub

---

## 9. Bitácora

| Fecha | Avance |
|---|---|
| 2026-10-28 | Análisis inicial del repo: identificadas las dos mitades (Node real vs. AEM plantilla), cómo se despliega cada una, discrepancias del README y estado del entorno local. Creado este documento. |
| 2026-10-28 | Rediseño del login: prompt para Claude Design en `resources/design/01-login/prompt.md` (basado en `agent-hub/public/index.html`, bloque MODAL LOGIN). Pendiente: traer el diseño y aplicarlo al HTML. |
| 2026-10-28 | Prompt v2: paleta y estilo libres (se puede retar el diseño actual); se añade un **contrato técnico** con los IDs, `onclick` y comportamientos que el JS necesita (`loginModal`, `loginUsername`, `loginPassword`, `loginBtn`, `loginError`, `doLogin()`, `fillDemo()`). |
| 2026-10-28 | Prompt v3: el login **no lleva branding BCP** ni de ningún banco; identidad neutral propia del producto ("DAM Platform"). |
| 2026-10-28 | Inventario de pantallas añadido (§6.1): 11 pantallas además del login. |
| 2026-10-28 | Recibido el login de Claude Design (dirección "C · Pliego de control": tema claro de papel y tinta, acento cobalto `#1E3FD0`, IBM Plex). Bundle desempaquetado en `resources/design/01-login/fuente/`. Creados el design system (`resources/design/00-design-system/DESIGN_SYSTEM.md` + `tokens.css`), una carpeta por vista y el prompt del shell (`02-shell/prompt.md`). El diseño del login usa su propia lógica de demo: al integrarlo hay que conectarlo a los IDs y funciones reales. |
| 2026-10-28 | Decisión: el usuario genera el shell en Claude Design con `02-shell/prompt.md`. La paleta (tema claro vs. oscuro, colores de REVIEW_REQUIRED y estados de asset) queda **pendiente** para revisar después. Integración del login en espera. |
| 2026-10-28 | Shell recibido de Claude Design: navegación lateral agrupada por etapas (01 Generar · 02 Gobernar · 03 Aprobar y publicar · Herramientas · Configuración · Administración), cabecera de página, toasts y hoja de navegación móvil. Guardado en `resources/design/02-shell/` (bundle + `fuente/` + `REVISION.md`). Componentes y tokens (`--hover`, `--scrim`, medidas del shell) añadidos al design system. Hallazgo: MARTECH ve 6 secciones en el front pero `authService.mjs` le asigna 5 (sin `places`). |
| 2026-10-28 | ⚠️ Seguridad: `agent-hub/services/governanceEngine.mjs:10` tiene una URI de MongoDB Atlas **con usuario y contraseña** como valor por defecto, y está en el historial de git. Sin `.env.local`, la app usa ese cluster. Pendiente: crear `.env.local` propio, quitar la credencial del código y rotarla. `node_modules` ya instalado. |
| 2026-10-28 | Decisión: el rediseño de UI será **progresivo** (conviven partes claras y oscuras). Recibido `resources/design/02-shell/shell-C.html`: HTML + CSS + JS final del shell, listo para integrar. Revisión en `02-shell/REVISION.md` (v2): un ajuste importante (choque de tokens con las secciones antiguas) que se resuelve al integrar. |
| 2026-10-28 | **Integrados login y shell** en `agent-hub/public/index.html`, rama `feat/ui-login-shell`, a partir de `login-modal-C.html` y `shell-C.html`. Fuentes IBM Plex añadidas; CSS antiguo del login, header, pestañas y toast reemplazado; tokens nuevos acotados a `#loginModal` y `.app/#toast`; tokens oscuros restaurados en `#mainContent` para el contenido sin migrar; cabecera de sección (etapa + título) en las 9 secciones; textos sin emojis en el botón de login y el toast de bienvenida; `toggleViewInfo()` muestra nombres legibles. Verificado con capturas (Chrome headless, sesión simulada sin tocar la base de datos): login escritorio/móvil/error, shell ADMIN/VCD/MARTECH, móvil con menú y toasts. Pendiente: prueba con servidor real. |
