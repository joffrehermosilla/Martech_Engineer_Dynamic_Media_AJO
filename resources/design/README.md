# Diseño — DAM Platform

Una carpeta por vista, más el design system común.

| Carpeta | Vista | Estado |
| --- | --- | --- |
| `00-design-system/` | Design system "Pliego de control" (tokens, componentes, reglas) | ✅ v1 login + componentes del shell |
| `01-login/` | Login | ✅ Integrado (`login-modal-C.html`) |
| `02-shell/` | Header + navegación lateral | ✅ Integrado (`shell-C.html`, ver `REVISION.md`) |
| `03-gobernanza/` | Gobernanza | ⬜ |
| `04-photocraft/` | PhotoCraft Studio | ⬜ |
| `05-catalogo/` | Catálogo DAM | ⬜ |
| `06-agentes-ia/` | Agentes IA | ⬜ |
| `07-flow-studio/` | Flow Studio (embebido) | ⬜ |
| `08-aprobaciones/` | Aprobaciones | ⬜ |
| `09-conexiones/` | Conexiones | ⬜ |
| `10-admin/` | Admin Panel (5 sub-pestañas) | ⬜ |
| `11-geo-context/` | Geo Context | ⬜ |
| `12-flow-studio-standalone/` | Flow Studio independiente | ⬜ |

## Contenido de cada carpeta de vista

- `prompt.md` — prompt para Claude Design (contexto, contrato técnico, entregables).
- `claude-design-bundle.html` — export tal cual de Claude Design (bundle comprimido; se abre en el navegador).
- `fuente/` — HTML legible extraído del bundle, para revisar.
- `*-C.html` — HTML + CSS + JS final que entrega Claude Design para integrar (pedírselo siempre en este formato).
- `REVISION.md` — revisión contra el contrato técnico y qué ajustar al integrar.

## Flujo por vista

1. Prompt (`prompt.md`) + adjuntar `00-design-system/DESIGN_SYSTEM.md`, `tokens.css` y la captura del login.
2. Guardar el export de Claude Design en la carpeta de la vista.
3. Claude extrae la fuente, revisa el contrato técnico e integra en `agent-hub/public/index.html`.
4. Si aparecen tokens o componentes nuevos, se actualiza el design system.
