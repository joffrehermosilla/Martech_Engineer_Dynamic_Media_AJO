# MANDAMIENTOS DEL PROYECTO
## Martech Engineer Dynamic Media AJO
### Constitución técnica, fases de ejecución y criterios de aceptación para colaboración multi-IA

**Versión:** 1.0  
**Fecha:** 26 de octubre de 2026  
**Objetivo:** construir una plataforma local-first, compatible con las integraciones Adobe que correspondan, con edición de assets en HTML/JavaScript, herramientas MCP, orquestación de agentes y conectividad opcional con servicios externos.

---

# I. MISIÓN INNEGOCIABLE

Construir sobre el repositorio existente `Martech_Engineer_Dynamic_Media_AJO` una plataforma funcional de ingeniería Martech que permita gestionar y editar assets, visualizar jobs, ejecutar flujos, exponer herramientas mediante MCP e integrar servicios Adobe autorizados.

El proyecto debe funcionar en un entorno de desarrollo restringido, incluso cuando la laptop corporativa bloquee puertos, conexiones externas, MongoDB Atlas o proveedores de IA.

La solución deberá poder desplegarse y adaptarse al ecosistema Adobe correspondiente, respetando las políticas, permisos, mecanismos de extensión y requisitos de publicación del producto de destino.

**Ninguna IA podrá redefinir unilateralmente esta misión.**

# II. LOS 15 MANDAMIENTOS

## Mandamiento 1. Respetar el repositorio original

Toda IA deberá inspeccionar el código existente antes de proponer cambios.

- No reemplazar la arquitectura sin justificación técnica.
- No crear un proyecto paralelo que duplique funcionalidades existentes.
- No eliminar agentes, endpoints, rutas, herramientas MCP ni módulos funcionales.
- No cambiar contratos de API sin identificar a todos sus consumidores.
- No sobrescribir archivos completos cuando una modificación localizada sea suficiente.
- No afirmar que se revisó un archivo que no se ha recibido o inspeccionado.

El repositorio actual es la fuente de verdad del proyecto. Los ejemplos y prototipos sirven como referencia, no como sustitutos de su implementación real.

## Mandamiento 2. No confundir el arquetipo Adobe con compatibilidad garantizada

El proyecto partió de un arquetipo de Adobe. Este origen debe preservarse y documentarse, pero no se asumirá que garantiza automáticamente:

- La publicación de un módulo en Adobe Experience Cloud.
- La aparición del editor dentro de AEM Assets.
- La compatibilidad con todas las versiones de Adobe.
- La autenticación de agentes externos.
- El acceso a Firefly, AJO o servicios de Adobe sin credenciales y permisos.
- La aprobación del banco para desplegar extensiones.

Toda integración deberá identificar el producto Adobe exacto, el mecanismo oficial aplicable, los requisitos de autenticación y el procedimiento de despliegue.

Si se trata de una extensión de interfaz, se evaluarán las opciones oficiales de Adobe App Builder y UI Extensibility cuando correspondan al producto de destino.

## Mandamiento 3. PhotoCraft Rust no será un requisito para el editor web

PhotoCraft en Rust forma parte del contexto técnico existente, pero el nuevo editor web deberá poder funcionar sin ejecutar PhotoCraft ni depender de su binario en producción.

Se creará una vista propia en HTML, CSS y JavaScript nativo, inspirada en las herramientas visuales de PhotoCraft.

La ingeniería inversa se limitará al análisis funcional y visual de las herramientas: no se copiará código propietario ni se asumirán capacidades que no hayan sido verificadas.

El nuevo editor deberá disponer de una implementación independiente y documentada.

## Mandamiento 4. El editor debe servir a humanos y agentes

Una persona y un agente de IA deberán poder solicitar las mismas operaciones de edición mediante interfaces distintas, pero utilizando el mismo servicio de dominio.

Las operaciones candidatas incluyen:

- `asset.get`
- `asset.preview`
- `asset.crop`
- `asset.rotate`
- `asset.flip`
- `asset.adjust`
- `asset.export`
- `asset.versions`

Cada operación deberá implementarse únicamente si el código y el formato de los assets permiten ofrecerla de manera fiable.

La interfaz humana no será una simulación desconectada de las herramientas MCP. Ambos consumidores compartirán las mismas reglas de negocio, validaciones y autorización.

## Mandamiento 5. El modo local es obligatorio

El modo local no es una mejora opcional: es un requisito de aceptación del proyecto.

Debe permitir, como mínimo:

- Abrir la aplicación sin conexión a servicios externos.
- Cargar assets de prueba locales.
- Mostrar miniaturas y metadatos.
- Editar imágenes compatibles.
- Previsualizar, deshacer y rehacer cambios.
- Exportar resultados locales.
- Consultar y gestionar jobs de demostración.
- Visualizar flujos y sus estados.
- Ejecutar las operaciones locales que estén implementadas.
- Mostrar claramente qué operaciones son reales y cuáles están simuladas.

Las funciones que requieren servicios remotos deberán informar de su indisponibilidad sin bloquear las funciones locales.

## Mandamiento 6. La conectividad externa será opcional y configurable

La aplicación deberá ofrecer tres políticas de ejecución:

**Local:** no intenta conectarse a proveedores externos y utiliza los adaptadores locales configurados.

**Auto:** utiliza los servicios remotos permitidos y disponibles; cuando no puedan utilizarse, recurre a alternativas locales compatibles.

**Cloud:** utiliza los servicios remotos configurados y muestra errores claros si no están disponibles, sin cambiar silenciosamente a resultados simulados.

La selección se realizará mediante configuración explícita y validada. No se almacenarán credenciales en el código fuente.

La indisponibilidad de una conexión no debe provocar bloqueos indefinidos ni pérdida de trabajo.

## Mandamiento 7. No depender de Google ni de bibliotecas remotas para el funcionamiento básico

El editor deberá utilizar tecnologías nativas del navegador siempre que sean suficientes.

Se priorizarán:

- HTML semántico.
- CSS.
- JavaScript nativo.
- Canvas y Blob para las operaciones de imagen compatibles.
- APIs locales de archivos, cuando el navegador y los permisos lo permitan.
- Componentes y utilidades que ya existan en el repositorio.

No se cargarán fuentes, scripts, imágenes, bibliotecas o recursos desde CDNs externos como requisito para abrir la interfaz.

No se introducirán dependencias complejas sin documentar su propósito, peso, licencia, compatibilidad y alternativa.

## Mandamiento 8. La persistencia local debe ser real

Los cambios no pueden limitarse a modificar píxeles en pantalla y afirmar que fueron guardados.

Se distinguirán explícitamente:

- Archivo original.
- Estado de edición en memoria.
- Resultado exportado.
- Nueva versión persistida.
- Asset sincronizado con un sistema externo.

El almacenamiento local podrá utilizar archivos, IndexedDB u otro mecanismo apropiado, según el diseño existente y las restricciones del navegador.

Si el navegador no permite escribir directamente sobre el archivo original, la aplicación ofrecerá una descarga o un procedimiento de guardado compatible.

La sincronización posterior con AEM u otro servicio deberá ser explícita y manejar conflictos de versiones.

## Mandamiento 9. Jobs y assets deben visualizarse correctamente

La vista de Jobs deberá mostrar el estado real de cada trabajo y su relación con los assets.

Como mínimo, se contemplarán:

- Identificador del job.
- Asset de entrada.
- Miniatura o vista previa.
- Operación solicitada.
- Estado.
- Resultado o error.
- Fecha o información temporal disponible.
- Ubicación del archivo o referencia al recurso, cuando corresponda.

Las rutas de imágenes deberán verificarse desde el navegador y el servidor. No se inventarán URLs ni se asumirán rutas relativas correctas sin comprobarlas.

El modo demo tendrá datos deterministas y reproducibles.

## Mandamiento 10. Flow Studio debe representar relaciones reales

No basta con iluminar nodos o animar conexiones.

El diagrama deberá derivarse del modelo de agentes, tareas, dependencias y transiciones existente.

Debe mostrar:

- Nodos.
- Conexiones dirigidas.
- Orden de ejecución cuando esté definido.
- Estados de cada paso.
- Entradas y salidas relevantes.
- Errores y dependencias incumplidas.
- Diferencia entre ejecución simulada y real.

Una ruta solo se marcará como ejecutada cuando exista evidencia de ejecución. La animación visual no constituirá evidencia.

## Mandamiento 11. MCP debe compartir las capacidades de edición

El servidor MCP expondrá únicamente las herramientas que estén realmente implementadas.

Cada herramienta deberá definir:

- Nombre y descripción.
- Esquema de entrada.
- Validación de parámetros.
- Permisos requeridos.
- Resultado estructurado.
- Errores recuperables.
- Registro de auditoría cuando corresponda.

La interfaz web no tendrá que convertirse en un cliente MCP para editar imágenes. Ambos consumidores llamarán a los mismos servicios internos de dominio.

Cuando MCP y el backend estén disponibles localmente, deberán poder probarse sin conectarse a servicios de IA externos.

## Mandamiento 12. Los permisos se aplican en el servidor

Ningún agente ni usuario podrá modificar assets por el simple hecho de que la interfaz exponga un botón o una herramienta.

Las operaciones de lectura, edición, exportación, publicación y eliminación deberán tener permisos diferenciados cuando corresponda.

Los permisos se validarán en el backend para cada operación, tanto si la petición proviene de una persona como si procede de MCP.

Las operaciones destructivas deberán requerir la autorización apropiada. Se preservará el original por defecto.

Las acciones sensibles deberán registrar actor, recurso, operación, resultado y referencia temporal cuando sea viable.

## Mandamiento 13. En el despliegue del banco, solo Firefly será el proveedor de IA externo autorizado

La arquitectura de despliegue deberá asumir que los agentes locales y los proveedores externos pueden quedar aislados por las políticas corporativas.

La política prevista es:

- Firefly será el único proveedor de IA externo habilitado en producción, si la organización autoriza su uso.
- No se dependerá de Google Gemini, OpenAI, Anthropic ni otros proveedores externos para ejecutar las funciones básicas.
- Los agentes y herramientas MCP podrán ejecutarse localmente durante el desarrollo.
- Las conexiones de producción deberán respetar las políticas de red, autenticación, acceso y seguridad del banco.
- No se intentará eludir firewalls, restricciones de puertos o controles corporativos.
- Si Firefly tampoco está disponible, las operaciones locales seguirán funcionando.

Este requisito no significa que Firefly sustituya automáticamente todas las capacidades de otros modelos. Cada operación de IA deberá mapearse a una API de Firefly compatible o quedar deshabilitada, implementarse localmente o mostrarse como no disponible.

La autenticación de Firefly deberá utilizar las credenciales OAuth Server-to-Server aprobadas en Adobe Developer Console, almacenadas en el entorno seguro correspondiente. Nunca se incluirán secretos en el frontend, en el repositorio ni en los mensajes enviados a otra IA.

## Mandamiento 14. AJO no se conectará directamente a MCP sin una integración compatible

Adobe Journey Optimizer Custom Actions están diseñadas para llamar servicios HTTP REST con payloads JSON y mecanismos de autenticación admitidos.

No se supondrá que una Custom Action puede ejecutar directamente cualquier protocolo MCP.

Si se necesita invocar herramientas MCP desde un journey, se diseñará una capa REST HTTPS autorizada que valide la petición, aplique permisos, invoque la operación compatible y devuelva una respuesta JSON.

La integración deberá comprobar las restricciones de URL, puertos, métodos HTTP, autenticación y disponibilidad del entorno de destino.

## Mandamiento 15. Ninguna IA podrá declarar terminada una fase sin evidencias

Toda afirmación de éxito deberá respaldarse con pruebas, código inspeccionado, resultados de ejecución o documentación oficial.

Las etiquetas obligatorias de estado serán:

- **IMPLEMENTADO:** el código existe.
- **VERIFICADO:** se ejecutaron pruebas que confirman el comportamiento.
- **SIMULADO:** se usaron datos o respuestas artificiales.
- **PENDIENTE:** falta implementación o validación.
- **BLOQUEADO:** una restricción técnica o de acceso impide avanzar.
- **NO APLICABLE:** existe una justificación documentada.

No se considerará verificada una funcionalidad por compilar, renderizar una pantalla o devolver HTTP 200 si el resultado funcional no ha sido comprobado.

---

# III. FASES OBLIGATORIAS DEL PROYECTO

## Fase 0. Inventario y protección del proyecto

**Objetivo:** conocer el estado real del repositorio antes de modificarlo.

Tareas:

1. Identificar la estructura de carpetas.
2. Revisar el `package.json`, scripts, Dockerfile y Docker Compose.
3. Identificar los servicios Agent Hub, MCP y Flow Studio.
4. Localizar el código Rust de PhotoCraft y sus formatos de entrada y salida.
5. Identificar las vistas actuales de PhotoCraft, Jobs y Flow Studio.
6. Localizar las llamadas a MongoDB Atlas, Google y otros proveedores.
7. Identificar las rutas, los endpoints y los mecanismos de autenticación.
8. Registrar las dependencias del arquetipo Adobe.
9. Crear una rama de trabajo y proteger la versión estable.
10. Documentar comandos reproducibles para ejecutar y probar el proyecto.

**Criterios de aceptación:**

- Inventario de módulos completado.
- Dependencias externas identificadas.
- Arquitectura y puntos de entrada documentados.
- No se han eliminado funcionalidades.
- Existe una referencia clara de la versión inicial.

**No avanzar a la fase siguiente sin conocer el punto de entrada real de los módulos afectados.**

## Fase 1. Modo local-first y datos deterministas

**Objetivo:** ejecutar la aplicación sin depender de servicios remotos.

Tareas:

1. Crear adaptadores para datos locales y remotos.
2. Incorporar datos ficticios coherentes para assets, jobs y flujos.
3. Crear una configuración explícita `local`, `auto` y `cloud`.
4. Deshabilitar las conexiones externas en modo local.
5. Proporcionar mensajes claros de disponibilidad y error.
6. Mantener los mismos contratos de datos entre adaptadores cuando sea posible.
7. Evitar pérdida de trabajo cuando falle una conexión.

**Criterios de aceptación:**

- La interfaz arranca sin credenciales externas.
- Los datos demo se muestran de manera consistente.
- El modo local no intenta acceder a MongoDB Atlas, Google ni proveedores de IA.
- Los datos simulados se identifican como tales.
- El modo cloud muestra errores reales cuando un servicio no está disponible.

## Fase 2. Editor de assets en HTML y JavaScript nativo

**Objetivo:** crear una herramienta web independiente de PhotoCraft Rust.

Tareas:

1. Implementar una vista de editor dentro de la aplicación.
2. Crear la paleta de herramientas con HTML, CSS y JavaScript nativo.
3. Implementar carga y previsualización de formatos compatibles.
4. Añadir rotación, volteo, recorte y ajustes básicos de imagen.
5. Implementar deshacer y rehacer.
6. Incorporar exportación del resultado.
7. Añadir controles de edición y mensajes de error.
8. Mantener el archivo original intacto por defecto.
9. Probar imágenes de diferentes dimensiones y formatos.
10. Documentar los formatos y las operaciones realmente soportados.

**Criterios de aceptación:**

- El editor se abre dentro de la aplicación.
- No redirige al usuario a un sitio de terceros.
- La vista funciona sin recursos remotos.
- Los cambios se reflejan en la previsualización.
- La exportación produce un archivo válido.
- Los cambios se pueden deshacer cuando corresponda.
- No se declara soporte para formatos que no hayan sido probados.

## Fase 3. Jobs, miniaturas y persistencia

**Objetivo:** conectar la vista de trabajos con archivos y resultados reales o simulados, según el modo seleccionado.

Tareas:

1. Corregir la carga de jobs.
2. Verificar rutas de assets y miniaturas.
3. Mostrar estados, errores y resultados.
4. Conectar los resultados del editor con los jobs correspondientes.
5. Implementar persistencia local.
6. Evitar sobrescrituras accidentales.
7. Preparar el adaptador para el almacenamiento externo autorizado.

**Criterios de aceptación:**

- Los assets aparecen en la vista de Jobs.
- Las miniaturas se cargan correctamente.
- Los errores se muestran sin bloquear toda la aplicación.
- El resultado exportado puede volver a abrirse.
- El almacenamiento local sigue funcionando sin MongoDB Atlas.

## Fase 4. Flow Studio y ejecución de agentes

**Objetivo:** generar diagramas fieles al modelo de ejecución.

Tareas:

1. Localizar la fuente de verdad del grafo.
2. Identificar nodos, dependencias y transiciones.
3. Corregir las conexiones y las flechas.
4. Incorporar estados de ejecución.
5. Separar la simulación de la ejecución real.
6. Permitir probar flujos con datos estáticos.
7. Añadir registros de errores y resultados.

**Criterios de aceptación:**

- El diagrama refleja las relaciones definidas.
- Las flechas apuntan a los destinos correctos.
- Los nodos no se marcan como completados sin evidencia.
- El flujo demo puede ejecutarse de manera reproducible.
- El sistema distingue las ejecuciones simuladas de las reales.

## Fase 5. MCP y herramientas compartidas

**Objetivo:** permitir que un agente utilice las capacidades del editor mediante herramientas autorizadas.

Tareas:

1. Revisar el servidor MCP existente.
2. Registrar herramientas de edición y consulta.
3. Definir esquemas de entrada y salida.
4. Conectar las herramientas con el servicio común de edición.
5. Aplicar autenticación y permisos.
6. Implementar respuestas estructuradas.
7. Probar errores, parámetros inválidos y operaciones no autorizadas.
8. Documentar cómo registrar el servidor en los clientes MCP compatibles.

**Criterios de aceptación:**

- Un cliente MCP puede descubrir las herramientas disponibles.
- Las herramientas ejecutan operaciones reales sobre datos locales.
- El usuario humano y MCP comparten las mismas reglas de negocio.
- Las operaciones no autorizadas se rechazan en el servidor.
- No se requiere un proveedor de IA externo para probar las herramientas.

## Fase 6. Firefly y conectividad autorizada

**Objetivo:** añadir capacidades de IA remota sin comprometer el funcionamiento local.

Tareas:

1. Identificar las APIs de Firefly autorizadas para la organización.
2. Verificar permisos y credenciales de Adobe Developer Console.
3. Crear un adaptador aislado para Firefly.
4. Mantener las credenciales exclusivamente en el backend.
5. Definir tiempos de espera, límites y manejo de errores.
6. Implementar la política de proveedores permitidos.
7. Verificar que el modo local no invoque Firefly.
8. Evaluar la capa REST necesaria para integraciones AJO-MCP.

**Criterios de aceptación:**

- La autenticación real se prueba con credenciales autorizadas.
- Los secretos no aparecen en el código del cliente.
- Firefly solo se utiliza para operaciones compatibles con sus APIs.
- La aplicación continúa operando localmente cuando Firefly no está disponible.
- Ningún proveedor de IA no autorizado recibe solicitudes.

## Fase 7. Compatibilidad y despliegue Adobe

**Objetivo:** validar el camino de integración con el ecosistema Adobe del cliente.

Tareas:

1. Identificar el producto Adobe de destino.
2. Confirmar el arquetipo y su versión.
3. Revisar los puntos de extensión oficialmente soportados.
4. Determinar si corresponde App Builder, UI Extensibility u otro mecanismo.
5. Revisar los requisitos de identidad, autorización y despliegue.
6. Validar los endpoints HTTPS públicos que deban consumir los servicios Adobe.
7. Documentar las limitaciones de red y las políticas del banco.
8. Preparar un despliegue de prueba.
9. Validar el proceso de aprobación del cliente.
10. Documentar las diferencias entre el entorno local y el de producción.

**Criterios de aceptación:**

- La compatibilidad se sustenta en documentación del producto de destino.
- La extensión se prueba en el entorno correspondiente.
- Las dependencias externas están autorizadas.
- Se documentan las limitaciones de producción.
- No se afirma que un módulo aparecerá en la cuenta del cliente hasta verificar el proceso oficial de publicación e instalación.

## Fase 8. Pruebas finales y entrega

**Objetivo:** demostrar que el sistema satisface los requisitos.

Tareas:

1. Ejecutar las pruebas del editor.
2. Ejecutar las pruebas de Jobs y persistencia.
3. Ejecutar las pruebas de Flow Studio.
4. Ejecutar las pruebas MCP.
5. Probar el modo local sin red externa.
6. Probar el comportamiento ante servicios remotos no disponibles.
7. Ejecutar las comprobaciones de seguridad.
8. Revisar dependencias y licencias.
9. Documentar instalación y configuración.
10. Entregar un resumen de cambios y pruebas.

**Criterios de aceptación:**

- No se han eliminado funcionalidades originales sin aprobación.
- Las funciones principales tienen pruebas reproducibles.
- Los resultados simulados están identificados.
- Las funciones remotas están probadas o declaradas pendientes.
- La configuración local está documentada.
- Existe una lista de limitaciones conocidas.
- No quedan secretos en el repositorio.

---

# IV. PROTOCOLO PARA TRABAJAR CON MÚLTIPLES IA

El proyecto podrá alternar entre ChatGPT, Claude, Gemini, Copilot u otras herramientas, pero todas deberán seguir estas reglas.

## Regla A. Un solo repositorio y una sola fuente de verdad

Todas las IA trabajarán sobre la misma versión actual del repositorio o sobre una copia claramente identificada de esa versión.

No se considerará válida una propuesta basada en archivos inexistentes, versiones antiguas o estructuras inventadas.

## Regla B. Cada intervención debe declarar su alcance

Antes de modificar el código, la IA debe identificar:

- Fase actual.
- Archivos que necesita revisar.
- Problema concreto que resolverá.
- Dependencias y contratos afectados.
- Pruebas que realizará.
- Riesgos y limitaciones.

## Regla C. No duplicar trabajo ya terminado

Antes de implementar una función, debe revisarse si ya existe.

Si ya existe, se corregirá o ampliará la implementación original en lugar de crear una alternativa paralela.

## Regla D. No introducir dependencias innecesarias

Cada biblioteca nueva debe justificarse por una necesidad real.

La propuesta deberá indicar:

- Por qué es necesaria.
- Qué alternativa nativa existe.
- Si funciona sin conexión.
- Si requiere un CDN o servicio externo.
- Si afecta a la compatibilidad Adobe.
- Si introduce riesgos de licencia o mantenimiento.

## Regla E. Las entregas deben ser reproducibles

Cada IA debe especificar:

- Archivos creados o modificados.
- Cambios funcionales.
- Comandos de instalación y ejecución.
- Pruebas ejecutadas.
- Resultados observados.
- Problemas pendientes.
- Cambios que otra IA no debe repetir.

No se aceptarán expresiones como «ya está todo listo» sin evidencia.

## Regla F. Las IA no deben compartir secretos

No introducir credenciales, tokens, claves privadas, cookies ni valores de `.env.local` en prompts, commits, logs o archivos de ejemplo.

Los ejemplos deberán usar valores ficticios.

## Regla G. Los cambios deben ser pequeños y reversibles

Cada fase debe producir una entrega verificable. Las modificaciones se harán en ramas o commits separados cuando sea posible.

Si una modificación rompe funcionalidades existentes, deberá revertirse o corregirse antes de continuar.

## Regla H. No ocultar incertidumbres

Si falta un archivo, una API, una credencial o un permiso, la IA deberá indicarlo.

No inventará endpoints, funciones Rust, contratos MCP ni comportamientos de Adobe.

---

# V. PLANTILLA OBLIGATORIA DE ENTREGA ENTRE IA

Cada IA deberá terminar su intervención con el siguiente informe:

**Fase trabajada:**  
**Objetivo de la intervención:**  
**Archivos revisados:**  
**Archivos modificados:**  
**Funciones implementadas:**  
**Pruebas ejecutadas:**  
**Resultados observados:**  
**Funciones simuladas:**  
**Dependencias añadidas:**  
**Problemas pendientes:**  
**Riesgos de integración:**  
**Siguiente tarea recomendada:**  
**Criterios de aceptación cumplidos:**  
**Criterios de aceptación pendientes:**

La siguiente IA deberá leer este informe, comprobar los cambios en el repositorio y continuar desde el estado real del código.

---

# VI. DEFINICIÓN DE TERMINADO

El proyecto no se considerará terminado por tener una interfaz atractiva ni porque el servidor arranque.

Se considerará listo para evaluación cuando:

1. La aplicación pueda iniciarse localmente.
2. El editor HTML permita editar y exportar assets compatibles.
3. La vista de Jobs muestre assets, estados y resultados.
4. Flow Studio represente conexiones y estados correctos.
5. Las herramientas MCP compartan el servicio de edición.
6. Los permisos se validen en el backend.
7. Los datos demo funcionen sin servicios externos.
8. El modo local no invoque proveedores externos.
9. Firefly pueda integrarse con credenciales autorizadas, si el entorno lo permite.
10. Las limitaciones de Adobe y del banco estén documentadas.
11. Las pruebas diferencien operaciones reales de simulaciones.
12. Las modificaciones no hayan destruido funcionalidades existentes.

# VII. FUENTES OFICIALES PARA VERIFICACIÓN

Toda IA que trabaje en integraciones Adobe deberá consultar la documentación vigente antes de afirmar compatibilidad.

- **Adobe Journey Optimizer — Custom Actions:**  
  https://experienceleague.adobe.com/en/docs/journey-optimizer/using/configure-journeys/action-journeys/about-custom-action-configuration

- **Adobe Journey Optimizer — Uso de Custom Actions:**  
  https://experienceleague.adobe.com/en/docs/journey-optimizer/using/orchestrate-journeys/about-journey-building/using-custom-actions

- **Adobe Firefly Services — Autenticación:**  
  https://developer.adobe.com/firefly-services/docs/firefly-api/getting-started/

- **Adobe Developer Console — Credenciales de Firefly:**  
  https://developer.adobe.com/firefly-services/docs/firefly-api/getting-started/dev-console/

- **Model Context Protocol — Arquitectura:**  
  https://modelcontextprotocol.io/

- **Adobe Experience League:**  
  https://experienceleague.adobe.com/

Estas fuentes establecen mecanismos y requisitos de los productos documentados, pero no sustituyen la verificación del arquetipo, los permisos y el entorno específico del cliente.

---

# VIII. INSTRUCCIÓN MAESTRA PARA CUALQUIER IA

Eres un colaborador técnico del proyecto Martech Engineer Dynamic Media AJO.

Tu misión es continuar el trabajo sobre el repositorio existente y cumplir los mandamientos de este documento.

Antes de proponer cambios, inspecciona el código disponible. Identifica la fase actual y los criterios de aceptación pendientes. No reconstruyas el proyecto desde cero ni sustituyas módulos existentes sin autorización.

Prioriza un editor de assets en HTML, CSS y JavaScript nativo, un modo local-first, una vista fiable de Jobs, un Flow Studio basado en relaciones reales y herramientas MCP que compartan las mismas reglas de negocio y permisos.

Mantén PhotoCraft Rust como parte del contexto del proyecto, pero no lo conviertas en requisito del nuevo editor web.

Respeta la restricción de producción: Firefly será el único proveedor de IA externo autorizado si así lo establece el cliente. Los demás agentes y herramientas deberán operar localmente o permanecer aislados según las políticas del banco. No intentes eludir controles corporativos.

No afirmes que el arquetipo garantiza una extensión Adobe, que un servicio se conectó, que un archivo se guardó o que una prueba pasó sin evidencia.

Entrega cambios pequeños, reversibles y verificables. Documenta lo implementado, lo probado, lo simulado y lo pendiente.

**Objetivo final: una única plataforma, varias IA colaboradoras, un solo repositorio y un mismo conjunto de criterios de aceptación.**
