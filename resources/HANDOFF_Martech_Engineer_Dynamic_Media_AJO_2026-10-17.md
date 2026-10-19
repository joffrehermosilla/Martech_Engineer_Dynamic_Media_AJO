# Documento de continuidad — Martech Engineer Dynamic Media AJO

**Fecha de corte:** 2026-10-17  
**Idioma:** español  
**Uso:** entregar a otra IA para que continúe el trabajo sin volver a generar el proyecto ni repetir preguntas ya resueltas.

> Este documento separa hechos vistos en la conversación, conclusiones de arquitectura y comprobaciones todavía pendientes. No contiene API keys ni secretos. No se deben copiar secretos en commits, prompts ni logs.

---

## 1. Objetivo del proyecto

Construir `Martech_Engineer_Dynamic_Media_AJO`: una plataforma de gobierno y creación automatizada de assets, apoyada en AEM Assets/DAM y preparada para Dynamic Media y Adobe Journey Optimizer (AJO)/AEP-CDP. El usuario quiere una experiencia similar al flujo creativo de Firefly, pero orquestada por agentes y proveedores intercambiables, buscando minimizar el gasto en APIs de IA.

Alcance previsto:

1. Buscar/reutilizar assets existentes en un catálogo.
2. Evaluar derechos de uso antes de crear o publicar (estado, canal, territorio, fechas, límites y restricciones).
3. Si se necesita un asset nuevo, solicitar creación a un proveedor que realmente genere imágenes; los LLM también pueden redactar prompts, etiquetas y metadata.
4. Componer/editar/recortar variantes con un motor de edición, inicialmente estudiando PhotoCraft o una alternativa TypeScript/Java más simple.
5. Crear el asset en AEM DAM mediante el adaptador correspondiente y guardar metadata completa.
6. Registrar una bitácora de quién hizo qué, con qué fuente/modelo, qué derechos se verificaron y qué decisión tomó el sistema.
7. Publicar/aprovechar Dynamic Media cuando el servicio cloud y la licencia estén habilitados.
8. Conectar la entrega de assets con AJO/CDP/AEP en un entorno empresarial autorizado.
9. Añadir una sección **Flow Studio / Entendimiento de Flujos**: los usuarios proporcionan texto, diagramas, JSON o contratos de datos; agentes organizan la información y generan un HTML interactivo siguiendo el estilo de los diagramas HTML ya compartidos. Al seleccionar un nodo se abre un panel/pantalla adicional con su explicación, campos, ejemplos, entradas/salidas y relaciones.

La intención no es clonar el modelo generativo de Adobe Firefly ni prometer paridad completa. Es construir un **flujo de trabajo gobernado** (prompt → generación/edición → validación de derechos/metadata → DAM → entrega), con proveedores reemplazables.

---

## 2. Entorno confirmado

| Elemento | Valor observado en la conversación |
|---|---|
| Versión DAM/AEM reportada por el usuario | `2026.9.0` |
| AEM SDK local | `2026.9.28187.20260911T134704Z-260800` |
| Adobe AEM Project Archetype | versión `58`, `aemVersion=cloud` |
| `enableDynamicMedia` usado al generar | `y` |
| `includeDispatcherConfig` usado al generar | `y` |
| `groupId` | `com.bcp.martech` |
| `artifactId` | `martech-engineer-dynamic-media-ajo` |
| `appId` | `martechdynamicmediaajo` |
| `version` | `0.1.0-SNAPSHOT` |
| Java/Maven | Temurin JDK `21.0.9`, Maven `3.9.11` |
| Node/npm | `21.7.1` / `10.8.2` |
| Git | `2.45.1.windows.1` |
| IDE/terminal | Antigravity IDE y PowerShell en Windows |
| Repositorio remoto | `https://github.com/joffrehermosilla/Martech_Engineer_Dynamic_Media_AJO` |
| Ruta de Windows observada | `C:\Users\aluca\OneDrive\Desktop\ia\adobe\ajo\springAIQuarkus\damajo\Martech_Engineer_Dynamic_Media_AJO` |
| Carpeta real del proyecto Maven | `...\Martech_Engineer_Dynamic_Media_AJO\martech-engineer-dynamic-media-ajo` dentro del repositorio (un nivel más abajo) |

### Java

En una ventana previa, `mvn -v` utilizaba JDK 21.0.9 pero `java -version` encontraba Java 8 (`1.8.0_241`). Para evitar que la sesión nueva use el JDK equivocado, el usuario había usado:

```powershell
$env:JAVA_HOME = "C:\Users\aluca\OneDrive\Desktop\practica\jdk-21.0.9+10"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

Este cambio es temporal para la ventana actual. Dejar `JAVA_HOME` y `PATH` permanentes queda pendiente; no es la prioridad inmediata si Maven sigue usando JDK 21.

---

## 3. Ubicación del proyecto y estado Git/estructura

El `pom.xml` raíz del proyecto generado está en:

```text
...
Martech_Engineer_Dynamic_Media_AJO\
  martech-engineer-dynamic-media-ajo\
    pom.xml
    all\
    core\
    ui.apps\
    ui.apps.structure\
    ui.config\
    ui.content\
    ui.frontend\
    ui.tests\
    it.tests\
    dispatcher\
    dispatcher.ams\
    ...
```

Por eso:

- Ejecutar `mvn clean install` desde la raíz Git `Martech_Engineer_Dynamic_Media_AJO` falla con `there is no POM in this directory`.
- Para el build local, cambiar primero al directorio `martech-engineer-dynamic-media-ajo`.
- **Para Cloud Manager, el proyecto debe tener un `pom.xml` en la raíz del repositorio Git.** Adobe documenta ese requisito. Antes de integrar este repo con el repo/pipeline empresarial, decidir una reorganización segura (probablemente mover el contenido Maven a la raíz usando Git, o crear un POM agregador raíz que referencie los módulos correctamente). No asumir que el pipeline empresarial compilará el estado anidado actual. Referencia: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/getting-started/project-creation/project-setup

No volver a ejecutar el arquetipo. El proyecto ya existe y el usuario indica que ya hizo push a GitHub.

---

## 4. Build actual: progreso y error pendiente

### Progreso confirmado

En la ejecución del 2026-10-17:

- El POM agregador se leyó correctamente cuando se ejecutó desde la carpeta anidada.
- El módulo `core` terminó `SUCCESS`.
- `ui.frontend` terminó `SUCCESS` después de ejecutar `npm ci` (alrededor de cinco minutos); hubo advertencias de dependencias, no fue el error final.
- `ui.apps` falló en la compilación de HTL.
- Los módulos posteriores se marcaron `SKIPPED`.

### Error exacto

```text
ui.apps/target/generated-sources/htl/.../components/adaptiveForm/page/customheaderlibs__002e__html.java:
package com.adobe.cq.forms.core.components.models.form does not exist

ui.apps/target/generated-sources/htl/.../components/commerce/logo/logo__002e__html.java:
package com.adobe.cq.commerce.core.components.models.header does not exist

ui.apps/target/generated-sources/htl/.../components/adaptiveForm/page/customfooterlibs__002e__html.java:
package com.adobe.cq.forms.core.components.models.form does not exist
```

### Interpretación

El compilador HTL generó Java a partir de componentes fuente de Forms (`adaptiveForm`) y Commerce (`commerce/logo`), pero la clasepath de compilación de `ui.apps` no contiene las API que esos HTL hacen referencia. No es un error de la lógica de Dynamic Media, de Node/npm ni de la JVM.

El archivo bajo `target/generated-sources/htl` es generado. **No editar archivos dentro de `target`.** Hay que decidir desde los archivos fuente de `ui.apps`:

- Si Adaptive Forms/Commerce sí se necesitan, alinear dependencias/API de Forms y CIF con la configuración que corresponda al SDK/arquetipo y mantener todos los módulos/dependencias relacionados.
- Si no se necesitan (el alcance inicial de este proyecto es DAM/DM/creación de assets, no Forms ni Commerce), preferiblemente retirar los componentes de ejemplo y contenido/referencias innecesarios de la fuente para que el build no intente compilar esas importaciones. No crear dependencias falsas ni carpetas vacías para satisfacer Maven.

La documentación actual del arquetipo lista `includeCif` con predeterminado `n`, `includeFormscommunications`/`includeFormsenrollment` con predeterminado `n` e `includeFormsheadless` con predeterminado `n`; `enableDynamicMedia=y` solo activa la configuración/política de componentes foundation Dynamic Media y capacidades del Core Image component, no habilita licencias o servicios cloud. Ver https://github.com/adobe/aem-project-archetype . Como la carpeta generada parece tener componentes de Forms/Commerce a pesar de no formar parte del alcance, la IA siguiente debe **inspeccionar la fuente real y `archetype.properties`/README del proyecto**, en vez de asumir qué parámetro los creó.

### Próximo diagnóstico en PowerShell

Ejecutar dentro de `...\Martech_Engineer_Dynamic_Media_AJO\martech-engineer-dynamic-media-ajo`:

```powershell
$env:JAVA_HOME = "C:\Users\aluca\OneDrive\Desktop\practica\jdk-21.0.9+10"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

$ComponentRoot = ".\ui.apps\src\main\content\jcr_root\apps\martechdynamicmediaajo\components"

Write-Host "--- Archivos Adaptive Forms fuente ---"
Get-ChildItem (Join-Path $ComponentRoot "adaptiveForm") -Recurse -File -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty FullName

Write-Host "--- Archivos Commerce fuente ---"
Get-ChildItem (Join-Path $ComponentRoot "commerce") -Recurse -File -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty FullName

Write-Host "--- Imports/referencias en HTL fuente ---"
Get-ChildItem ".\ui.apps\src\main\content" -Filter *.html -Recurse -File -ErrorAction SilentlyContinue |
  Select-String -Pattern 'com\.adobe\.cq\.forms\.core\.components\.models\.form|com\.adobe\.cq\.commerce\.core\.components\.models\.header'

Write-Host "--- Indicadores de módulos/flags opcionales ---"
Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -in @('archetype.properties','README-CIF.md','pom.xml') -and $_.FullName -notmatch '\\target\\|\\node_modules\\' } |
  Select-Object -ExpandProperty FullName
```

La siguiente IA debe revisar el resultado y los `ui.apps/pom.xml`, root `pom.xml`, `README-CIF.md` y cualquier archivo `archetype.properties` presente antes de aplicar una reparación. Después de modificar el código fuente, ejecutar desde la carpeta Maven:

```powershell
mvn clean install
```

No usar `-rf` hasta que esté corregida la causa; el build completo permite verificar todo el reactor.

---

## 5. Diseño objetivo: un núcleo gobernado, varios adaptadores

Arquitectura sugerida (hexagonal / ports and adapters):

### Casos de uso del núcleo

- `SearchCatalog` — buscar/reutilizar un asset.
- `CheckUsageRights` — evaluar permiso de uso para canal, territorio, fecha y condiciones; producir `ALLOWED`, `DENIED` o `REVIEW_REQUIRED` más el motivo.
- `CreateAssetWithMetadata` — crear/subir un asset en DAM con metadata normalizada.
- `GenerateCreativeBrief` — convertir un pedido en brief/prompt estructurado.
- `GenerateImage` — pedir una imagen a un adaptador que realmente genere imágenes.
- `ComposeAsset` / `EditImage` — composición, recortes, texto, variantes y exportación.
- `GenerateFlowDocumentation` — normalizar el conocimiento a un grafo estructurado y renderizar HTML seguro.
- `LogDecision` — auditoría de cada decisión y operación.

### Puertos/adaptadores a implementar

- `AssetCatalogPort` — MongoDB Atlas inicialmente, reemplazable.
- `ContractRepositoryPort` — contratos y restricciones.
- `AssetStoragePort` — AEM DAM API.
- `TextModelPort` — Gemini, Groq u otros para resumen, clasificación, extracción y generación de prompts.
- `ImageGenerationPort` — un proveedor que efectivamente genere imágenes; no asumir que un proveedor de chat/texto hace edición visual.
- `ImageEditingPort` — PhotoCraft o una implementación propia limitada basada en librerías convencionales.
- `FlowRendererPort` — renderer de diagramas HTML a partir de JSON validado.
- `AuditLogPort` — guardar operador/agente, acción, modelo/proveedor, origen y resultados de permisos.

Regla de seguridad del negocio: ante derechos denegados o ambiguos, no publicar ni enviar el asset a campañas; detener el flujo y solicitar revisión humana.

### Datos iniciales propuestos

- `assets`: assetId, ruta DAM, title, description, tags, source/origin, hash, MIME type, dimensiones, model/provider, prompt/reference inputs y fechas.
- `contracts`: proveedor, licencia, territorios, canales permitidos, vigencia, límite de usos y restricciones.
- `asset_rights`: relación entre asset y contrato.
- `usage_log`: persona/agente, pedido, decisión, motivo, timestamp, proveedor/acciones, resultado, aprobador humano.
- `flow_docs`: id/version, grafo fuente JSON, HTML renderizado, owner, tags, fuente de información y fecha.

MongoDB Atlas es solo una propuesta pendiente de definir/cotizar. No poner URI ni contraseñas en el código.

---

## 6. Estrategia de múltiples proveedores de IA y costos

### Objetivo del usuario

Usar claves de varios proveedores (el historial menciona Groq/Groq API y Gemini, además de otros proveedores) para que las tareas pasen a otro proveedor si una cuota se agota o la credencial deja de funcionar. El proyecto debe intentar minimizar costos y no depender de una sola API.

### Recomendación

Implementar **un solo router de modelos** detrás de `TextModelPort`, no incorporar condiciones por proveedor directamente en la lógica de negocio. El router mantiene prioridades por tipo de tarea, estado de credenciales, cuota estimada, latencia, límites y modelo disponible.

Política mínima:

1. Intentar el proveedor primario configurado para la tarea.
2. Ante timeout, error temporal 5xx o 429, respetar `Retry-After` si viene informado, aplicar backoff corto con jitter y luego probar el siguiente proveedor compatible si existe presupuesto/cuota.
3. Ante 401/403, poner el proveedor en estado `CREDENTIAL_INVALID`/`DISABLED`, no repetir cientos de veces; registrar un error sin volcar la key y pasar al siguiente si está autorizado.
4. Ante 400/errores de esquema, no asumir que otro proveedor resolverá el problema. Validar/corregir el request; solo hacer fallback si hay motivo claro de incompatibilidad específica del proveedor.
5. Si todos los proveedores fallan, persistir el trabajo como pendiente/reintentable, exponer el estado y no marcarlo como éxito. No perder el asset o el flujo en proceso.
6. Aplicar circuit breaker, límite de reintentos, presupuesto diario, límite de tokens, timeouts y métricas por proveedor/modelo.
7. Versionar prompts y salidas estructuradas; validar la salida JSON contra un schema antes de usarla para crear metadata o ejecutar acciones.
8. Los proveedores no deben recibir la URI de MongoDB, claves de AEM ni secretos de otros servicios. No meter las API keys en prompts, HTML, código fuente ni `mcp_config.example.json`.

### Advertencias de precio y privacidad

- “Gratis” significa cuotas limitadas sujetas a cambios, no disponibilidad garantizada ni operación ilimitada. El fallback reduce interrupciones, pero no crea una garantía de continuidad.
- Las claves de API normalmente son credenciales, mientras que las cuotas se agotan o los tokens de uso alcanzan los límites; no basar el diseño en una supuesta caducidad automática de todas las claves.
- La tarifa/plan gratis de Gemini puede permitir el uso de prompts y respuestas para mejorar productos y puede permitir revisión humana según los términos aplicables. **No enviar PII, información de clientes, contratos confidenciales ni contenido interno del banco a cuotas gratuitas sin aprobación expresa de seguridad/legal de la empresa.** Fuente oficial: https://ai.google.dev/gemini-api/terms?hl=en y https://ai.google.dev/gemini-api/docs/pricing
- Groq documenta límites por RPM, RPD, TPM/TPD y HTTP 429. Ver https://console.groq.com/docs/rate-limits
- Confirmar si el usuario se refiere a **Groq** (inferencia de modelos) o **Grok** (xAI); la conversación previa refiere a Groq API.
- Separar proveedores de modelos de texto de generación de imágenes. No asumir que Groq, por ser un proveedor de inferencia, ofrece generación de imagen equivalente a Firefly.
- Los proveedores gratuitos y sus condiciones pueden cambiar; comprobar precios, términos, modelos disponibles y cuotas al momento de configurar cada adaptador.

### Recomendación de fases

- Fase inicial: LLMs para entender la solicitud, construir el brief, sugerir metadata y generar los detalles textuales de los diagramas.
- Imagen: seleccionar un adaptador específicamente validado para generación de imágenes, o evaluar un modelo local de código abierto si el costo de API debe ser cero (considerando hardware, consumo eléctrico, licencias y operación).
- Edición: librerías convencionales o PhotoCraft en un primer PoC. No mezclar “generar” y “editar” como si fueran la misma capacidad.

---

## 7. ¿PhotoCraft se puede homologar dentro del proyecto sin Rust?

Repositorio entregado por el usuario: https://github.com/storytold/photocraft

### Hechos revisados en el repositorio

- PhotoCraft se describe como un editor de imágenes open-source, “clean-room”, escrito en Rust.
- Contiene un modelo documental/command engine reutilizado por UI, CLI, canal JSON y MCP.
- El README declara un registro de 500+ comandos y soporte de edición por capas, máscaras, ajustes, texto, vectores y PSD.
- Dispone de `photocraft-cli` con comandos como `run`, `batch`, `commands`, `mcp` y `serve`.
- Las páginas del repositorio listan licencias MIT y Apache-2.0; deben conservarse avisos/atribuciones aplicables y revisar las licencias de dependencias.
- El proyecto se declara en early alpha; su propio README avisa que aún no es un reemplazo para uso profesional diario y señala faltantes en funciones AI/generativas, herramientas, tipografía y plug-ins.

Fuentes:

- https://github.com/storytold/photocraft
- https://github.com/storytold/photocraft/blob/main/book/src/automation/mcp.md
- https://github.com/storytold/photocraft/blob/main/book/src/automation/cli.md

### Respuesta directa

**No es realista “copiar su lógica” y obtener el editor completo dentro del código Java/TypeScript sin Rust.** El modelo de capas, motor gráfico, filtros, PSD y 500+ comandos constituye un sistema grande. El permiso de licencia no elimina el costo técnico de portar, mantener y testear esa funcionalidad. Si se exige cero Rust, habría que implementar un producto distinto que cubra solo las operaciones concretas necesarias, no una equivalencia completa de PhotoCraft.

Hay tres opciones:

1. **PhotoCraft como proceso externo (rápido para experimentar):** instalar/utilizar `photocraft-cli` o ejecutarlo en un worker aislado, y llamarlo desde un adaptador `ImageEditingPort`. El resto de la plataforma sigue en Java/TypeScript. Esto usa un ejecutable compilado en Rust, aunque no obliga a escribir Rust ni a integrar el código Rust en AEM. No exponer su sistema de archivos libremente; dar directorios temporales acotados, validación de inputs, límites y limpieza.
2. **Reimplementar el subconjunto necesario (recomendación si no se acepta Rust):** usar, por ejemplo, TypeScript + `sharp`/libvips para resize/crop/format/variants y SVG/HTML para composición de textos, logos, bordes y plantillas de marca. O Java con ImageIO/Thumbnailator/TwelveMonkeys según el caso. No es PhotoCraft embebido: es un `BasicImageEditingAdapter` propio con capacidad limitada, comprobable y suficiente para la primera versión.
3. **Fork/port parcial del código Rust:** solo si se acepta una inversión grande; portar un subconjunto y conservar las licencias/avisos necesarios. No iniciar por aquí.

### Recomendación técnica

Para el objetivo real (assets de campaña y variantes, no replicar Photoshop), empezar con **recetas declarativas en JSON + plantillas SVG/HTML + `sharp` en un worker Node.js**. El frontend AEM puede mostrar una vista previa, mientras un servicio ejecuta el lote, exporta PNG/WebP/JPEG y entrega el archivo a `AssetStoragePort`. Las metadata se escriben en nuestro servicio/DAM, no se confía en que PhotoCraft las escriba de forma automática.

Si luego se demuestra que una necesidad específica requiere capas PSD o ajustes más avanzados, ejecutar PhotoCraft como adaptador opcional para ese caso.

---

## 8. “Un solo agente orquestador dentro de AEM”: arquitectura realista

El usuario quiere que AEM sea el punto central que orqueste los MCP del proyecto. Aclaración técnica importante: una app AEM as a Cloud Service no debe diseñarse como un host genérico de procesos persistentes/subprocesos MCP, ni ejecutar un servidor MCP de stdio como si fuera un bundle OSGi. AEM ejecuta código/bundles aprobados por Cloud Manager; los procesos de tooling y agentes con tareas largas se deben separar.

Propuesta que preserva la intención:

- **AEM como UI y punto de entrada/gobierno del proceso:** panel Flow Studio, creación/revisión de assets, autorización/permisos y estados del trabajo.
- **Core OSGi / Java:** servicios cortos, casos de uso y reglas de negocio que sí deban estar dentro de AEM, con adaptadores mediante APIs.
- **Worker/orquestador externo, si se requiere agente autónomo/asíncrono:** procesa trabajos largos y llama a proveedores, herramientas de edición y APIs AEM de forma autenticada. Puede ser un servicio externo controlado por la organización; no necesariamente MCP externo para toda función.
- **MCP:** exponer solo herramientas controladas, con schemas y permisos limitados; usar una política central que compruebe derechos y audite antes de cualquier herramienta que cambie assets.
- **AEM MCP oficial:** Adobe documenta un endpoint MCP para que clientes compatibles invoquen herramientas de AEM: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/ai-in-aem/mcp-support/using-mcp-with-aem-as-a-cloud-service . Esto puede ayudar a que IDEs/agentes operen AEM con identidad/permisos, pero no sustituye el orquestador creativo específico, el catálogo contractual ni el router de modelos del proyecto.

No afirmar que hay un agente nativo de AEM capaz de alojar arbitrariamente todos los procesos MCP externos. El sistema puede parecer un solo agente desde la experiencia de usuario aunque, internamente, use servicios/adaptadores separados.

---

## 9. Flow Studio: HTML dinámico con explicación por nodo

### Objetivo

Reutilizar los diagramas HTML interactivos ya mostrados en la conversación, incluyendo la guía de arquitectura/trazabilidad de WhatsApp, como una plantilla genérica.

### Diseño propuesto

1. Entrada: el usuario pega texto/JSON, adjunta un diagrama/HTML o selecciona una plantilla.
2. Agente de entendimiento: extrae sistemas, pasos, decisiones, APIs, payloads, dependencias y problemas.
3. Modelo intermedio validado (`FlowGraph`): `id`, `label`, `type`, `summary`, `details`, `inputs`, `outputs`, `status`, `sourceRefs`, `edges` y `risks`.
4. Normalización: resolver IDs repetidos, conexiones no válidas, referencias a nodos inexistentes y datos faltantes; si es ambiguo, marcarlo para revisión.
5. Renderer controlado en `ui.frontend`: generar HTML/CSS/SVG a partir de plantilla versionada. No ejecutar HTML o JS arbitrario que haya devuelto un modelo.
6. Interacción: al seleccionar un nodo se abre un drawer/panel/pantalla de detalle con explicación simple, detalle técnico, ejemplo de payload, sistemas relacionados, errores y fuentes.
7. Guardado versionado en DAM: JSON fuente y HTML exportado con metadata (título, proyecto, versión, autor/agente, fuentes y fecha).

### Criterios de aceptación iniciales

- Importar un flujo sencillo de 5–10 nodos.
- Mostrar conexiones y decisiones sin deformarlas.
- Seleccionar cualquier nodo y abrir la explicación correcta.
- Separar explicación narrativa de datos técnicos.
- Conservar fuentes/archivos usados para evitar que el agente invente pasos.
- Exportar HTML seguro y volver a abrirlo desde DAM.
- Historial de versiones y aprobación humana antes de publicar.

---

## 10. Dynamic Media: alcance y limitaciones

`enableDynamicMedia=y` del arquetipo activa ajustes/políticas de componentes foundation de Dynamic Media y funciones del Core Image component. No basta por sí solo para conceder una licencia ni activar los servicios de entrega cloud.

Adobe indica que Dynamic Media con OpenAPI aplica a AEM as a Cloud Service, exige las licencias/entitlements correspondientes (AEM Assets as a Cloud Service y Dynamic Media) y puede requerir activación en el entorno de Cloud Manager. Revisar:

- Overview: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-overview
- Preguntas frecuentes: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-faqs
- Activación Prime/Ultimate: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/enable-dynamic-media-prime-and-ultimate

Plan de pruebas:

- Local SDK: probar la lógica de carga, metadata, búsqueda, templates/plantillas y frontend; no afirmar que esto equivale al servicio Dynamic Media de producción.
- AEM Cloud empresarial: comprobar que la feature está licenciada/activada y que un asset aprobado obtiene una delivery URL real.
- AJO/CDP: después probar acceso/permisos y consumo desde el canal; la URL de origen debe ser compatible con el canal de destino.

---

## 11. Estructura propuesta del código a medio plazo

No añadir todo a un solo módulo ni poner la lógica de negocio en scripts de agentes. Mantener módulos existentes y definir fronteras claras:

- `core`: casos de uso, entidades/modelos, validación de derechos, interfaces/puertos Java y servicios OSGi.
- `ui.apps`: componentes HTL/clientlibs/configuración AEM, sólo lo que debe desplegarse en AEM.
- `ui.config`: configuración OSGi que no contenga secretos.
- `ui.content`: contenido inicial/plantillas autorizadas.
- `ui.frontend`: Flow Studio y UI de orquestación/edición.
- `all`: paquete agregador.
- Worker externo opcional: router de proveedores, trabajos asíncronos y herramientas CLI/MCP. Una estructura Node/TypeScript separada dentro del repositorio solo debe añadirse después de acordar el despliegue y el build, para que no complique el reactor Maven.

No insertar secretos en OSGi config versionada. Usar variables de entorno locales en `.env` excluido de Git y mecanismos aprobados (por ejemplo, variables secretas del servicio/Key Vault) en el entorno que aloje workers externos.

---

## 12. Orden de trabajo — próximo paso obligatorio

### Fase A — cerrar el build (ahora)

1. Entrar a la carpeta Maven anidada.
2. Inspeccionar los HTL fuente de `adaptiveForm` y `commerce`, las dependencias de `ui.apps/pom.xml` y cualquier `archetype.properties`/README que se haya generado.
3. Determinar si el proyecto necesita Forms/CIF. Si no, eliminar de forma controlada el scaffolding de ejemplo no utilizado y sus referencias en la fuente. Si sí, añadir las dependencias/SDK correctos de acuerdo con la documentación de ese add-on; no adivinar versiones.
4. Ejecutar `mvn clean install` de nuevo y alcanzar `BUILD SUCCESS`.
5. Luego comprobar que el SDK local está iniciado y probar el perfil de despliegue local; usar las credenciales locales correctas en lugar de asumir `admin/admin` si el usuario las cambió.

### Fase B — estabilizar el repositorio

6. Revisar `.gitignore` (no subir `target`, `node_modules`, `.env`, claves, tokens, archivos privados ni grandes builds).
7. Corregir la estructura para que haya un `pom.xml` en la raíz del repositorio Git antes de integrar con Cloud Manager; preservar commits y ejecutar build tras la reorganización.
8. Acordar con el administrador el programa, entorno, branch/pipeline y credenciales empresariales. No apuntar a producción en la etapa PoC.

### Fase C — primer caso funcional de DAM

9. Implementar metadata schema mínimo y `CreateAssetWithMetadata`.
10. Probar una subida local, lectura de metadata, hash, tipo MIME, dimensiones y registro de auditoría.
11. Definir cómo se decide la aprobación; no publicar automáticamente assets cuyo derecho sea denegado/ambiguo.

### Fase D — providers y edición

12. Crear la interfaz `TextModelPort` y adaptadores; fallback con timeouts, `429`/`5xx`, credenciales inválidas, circuit breaker y auditoría.
13. Separar `ImageGenerationPort` de `ImageEditingPort`.
14. Prueba PhotoCraft: abrir una imagen de prueba, ejecutar una operación no destructiva, exportar a una carpeta aislada, validar dimensiones y comprobar límites de acceso. Alternativa sin Rust: prototipo SVG + `sharp` para recorte/tamaño/formatos/composición.
15. Solo después diseñar el worker/MCP para ejecución autónoma.

### Fase E — Flow Studio y Dynamic Media

16. Definir el schema JSON del diagrama, renderer seguro y UI de detalle por nodo.
17. Guardar JSON + HTML en DAM con versiones y metadata.
18. Validar Dynamic Media real en AEM Cloud con el admin/licencia correspondiente.
19. Probar AJO de extremo a extremo en un sandbox autorizado.

---

## 13. Instrucciones para la IA que retome el proyecto

1. Responder en español y dar comandos PowerShell copiables, sin copiar `PS C:\...>` ni líneas que sean salida, no comandos.
2. No repetir generación del arquetipo: el proyecto ya existe, fue pusheado a GitHub y tiene módulos.
3. El POM está en la carpeta `martech-engineer-dynamic-media-ajo` anidada. El último error que importa es la compilación HTL de `ui.apps`, no el error previo por lanzar Maven desde la raíz Git.
4. No modificar `target/generated-sources/htl`. Reparar los HTL fuente/dependencias.
5. Priorizar eliminar el scaffolding Forms/Commerce no requerido, si la inspección confirma que no forma parte del alcance, en vez de introducir dependencias de add-ons innecesarios.
6. No afirmar que la compilación es exitosa hasta recibir `BUILD SUCCESS`.
7. Antes de Cloud Manager, garantizar POM en raíz Git (regla documentada por Adobe).
8. Respetar el objetivo de minimizar coste, pero advertir que las cuotas gratuitas no garantizan continuidad, son cambiantes y pueden tener condiciones de uso de datos incompatibles con información confidencial.
9. Para PhotoCraft, no prometer portabilidad completa a Java/TypeScript. Proponer un subconjunto funcional que se pueda homologar, o el CLI externo como adaptador opcional. Mantener la licencia y avisos si se utiliza código de ese proyecto.
10. Mantener el control de derechos y auditoría antes de cualquier creación/publicación. No pedir ni repetir claves API reales.

---

## 14. Referencias externas verificadas (consulta del 2026-10-17)

- Adobe AEM Project Archetype v58 y parámetros: https://github.com/adobe/aem-project-archetype
- Adobe, estructura de proyecto para Cloud Manager y requisito de POM en raíz Git: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/getting-started/project-creation/project-setup
- Adobe, guía de SDK AEM as a Cloud Service: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/aem-as-a-cloud-service-sdk
- Adobe Forms local development: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/forms/setup-configure-migrate/setup-local-development-environment
- Adobe Dynamic Media with OpenAPI overview: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-overview
- Adobe Dynamic Media activation/licensing: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/enable-dynamic-media-prime-and-ultimate
- Adobe AEM MCP integration: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/ai-in-aem/mcp-support/using-mcp-with-aem-as-a-cloud-service
- PhotoCraft source README: https://github.com/storytold/photocraft
- PhotoCraft MCP: https://github.com/storytold/photocraft/blob/main/book/src/automation/mcp.md
- PhotoCraft CLI: https://github.com/storytold/photocraft/blob/main/book/src/automation/cli.md
- Gemini API additional terms/privacy: https://ai.google.dev/gemini-api/terms?hl=en
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Groq rate limits: https://console.groq.com/docs/rate-limits

**Fin del documento de continuidad.**
