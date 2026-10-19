# Arranque de proyecto: AEM Dynamic Media + DAM + AJO/CDP + agentes de IA

> Fecha: 2026-10-16. Pegar este documento al inicio de una conversación nueva.
> No contiene secretos. Las API keys se referencian solo por nombre.

## 1. Objetivo
Homologar que **agentes de IA creen assets con metadata en el DAM de AEM** (entorno AEM SDK local), con Dynamic Media, y conectarlo con el ecosistema Adobe de marketing (AJO y CDP/AEP). Los agentes usarán varios proveedores de IA y datos externos.

Piezas previstas:
- **AEM as a Cloud Service SDK** local (`localhost:4502`) con DAM y Dynamic Media.
- **Servicios Java** en el módulo `core` (OSGi/Sling) con **arquitectura hexagonal** (puertos y adaptadores).
- **Frontend TypeScript** (módulo `ui.frontend`).
- **Agentes de IA** (más adelante un Agent Hub y servidores MCP).
- **Proveedores externos**: Gemini (Google), Groq, Google Maps y **MongoDB Atlas** (persistencia/memoria de los agentes).
- **Integración con Adobe**: AJO y CDP/AEP (ver proyecto hermano de Azure Functions, sección 6).

## 2. Entorno confirmado
| Elemento | Valor |
|---|---|
| Versión DAM/AEM desplegada | 2026.9.0 |
| SDK local | `2026.9.28187.20260911T134704Z-260800` |
| Arquetipo Adobe | `aem-project-archetype` v58, `aemVersion=cloud` |
| Java | JDK 21.0.9 (Temurin) en `C:\Users\aluca\OneDrive\Desktop\practica\jdk-21.0.9+10` |
| Maven | 3.9.11 |
| Node / npm | 21.7.1 / 10.8.2 |
| Git | 2.45.1 (Windows) |
| IDE | Antigravity IDE (terminal integrada) |
| Repo remoto | `github.com/joffrehermosilla/Martech_Engineer_Dynamic_Media_AJO` |

**Atención con Java:** `java -version` en PATH devuelve Java 8 (1.8.0_241) mientras Maven usa Java 21. En cada ventana nueva hay que ejecutar:
```powershell
$env:JAVA_HOME = "C:\Users\aluca\OneDrive\Desktop\practica\jdk-21.0.9+10"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```
Pendiente: dejar JAVA_HOME y PATH permanentes en Windows.

## 3. Proyecto generado
Comando ejecutado (PowerShell, carpeta `...\damajo\media`):
```powershell
mvn -B org.apache.maven.plugins:maven-archetype-plugin:3.3.1:generate "-DarchetypeGroupId=com.adobe.aem" "-DarchetypeArtifactId=aem-project-archetype" "-DarchetypeVersion=58" "-DappTitle=Martech Engineer Dynamic Media AJO" "-DappId=martechdynamicmediaajo" "-DgroupId=com.bcp.martech" "-DartifactId=martech-engineer-dynamic-media-ajo" "-Dpackage=com.bcp.martech.ai" "-Dversion=0.1.0-SNAPSHOT" "-DaemVersion=cloud" "-DsdkVersion=2026.9.28187.20260911T134704Z-260800" "-DfrontendModule=general" "-DincludeDispatcherConfig=y" "-DenableDynamicMedia=y" "-Dlanguage=es" "-Dcountry=pe"
```
Módulos vistos en el IDE: `all`, `core`, `dispatcher`, `dispatcher.ams`, `it.tests`, `ui.apps`, `ui.apps.structure`, `ui.config`, `ui.content`, `ui.frontend`, `ui.frontend.react.forms.af`, `ui.tests`, además de `.cloudmanager`, `archetype.properties`, `AGENTS.md`, `CLAUDE.md`, `README-CIF.md`, `README-precompiled-scripts.md`.

Ubicación actual: `...\damajo\Martech_Engineer_Dynamic_Media_AJO\martech-engineer-dynamic-media-ajo\` (proyecto Maven un nivel dentro de la carpeta del repo).

Estado al cierre: se estaba ejecutando el primer build Maven (el módulo `ui.frontend` corría `npm ci`; solo había warnings de dependencias). **No se ha confirmado aún que el build termine en BUILD SUCCESS.**

## 4. Decisiones tomadas
- No se clona el repo del arquetipo de Adobe: se usa la versión publicada vía Maven.
- La rama de trabajo es la del repo propio (no `develop` del repo de Adobe).
- El esqueleto se integra al repo existente sin sobrescribir archivos propios.

## 5. Pendientes (orden sugerido)
1. Confirmar que `mvn clean install` termina en BUILD SUCCESS (con JDK 21 activo).
2. Decidir la estructura del repo: ¿el `pom.xml` raíz debe estar en la raíz del repo? Hoy está un nivel más adentro.
3. Primer commit y push (revisar `.gitignore` para no subir `node_modules`, `target`, ni secretos).
4. Desplegar al SDK local (`mvn clean install -PautoInstallSinglePackage`) con AEM corriendo en `localhost:4502`.
5. Verificar qué funciona de Dynamic Media en el SDK local (ver sección 7).
6. Diseñar el modelo de metadata de assets y el servicio que crea assets en el DAM por API.
7. Definir el puerto/adaptador de cada proveedor de IA y de MongoDB Atlas.
8. Más adelante: Agent Hub y servidores MCP.

## 6. Relación con el proyecto Azure (ya construido)
Existe un middleware Azure Functions (Java 21, hexagonal) que correlaciona envíos de WhatsApp de AJO con callbacks de Meta, los guarda en Cosmos DB y publica eventos XDM a un inlet de CDP/AEP. Ver `REANUDACION_AZURE_AJO_WHATSAPP.md`. Este proyecto AEM comparte contexto (AJO, CDP, estilo hexagonal), pero es un repo y despliegue distintos.

## 7. Riesgos y preguntas abiertas a resolver en la nueva conversación
- **Dynamic Media en SDK local:** hasta donde sé, el SDK local de AEM no ejecuta Dynamic Media (es una capacidad de la nube) ni se conecta a AJO. Verificarlo con la documentación de Adobe antes de diseñar sobre ello; si es así, el DAM local sirve para desarrollo del flujo de assets y metadata, y Dynamic Media/AJO requerirían un entorno AEM as a Cloud Service real.
- **Cómo consume AJO los assets de AEM:** definir la integración real (entorno cloud, permisos, delivery de assets) antes de construir.
- **Rol de MongoDB Atlas:** memoria de agentes, cola de trabajos, catálogo de prompts o almacén de metadata. Definirlo.
- **Autenticación de los agentes contra AEM:** usuario técnico/token de servicio en el SDK local; definir el mecanismo.
- **Esquema de metadata:** qué campos (descripción, etiquetas, ubicación con Google Maps, campaña, etc.) y qué agente los completa.

## 8. Seguridad
- Las API keys (Gemini, Groq, Google Maps) y la URI de MongoDB Atlas **no deben ir en el repositorio ni en prompts**. Usar variables de entorno locales (archivo `.env` en `.gitignore`) y, en la nube, Key Vault u OSGi secrets.
- Las claves usadas en el proyecto Azure circularon en texto plano en conversaciones y logs: **rotarlas y generar claves nuevas** para este proyecto.
- Las credenciales de MongoDB Atlas usadas antes eran triviales (usuario y contraseña iguales): crear usuario nuevo con permisos mínimos y restringir IPs.

## 9. Instrucciones para la próxima IA
- Responder en español. Dar comandos de PowerShell listos para copiar, **sin el prompt `PS C:\...>`** (el usuario ya pegó prompts como comandos antes).
- No ejecutar el generador del arquetipo otra vez: el proyecto ya existe.
- Antes de proponer código, pedir el resultado del build (`mvn clean install`) y confirmar la estructura del repo.
- No pedir ni repetir secretos; usar placeholders.

---

# ALCANCE AMPLIADO (2026-10-16): emular Firefly con agentes + MCP + gobierno de contratos

## A. Objetivo refinado
PoC que emula la propuesta de Firefly: agentes y personas piden assets; el sistema consulta el **catálogo** y los **contratos de uso** (Mongo Atlas u otra BD) y solo crea/reutiliza el asset en el DAM de AEM, con metadata, si hay derechos vigentes. Al conectar el repo al Git de Cloud Manager asignado a la empresa, quedaría lista la integración con Dynamic Media y AJO.

## B. Diseño: un núcleo, dos puertas
- Núcleo hexagonal único con los casos de uso: SearchCatalog, CheckUsageRights (activo/canal/territorio/fecha -> permitido | denegado | ambiguo + motivo), CreateAssetWithMetadata, LogDecision.
- Entradas: (1) personas: UI/servlet en AEM; (2) agentes: servidor MCP con las herramientas `search_assets`, `check_usage_rights`, `create_asset`, `set_metadata`, `list_expiring_contracts`.
- Puertos de salida: AssetCatalogPort, ContractRepositoryPort, AssetStoragePort (DAM), GenerationPort (Gemini/Groq ahora; API de Firefly después).
- Regla: ante resultado denegado o ambiguo el agente se detiene y pide revisión humana.

## C. Datos Mongo (mínimo)
`assets` (ruta AEM, título, tags, origen, huella), `contracts` (proveedor, licencia, territorios, canales, vigencia, límite de usos, restricciones), `asset_rights` (asset-contrato), `usage_log` (quién, para qué, decisión, motivo).

## D. Restricciones a verificar
1. El servidor MCP NO corre dentro de AEM as a Cloud Service (solo código OSGi desplegado por Cloud Manager). Debe desplegarse externo (p. ej. Azure) y hablar con AEM por API.
2. Llamadas desde AEM cloud a Mongo Atlas pueden requerir IP de salida fija (Advanced Networking) para la lista de IPs de Atlas. Confirmar con Adobe.
3. Dynamic Media y AJO requieren entorno cloud; el SDK local no los cubre (verificar en documentación).
4. El Git de Cloud Manager valida calidad de código en el pipeline; confirmar con el administrador de Cloud Manager.

## E. Decisión pendiente
Lenguaje del servidor MCP: recomendado TypeScript (Node 21 ya instalado, SDK oficial de MCP) con el núcleo de reglas en Java en `core`. Alternativa: todo en Java.

---

# ALCANCE AMPLIADO 2 (2026-10-16): MCP de generación de imágenes (asumido: Recraft)

> El usuario escribió "photcraft". Se asumió **Recraft** (recraft.ai) por coincidencia con MCP de imágenes. PENDIENTE: confirmar con el usuario.

## F. Qué ofrece Recraft por MCP (verificado en su documentación pública)
- Servidor MCP **remoto**: `https://mcp.recraft.ai/mcp` (OAuth con cuenta Recraft; consume créditos de la suscripción, no las "API units").
- Paquete npm `@recraft-ai/mcp-recraft-server` (local, requiere `RECRAFT_API_KEY`; el repo recomienda ya el remoto).
- Herramientas: `generate_image` (raster/vector), `image_to_image`, `vectorize_image`, `remove_background`, `replace_background`, `crisp_upscale`, `creative_upscale`.
- El MCP genera y edita imágenes; NO consulta contratos ni registra en el DAM. Eso lo hace nuestro núcleo.

## G. Cómo integrarlo (recomendado)
1. Los agentes solo ven NUESTRO servidor MCP (catálogo, contratos, `generate_asset`, `create_asset`, `set_metadata`). Recraft queda detrás de `GenerationPort`, para que ninguna generación se salte la comprobación de derechos ni la bitácora.
2. Flujo: buscar en catálogo -> `check_usage_rights` -> si no hay asset adecuado, generar con Recraft -> descargar -> crear asset en DAM (Assets HTTP API) con metadata (prompt, modelo, estilo, proveedor, origen=generado, fecha, agente solicitante) -> registrar en `usage_log`.
3. Contratos: añadir en Mongo el origen `generated` con las condiciones de uso del proveedor. **Verificar los términos comerciales de Recraft** (plan y derechos de uso comercial) antes de usar assets generados en campañas.
4. Autenticación: el MCP remoto usa OAuth interactivo (no apto para procesos sin usuario). Para ejecución de servidor/agentes usar la API de Recraft con `RECRAFT_API_KEY` (o el paquete local). Notar que la facturación del MCP remoto y de la API es distinta.
5. Configuración MCP en el repo: archivo de ejemplo (`mcp_config.example.json`) SIN secretos; la clave va en `.env` ignorado por Git. El IDE (Antigravity) permite registrar servidores MCP en `mcp_config.json`.
6. Más adelante: reemplazar el adaptador de Recraft por la API de Firefly sin tocar casos de uso.

## H. Pendiente
Confirmar que "photcraft" = Recraft; decidir si el servidor MCP propio hace de cliente MCP hacia Recraft o llama a su API REST (recomendado API REST con clave para el servidor).

---

# CORRECCIÓN (2026-10-16): "photcraft" = PhotoCraft (storytold/photocraft), NO Recraft

La sección "ALCANCE AMPLIADO 2" asumió Recraft por error. El usuario aclaró con el repo `https://github.com/storytold/photocraft`. Lo que sigue reemplaza esa suposición (Recraft queda solo como posible generador opcional).

## I. Qué es PhotoCraft (según su README)
- Editor de imágenes open source, "clean-room", reimplementación tipo Photoshop escrita en Rust. Licencia MIT o Apache-2.0 (a elección).
- Capas, máscaras, capas de ajuste, estilos, texto, vectores, pinceles y **archivos PSD reales** (lectura/escritura), además de PNG, JPEG, WebP, TIFF, SVG, etc.
- **Pensado para agentes:** registro único de 500+ comandos; la UI, la CLI (`photocraft-cli run` / `batch`), un canal de control JSON y un **servidor MCP** (`photocraft-cli mcp`, headless o enlazado a la app) ejecutan los mismos comandos. `batch` aplica una lista de acciones JSON a una carpeta de imágenes.
- **Estado: alfa temprana.** El propio README dice que aún no reemplaza a Photoshop en trabajo profesional diario; faltan funciones de IA/generativas, 15 herramientas y compatibilidad de plug-ins. Es un EDITOR, no un generador.
- Instaladores en la página de releases; para macOS hay un zip de CLI. No verificado: disponibilidad del binario CLI para Windows (comprobar en los assets del release o compilar con Rust/cargo).
- No verificado: soporte de metadata (XMP/IPTC) en exportación. El README no lo documenta; revisar `docs/` y `book/` del repo antes de depender de ello.

## J. Cómo encaja en nuestro diseño
- Nuevo puerto de salida `ImageEditingPort` (componer, editar, exportar variantes) con adaptador PhotoCraft (CLI o MCP).
- Los agentes NO hablan directo con el MCP de PhotoCraft: lo invoca nuestro servidor MCP (herramientas p. ej. `compose_asset`, `export_renditions`), para que todo pase por la comprobación de derechos y la bitácora.
- Flujo: catálogo -> derechos -> (opcional) generar con un modelo -> componer/editar con PhotoCraft (plantillas PSD de marca, texto, recortes por formato, ajustes) -> exportar -> crear asset en el DAM con metadata (la escribe NUESTRO servidor) -> `usage_log`.
- Las listas de acciones JSON de `batch` sirven como "recetas" reutilizables de marca versionadas en el repo.
- Cuando la empresa tenga acceso, se puede sustituir el adaptador por las APIs de Adobe (Photoshop API / Firefly Services; verificar disponibilidad en el contrato).

## K. Seguridad y riesgos
- Alfa: mantener el adaptador intercambiable y no hacerlo dependencia crítica.
- Las entradas que llegan de agentes son no confiables: ejecutar PhotoCraft con un directorio de trabajo acotado (sandbox/contenedor), sin acceso a rutas fuera de él, y no abrir archivos de origen desconocido sin esa barrera.
- Si se usa el canal de control o el MCP enlazado a la app: solo loopback y con la autenticación que documenta el repo.

## L. Pendientes
1. Verificar CLI en Windows y probar `photocraft-cli run` con una imagen y una receta simple.
2. Revisar si PhotoCraft escribe XMP/IPTC; si no, definir cómo se inyecta la metadata (DAM por API o herramienta externa).
3. Definir qué hará el agente: componer sobre plantillas PSD de marca vs. recortar/exportar variantes.
