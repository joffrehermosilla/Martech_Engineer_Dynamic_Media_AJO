# MANDAMIENTO RECTOR — MARTECH ENGINEER DYNAMIC MEDIA AJO
## Arquitectura resiliente, Local-First, AEM Embedded, Agent Hub, DAM Craft, Workfront y Workfront Fusion

**Versión:** 3.0  
**Fecha:** 7 de noviembre de 2026  
**Proyecto:** Martech Engineer Dynamic Media AJO  
**Repositorio:** `joffrehermosilla/Martech_Engineer_Dynamic_Media_AJO`

---

# 1. OBJETIVO GENERAL

Construir una plataforma Martech empresarial que integre Adobe Experience Manager (AEM), DAM, Dynamic Media, Adobe Journey Optimizer (AJO), Adobe Experience Platform (AEP/CDP), agentes de IA, servidores MCP, MongoDB Atlas, Workfront y Workfront Fusion.

La solución debe permitir:

- Administrar, buscar, crear, transformar y reutilizar assets digitales.
- Gestionar metadata, contratos, licencias y derechos de uso.
- Utilizar agentes de IA para demostraciones y operaciones autorizadas.
- Integrar proveedores de IA intercambiables, incluido Adobe Firefly.
- Mantener la información sincronizada entre Agent Hub, MongoDB Atlas, Workfront y Workfront Fusion.
- Continuar funcionando cuando una o varias conexiones externas no estén disponibles.
- Desplegar la interfaz dentro de AEM sin depender de que GitHub Pages o un servidor local sean el backend corporativo.
- Permitir una migración progresiva desde la demostración local hasta una arquitectura empresarial desplegada en Adobe.

**Regla fundamental:** ninguna integración existente debe eliminarse por el hecho de que otra alternativa pueda cubrir temporalmente su función.

La arquitectura debe ser híbrida, resiliente, intercambiable y con persistencia desacoplada.

# 2. PRINCIPIO CENTRAL: SWITCH DE CONECTIVIDAD

No se debe implementar una arquitectura que dependa exclusivamente de MongoDB Atlas, Workfront, Fusion, Firefly o un proveedor de IA.

Debe existir un mecanismo central de configuración y selección de rutas denominado:

`Connectivity Manager`

Su responsabilidad será comprobar la disponibilidad y autorización de cada integración y decidir qué adaptador utilizar.

## 2.1 Modos de operación

| Modo | Comportamiento |
|---|---|
| LOCAL | Utiliza datos demo, JSON persistente, agentes simulados, reglas deterministas y almacenamiento local. No realiza llamadas a servicios externos. |
| AUTO | Intenta utilizar los servicios disponibles y autorizados. Si una conexión falla, cambia a un adaptador alternativo sin perder la operación. |
| CLOUD | Utiliza los servicios corporativos configurados y autorizados. Si una dependencia no está disponible, aplica la política de contingencia definida para esa capacidad. |

El cambio de modo puede ser manual o automático.

La selección debe poder configurarse por capacidad, no únicamente de forma global.

Ejemplo:

- Persistencia: Atlas no disponible → Workfront/Fusion → almacenamiento local.
- Generación de texto: proveedor autorizado disponible → ejecución real; de lo contrario → agente demo con plantillas deterministas.
- Generación visual: Firefly disponible y autorizado → generación real; de lo contrario → edición manual con DAM Craft.
- Gestión de trabajo: Workfront disponible → sincronización de proyectos, tareas y aprobaciones; de lo contrario → datos demo locales.
- Automatización: Fusion disponible → escenario de automatización; de lo contrario → ejecución local controlada.

El estado de una integración debe distinguir entre:

- Configurada.
- Autorizada.
- Disponible.
- No disponible.
- Deshabilitada.
- En contingencia.
- Pendiente de sincronización.

Tener una API Key configurada no significa que el proveedor esté autorizado ni que esté disponible.

## 2.2 Switch visual

La interfaz debe mostrar un panel de conectividad con:

- Modo global: LOCAL / AUTO / CLOUD.
- Estado individual de MongoDB Atlas.
- Estado de Workfront.
- Estado de Workfront Fusion.
- Estado de AEM.
- Estado de Firefly.
- Estado de cada proveedor de IA.
- Estado de MCP.
- Estado de almacenamiento local.
- Última comprobación.
- Última sincronización.
- Operaciones pendientes.
- Errores y motivos de contingencia.

El switch debe permitir cambiar de modo sin reiniciar la aplicación cuando técnicamente sea posible.

No debe modificar ni eliminar datos existentes al cambiar de modo.

# 3. ARQUITECTURA DE PERSISTENCIA Y RETROALIMENTACIÓN

La plataforma debe conservar todas las opciones de almacenamiento.

## 3.1 MongoDB Atlas

MongoDB Atlas se mantiene como la base de datos principal prevista para la evolución empresarial.

Responsabilidades:

- Catálogo de assets.
- Contratos y licencias.
- Relaciones entre assets y contratos.
- Historial de uso.
- Memoria y contexto de agentes.
- Historial de ejecuciones.
- Metadatos de campañas.
- Estado de trabajos.
- Versiones y trazabilidad.
- Registro de sincronización.

La integración actual no debe eliminarse ni sustituirse.

Cuando Atlas esté disponible y autorizado, será el repositorio principal de datos estructurados.

En el futuro, una base de datos empresarial será necesaria para soportar el crecimiento, las consultas, la concurrencia, la auditoría y la persistencia de largo plazo.

## 3.2 Adobe Workfront

Workfront no será únicamente un sistema de consulta.

Debe participar en el flujo operativo y conservar los registros de negocio que correspondan.

Debe contemplarse que Workfront contenga información equivalente a la utilizada por Agent Hub, por ejemplo:

- Proyectos.
- Tareas.
- Campañas.
- Solicitudes.
- Aprobaciones.
- Responsables.
- Estados.
- Referencias a assets.
- Identificadores de operaciones.
- Información necesaria para reconstruir el contexto de una ejecución.

Cuando Atlas no esté disponible, el sistema debe poder consultar los registros equivalentes de Workfront si la integración está habilitada.

Workfront debe participar también en el flujo normal, no solamente en situaciones de emergencia.

No se debe asumir que todos los documentos, archivos o registros de Workfront son equivalentes a una base de datos transaccional.

## 3.3 Adobe Workfront Fusion

Workfront Fusion será parte normal de la arquitectura híbrida.

No debe limitarse a ser un mecanismo de fallback.

Responsabilidades:

- Automatizar procesos.
- Orquestar escenarios.
- Recibir eventos y webhooks.
- Conectar Workfront con servicios autorizados.
- Ejecutar sincronizaciones.
- Gestionar reintentos.
- Transportar registros entre sistemas.
- Activar flujos de aprobación.
- Coordinar operaciones cuando Atlas no esté disponible.
- Recuperar operaciones pendientes cuando se restablezca la conexión.

Se debe considerar el almacenamiento de Workfront Fusion y su capacidad de hasta 100 MB, conforme al límite disponible para la configuración contratada y documentada.

**Restricción importante:** los 100 MB no convierten Fusion en una base de datos empresarial ni justifican almacenar indefinidamente todo el histórico de la plataforma.

Fusion podrá mantener los registros operativos necesarios, datos temporales, eventos pendientes y copias de trabajo dentro de los límites disponibles.

La persistencia de largo plazo y el crecimiento de datos deben quedar preparados para una base de datos.

## 3.4 Almacenamiento local

El almacenamiento local debe continuar siendo funcional y persistente.

Debe incluir:

- JSON de datos demo.
- Catálogo local.
- Contratos demo.
- Registro de decisiones.
- Historial de agentes.
- Trabajos pendientes.
- Eventos no sincronizados.
- Versiones de assets y metadata.
- Configuración de la aplicación.

El almacenamiento local no debe ser una simulación que desaparece al reiniciar el servidor.

Debe mantener los datos entre reinicios y permitir exportar o recuperar información.

## 3.5 Sincronización bidireccional

Debe implementarse una capa independiente:

`Data Synchronization Manager`

Su objetivo es mantener retroalimentación entre:

- Agent Hub.
- MongoDB Atlas.
- Workfront.
- Workfront Fusion.
- Almacenamiento local.
- AEM Assets cuando corresponda.

Flujo normal:

1. Agent Hub registra una operación.
2. La operación se persiste en Atlas.
3. Workfront recibe la información de negocio correspondiente.
4. Fusion ejecuta las automatizaciones y sincronizaciones aplicables.
5. Los cambios relevantes de Workfront regresan a Agent Hub y Atlas.
6. Se actualizan estados, versiones e historial.

Flujo cuando Atlas no está disponible:

1. Agent Hub registra la operación en almacenamiento local.
2. Consulta Workfront cuando esté disponible y autorizado.
3. Fusion recibe o procesa los eventos correspondientes.
4. Los registros pendientes se conservan.
5. Al restablecerse Atlas, se sincronizan los cambios.
6. Agent Hub actualiza el estado de sincronización.

Si Workfront tampoco está disponible:

1. Se continúa con almacenamiento local.
2. Los agentes demo y las funcionalidades que no dependan de servicios externos siguen funcionando.
3. Se conserva una cola persistente.
4. La sincronización se ejecuta cuando los servicios vuelvan a estar disponibles.

**No se deben perder operaciones por fallos de conectividad.**

## 3.6 Integridad de sincronización

Cada operación debe contar con:

- `operationId`.
- `recordId`.
- `correlationId`.
- `sourceSystem`.
- `targetSystem`.
- `createdAt`.
- `updatedAt`.
- `version`.
- `syncStatus`.
- `retryCount`.
- `lastSyncAt`.
- `payloadHash`.

Se deben implementar:

- Idempotencia.
- Control de duplicados.
- Reintentos con límites.
- Registro de errores.
- Detección de conflictos.
- Resolución de conflictos mediante reglas explícitas.
- Auditoría de modificaciones.
- Cola de salida y recepción persistente.

No se debe utilizar simplemente la fecha de modificación para sobrescribir datos sin comprobar su versión y origen.

Los conflictos de contratos, derechos de uso, aprobaciones y metadata crítica deben poder enviarse a revisión humana.

# 4. AGENTES DE IA Y PROVEEDORES

Todos los agentes existentes y previstos deben permanecer incluidos.

La arquitectura debe permitir ejecutar agentes reales cuando las conexiones estén autorizadas y disponibles, y agentes de demostración cuando no lo estén.

## 4.1 Proveedores

Se deben conservar los adaptadores existentes y preparar la integración de:

- Google Gemini.
- Groq.
- OpenAI.
- DeepSeek.
- Adobe Firefly.
- Otros proveedores expresamente autorizados.

No se debe eliminar un proveedor existente durante una refactorización sin autorización.

El sistema debe distinguir las capacidades de cada proveedor:

- Generación de texto.
- Razonamiento.
- Análisis.
- Visión.
- Generación de imágenes.
- Edición de imágenes.
- Clasificación.
- Extracción de metadata.

Firefly es una opción importante del ecosistema Adobe, especialmente para capacidades visuales, pero no debe ser el único componente de IA de la arquitectura.

No se debe asumir que Firefly sustituye automáticamente las capacidades de razonamiento y texto de todos los agentes.

## 4.2 Agentes de demostración

Los agentes deben poder demostrar el flujo completo sin depender de API Keys.

Los resultados demo deben ser deterministas, identificables y reproducibles.

No deben presentarse como resultados reales de un proveedor externo.

Cada ejecución debe indicar:

- Agente.
- Proveedor.
- Modo de ejecución.
- Capacidad utilizada.
- Datos de entrada.
- Resultado.
- Estado.
- Tiempo.
- Origen real o demo.
- Identificador de ejecución.

## 4.3 Provider Router

El router actual debe evolucionar sin perder su contrato existente.

Debe:

- Mantener la rotación de claves cuando corresponda.
- Respetar la política de proveedores autorizados.
- Evitar llamadas externas en modo LOCAL.
- Detectar indisponibilidad.
- Gestionar cooldown y reintentos.
- Permitir fallback determinista.
- Distinguir capacidades reales de las simuladas.
- No declarar un proveedor disponible solo porque existe una clave.

La configuración de proveedores debe permanecer fuera del frontend.

# 5. AEM, DAM Y DESPLIEGUE EMBEBIDO

El destino empresarial es que la interfaz pueda desplegarse dentro del ecosistema AEM del banco.

No se debe confundir la interfaz embebida en AEM con la ejecución automática de todos los servicios Node, MCP, agentes y procesos externos.

La arquitectura debe separar:

1. Frontend desplegable en AEM.
2. Servicios Java/OSGi del módulo `core`.
3. Agent Hub y servicios de negocio.
4. Servidor MCP.
5. Adaptadores de almacenamiento.
6. Adaptadores de IA.
7. Workfront y Fusion.
8. MongoDB Atlas o almacenamiento empresarial aprobado.

Las comunicaciones entre componentes deben utilizar APIs y contratos definidos.

El despliegue en AEM debe respetar el arquetipo Adobe y los mecanismos admitidos por Cloud Manager.

No introducir credenciales en JavaScript, HTML, GitHub Pages ni paquetes frontend.

Los secretos deben residir en mecanismos seguros del backend o de la infraestructura autorizada.

Dynamic Media, AJO y AEP deben integrarse según las capacidades y permisos del entorno real de Adobe. No asumir que el SDK local reproduce todas las capacidades de producción.

# 6. GITHUB PAGES Y DEMOSTRACIÓN

GitHub Pages puede utilizarse para publicar la interfaz estática de demostración.

No ejecuta por sí mismo:

- Node.js.
- Agent Hub.
- MCP.
- MongoDB.
- Workfront Fusion.
- Servicios Java.
- Procesos backend.

La publicación debe mantener separados frontend y backend.

La demostración debe funcionar con datos estáticos o adaptadores demo cuando no exista un backend accesible.

Nunca se deben publicar secretos, archivos `.env`, credenciales, tokens ni conexiones privadas.

La versión AEM y la versión GitHub Pages deben compartir los contratos de frontend cuando corresponda, sin asumir que tienen el mismo backend.

# 7. DAM CRAFT: EDITOR Y GESTIÓN DE ASSETS

La evolución del editor debe contemplar el reemplazo progresivo del nombre DAM Craft por DAM Craft, preservando los avisos y las licencias de terceros.

El editor web debe ser HTML/JavaScript y funcionar sin que Rust DAM Craft sea una dependencia obligatoria.

Debe contemplar:

- Carga individual.
- Carga masiva.
- Carga de carpetas.
- Drag and drop.
- Progreso de carga.
- Detección de duplicados.
- Clasificación.
- Colecciones.
- Metadata.
- Historial.
- Versiones.
- Capas.
- Orden Z.
- Opacidad.
- Visibilidad.
- Bloqueo.
- Recorte.
- Transformación.
- Composición.
- Exportación de variantes.

Los assets aprobados deben poder reutilizarse conservando su referencia, versión, procedencia y derechos.

Una composición nueva no debe heredar automáticamente la aprobación de sus piezas originales.

Debe pasar por su propia validación y aprobación cuando corresponda.

DAM Craft debe funcionar en modo local y permitir incorporar posteriormente integraciones autorizadas con AEM, Firefly y otros servicios.

# 8. GOBERNANZA, CONTRATOS Y APROBACIONES

El sistema debe conservar el núcleo de reglas de negocio:

- `SearchCatalog`.
- `CheckUsageRights`.
- `CreateAssetWithMetadata`.
- `LogDecision`.

El control de derechos debe considerar:

- Asset.
- Contrato.
- Proveedor.
- Territorio.
- Canal.
- Fecha de vigencia.
- Restricciones.
- Límites de uso.

Los resultados serán:

- Permitido.
- Denegado.
- Ambiguo.

Ante un resultado denegado o ambiguo, el agente debe detener la operación y solicitar revisión humana.

Workfront debe participar en la gestión de aprobaciones cuando esté integrado.

Fusion podrá automatizar notificaciones, transiciones y sincronizaciones, pero no debe omitir las reglas de negocio ni las aprobaciones obligatorias.

La auditoría debe conservar quién solicitó, quién aprobó, qué se modificó, cuándo y con qué justificación.

# 9. MANDAMIENTOS 16–25

## MANDAMIENTO 16 — NINGUNA INTEGRACIÓN EXISTENTE SE ELIMINA

Toda funcionalidad, proveedor, adaptador, agente, API, servicio o módulo ya existente debe conservarse durante las ampliaciones.

Antes de reemplazar una implementación, se debe inspeccionar su contrato, sus dependencias y sus consumidores.

Las nuevas implementaciones deben ser compatibles o incluir una migración explícita.

No se permite simplificar la arquitectura eliminando funcionalidades sin autorización.

## MANDAMIENTO 17 — SWITCH DE CONECTIVIDAD Y OPERACIÓN RESILIENTE

Toda integración debe poder habilitarse, deshabilitarse y sustituirse mediante configuración.

La aplicación debe contemplar LOCAL, AUTO y CLOUD, además de estados independientes por capacidad.

La indisponibilidad de una integración no debe detener funcionalidades que puedan ejecutarse por otra ruta.

El cambio de modo no debe destruir datos ni reiniciar innecesariamente la aplicación.

## MANDAMIENTO 18 — PERSISTENCIA MULTICANAL Y SINCRONIZACIÓN

MongoDB Atlas, Workfront, Workfront Fusion y almacenamiento local deben formar parte del diseño de persistencia y continuidad.

Atlas seguirá siendo la base de datos principal prevista para la evolución empresarial.

Workfront conservará los registros de negocio equivalentes que correspondan.

Fusion podrá almacenar y transportar registros operativos dentro de su capacidad disponible, considerando el límite de 100 MB indicado para el entorno.

El almacenamiento local mantendrá los datos y operaciones pendientes.

Debe existir sincronización con idempotencia, control de versiones, trazabilidad y resolución de conflictos.

Ninguna alternativa temporal debe convertirse accidentalmente en la única fuente de verdad.

## MANDAMIENTO 19 — WORKFRONT Y FUSION SON PARTE DEL FLUJO NORMAL

Workfront y Workfront Fusion no son únicamente un plan de emergencia.

Workfront gestiona el trabajo, proyectos, tareas, solicitudes y aprobaciones.

Fusion orquesta automatizaciones, eventos, reintentos y sincronizaciones.

Cuando Atlas no esté disponible, el sistema debe poder continuar consultando o registrando la información de negocio mediante las rutas autorizadas de Workfront y Fusion.

Los eventos y documentos deben utilizar los mecanismos apropiados de cada API. No confundir Document Webhooks con Event Subscription API.

## MANDAMIENTO 20 — AGENTES REALES Y AGENTES DEMO COEXISTEN

Los agentes existentes deben conservarse.

La demostración debe funcionar sin API Keys mediante agentes simulados y resultados deterministas.

Cuando existan proveedores autorizados y disponibles, se podrá ejecutar el agente real.

La interfaz debe identificar claramente qué ejecución fue real y cuál fue simulada.

No se permite presentar una simulación como una generación real de IA.

## MANDAMIENTO 21 — PROVEEDORES INTERCAMBIABLES Y FIRE FLY OPCIONAL

Los proveedores de IA deben estar desacoplados del núcleo de negocio.

Se conservarán los proveedores existentes y se incorporará Firefly como opción Adobe cuando esté habilitado y autorizado.

La selección dependerá de la capacidad requerida, autorización, disponibilidad y configuración.

Ningún proveedor externo podrá ejecutarse en modo LOCAL.

No se deben introducir dependencias obligatorias de proveedores que impidan ejecutar la demostración.

## MANDAMIENTO 22 — AEM EMBEDDED SIN ACOPLAMIENTO INDEBIDO

El frontend debe poder desplegarse en AEM respetando el arquetipo Adobe y Cloud Manager.

Los servicios backend, agentes, MCP, almacenamiento y automatizaciones deben permanecer desacoplados.

No asumir que GitHub Pages o AEM frontend ejecutan los servicios backend.

No introducir credenciales ni lógica sensible en el navegador.

La solución debe permitir conectar los servicios mediante endpoints corporativos aprobados.

## MANDAMIENTO 23 — DAM CRAFT Y GOBERNANZA DE ASSETS

DAM Craft debe evolucionar como editor web independiente, con soporte de composición, capas, carga masiva, metadata, versiones y exportación.

Debe conservarse la procedencia de los assets, sus derechos y sus referencias.

Los assets reutilizados no transmiten automáticamente su aprobación a una nueva composición.

El flujo de creación y edición debe respetar las validaciones de derechos y las aprobaciones humanas.

Las licencias y avisos de DAM Craft y otras dependencias deben conservarse.

## MANDAMIENTO 24 — MCP, SEGURIDAD Y AUDITORÍA

Los agentes deben acceder a las capacidades del negocio a través de herramientas y contratos controlados.

Los servidores MCP no deben permitir saltarse:

- Comprobación de derechos.
- Permisos.
- Validación de entradas.
- Aprobaciones.
- Auditoría.
- Políticas de almacenamiento.

Las claves y secretos permanecen en backend.

No se deben abrir puertos entrantes ni eludir controles de red corporativos para habilitar una demostración.

Las integraciones externas deben usar conexiones y endpoints autorizados.

## MANDAMIENTO 25 — DESARROLLO POR FASES, COMPATIBILIDAD Y VERIFICACIÓN

Todo cambio debe respetar la arquitectura actual y ejecutarse por fases verificables.

Antes de modificar archivos se debe inspeccionar el estado real del repositorio.

Cada fase debe contar con:

- Objetivo.
- Archivos afectados.
- Dependencias.
- Cambios propuestos.
- Pruebas.
- Criterios de aceptación.
- Riesgos.
- Resultado comprobado.

No se debe declarar una funcionalidad terminada sin ejecutarla y verificarla.

No se deben borrar datos locales, backups, archivos no rastreados ni configuraciones del usuario.

# 10. FASES ACTUALIZADAS DEL PROYECTO

## FASE 0 — INVENTARIO Y PROTECCIÓN DEL PROYECTO

Objetivo: conocer el estado real antes de modificar.

Actividades:

- Inspeccionar estructura del repositorio.
- Revisar Git y archivos no rastreados.
- Identificar los módulos actuales.
- Revisar Agent Hub.
- Revisar providerRouter.
- Revisar storageAdapter.
- Revisar Workfront y Fusion existentes.
- Revisar MCP.
- Revisar DAM Craft/DAM Craft.
- Identificar APIs y contratos actuales.
- Inventariar pruebas.
- Identificar datos persistentes y backups.

Entregable: diagnóstico técnico y matriz de dependencias.

No se permite sobrescribir ni eliminar implementaciones durante esta fase.

## FASE 1 — ESTABILIZACIÓN LOCAL-FIRST

Objetivo: garantizar que el sistema funcione sin servicios externos.

Actividades:

- Validar almacenamiento JSON persistente.
- Validar datos demo.
- Validar Agent Hub.
- Validar Flow Studio.
- Validar MCP local.
- Validar DAM Craft.
- Validar operaciones de catálogo y contratos.
- Validar reinicio y recuperación.
- Validar modo LOCAL sin llamadas externas.

Entregable: demostración local reproducible.

Criterio de aceptación: el sistema debe poder demostrar el flujo funcional sin MongoDB Atlas, proveedores IA, Google Maps ni conexiones externas.

## FASE 2 — SWITCH DE CONECTIVIDAD Y ADAPTADORES

Objetivo: incorporar la selección de rutas sin eliminar los servicios existentes.

Actividades:

- Implementar Connectivity Manager.
- Definir configuración LOCAL, AUTO y CLOUD.
- Mantener compatibilidad del Provider Router.
- Crear health checks.
- Identificar proveedores autorizados.
- Incorporar fallback determinista.
- Incorporar estados de conectividad por servicio.
- Evitar llamadas externas en LOCAL.
- Implementar fallback por capacidad.

Entregable: panel de conectividad y rutas de ejecución verificables.

## FASE 3 — PERSISTENCIA Y SINCRONIZACIÓN

Objetivo: conservar la información cuando fallen los servicios principales.

Actividades:

- Mantener MongoDB Atlas.
- Mantener almacenamiento local.
- Implementar repositorios desacoplados.
- Incorporar adaptadores Workfront.
- Incorporar adaptadores Fusion.
- Diseñar identificadores y versiones.
- Implementar cola persistente.
- Implementar idempotencia.
- Implementar reintentos.
- Resolver conflictos.
- Registrar operaciones pendientes.
- Recuperar sincronización tras una interrupción.

Entregable: Data Synchronization Manager.

Criterio de aceptación: una operación registrada en modo local o contingente debe poder sincronizarse después sin duplicarse ni perder su trazabilidad.

## FASE 4 — WORKFRONT Y WORKFRONT FUSION

Objetivo: integrar el ecosistema Adobe de gestión y automatización.

Actividades:

- Conectar Workfront.
- Mapear proyectos, tareas, solicitudes y aprobaciones.
- Identificar registros equivalentes entre Workfront y Agent Hub.
- Diseñar escenarios Fusion.
- Implementar recepción de eventos.
- Implementar automatizaciones.
- Implementar almacenamiento operativo de Fusion.
- Controlar el límite de almacenamiento disponible.
- Implementar sincronización con Atlas.
- Implementar contingencia cuando Atlas no responda.
- Implementar recuperación de operaciones pendientes.

Entregable: flujos híbridos Workfront–Fusion–Agent Hub–Atlas.

La integración debe utilizar las APIs y permisos reales disponibles en el entorno. No se deben asumir escenarios creados o conexiones activas sin verificarlos.

## FASE 5 — AGENTES Y PROVEEDORES DE IA

Objetivo: mantener la demostración y habilitar ejecuciones reales autorizadas.

Actividades:

- Auditar todos los agentes existentes.
- Revisar providerRouter.
- Corregir selección de proveedores.
- Conservar rotación de claves y cooldown.
- Implementar política de autorización.
- Implementar capacidades por proveedor.
- Incorporar Firefly como adaptador visual opcional.
- Implementar agentes demo deterministas.
- Registrar resultados y procedencia.
- Probar fallback entre proveedores.
- Probar operación sin API Keys.

Entregable: Agent Hub híbrido, con ejecución real y demo.

## FASE 6 — DAM CRAFT Y CICLO DE VIDA DE ASSETS

Objetivo: completar el editor web y su integración con el DAM.

Actividades:

- Consolidar el nombre DAM Craft.
- Mantener compatibilidad de rutas y datos existentes.
- Implementar carga masiva.
- Implementar gestión de carpetas.
- Implementar editor por capas.
- Implementar composiciones.
- Implementar plantillas.
- Implementar exportaciones.
- Implementar metadata.
- Implementar historial y versiones.
- Integrar validación de derechos.
- Integrar referencias de assets aprobados.
- Preparar integración AEM Assets.

Entregable: editor DAM Craft operativo en modo local y preparado para integración empresarial.

## FASE 7 — AEM EMBEDDED Y DESPLIEGUE ADOBE

Objetivo: preparar la incorporación empresarial.

Actividades:

- Separar frontend y backend.
- Integrar frontend con el proyecto AEM.
- Revisar módulos Java/OSGi.
- Definir endpoints de servicios.
- Preparar autenticación.
- Preparar permisos.
- Preparar secretos.
- Preparar configuración Cloud Manager.
- Validar dependencias externas.
- Preparar integración AEM Assets y Dynamic Media.
- Preparar integración AJO y AEP/CDP.

Entregable: frontend integrado en AEM y arquitectura backend preparada para el entorno autorizado.

## FASE 8 — PUBLICACIÓN Y DEMOSTRACIÓN

Objetivo: permitir mostrar el proyecto sin depender de la infraestructura corporativa.

Actividades:

- Publicar frontend estático en GitHub Pages.
- Mantener datos demo.
- Mantener agentes simulados.
- Mostrar el switch de conectividad.
- Mostrar estados de servicios.
- Mostrar el flujo de Workfront y Fusion con datos demo cuando no exista conexión real.
- Mantener separadas las configuraciones de demostración y producción.
- Verificar que no se publiquen secretos.

Entregable: demostración pública controlada y reproducible.

## FASE 9 — VALIDACIÓN EMPRESARIAL Y ESCALABILIDAD

Objetivo: preparar la operación a largo plazo.

Actividades:

- Validar capacidades y límites de Workfront Fusion.
- Validar persistencia empresarial.
- Dimensionar MongoDB Atlas u otra base autorizada.
- Validar sincronización bajo concurrencia.
- Validar recuperación ante fallos.
- Validar permisos y auditoría.
- Validar AEM, Dynamic Media, AJO y AEP en los entornos disponibles.
- Evaluar monitorización y observabilidad.
- Definir políticas de retención y respaldo.

Entregable: arquitectura empresarial documentada y lista para implementación progresiva.

# 11. CONTRATOS TÉCNICOS QUE DEBEN EXISTIR

Antes de desarrollar nuevas integraciones, deben definirse contratos estables para:

- `StoragePort`.
- `AssetCatalogPort`.
- `ContractRepositoryPort`.
- `AssetStoragePort`.
- `GenerationPort`.
- `ImageEditingPort`.
- `WorkfrontPort`.
- `FusionAutomationPort`.
- `EventRepositoryPort`.
- `SynchronizationPort`.
- `ProviderRegistry`.
- `ConnectivityManager`.

Los adaptadores deben implementar estos contratos sin acoplar los casos de uso a un proveedor concreto.

Los cambios de contrato deben incluir compatibilidad con los consumidores actuales.

# 12. CRITERIOS DE ACEPTACIÓN GLOBAL

La arquitectura se considerará correctamente implementada cuando se demuestre lo siguiente:

1. La aplicación arranca sin servicios externos.
2. Los datos locales sobreviven al reinicio.
3. Los agentes demo ejecutan operaciones deterministas.
4. LOCAL no realiza llamadas externas.
5. AUTO detecta servicios no disponibles.
6. El sistema conserva las integraciones existentes.
7. Atlas puede utilizarse cuando está autorizado.
8. Workfront participa en el flujo normal.
9. Fusion participa en automatizaciones y sincronizaciones.
10. Los registros pueden mantenerse temporalmente en las alternativas disponibles.
11. La recuperación de Atlas no genera duplicados.
12. Las operaciones mantienen su trazabilidad.
13. Los agentes reales utilizan solamente proveedores autorizados.
14. Firefly puede habilitarse sin convertirlo en dependencia obligatoria.
15. DAM Craft funciona sin depender de Rust DAM Craft.
16. Los derechos de uso se validan antes de crear o reutilizar assets.
17. Las aprobaciones humanas no pueden omitirse.
18. El frontend puede integrarse en AEM.
19. GitHub Pages funciona como demostración estática sin exponer secretos.
20. Las pruebas y resultados se documentan con evidencia real.

# 13. INSTRUCCIONES OBLIGATORIAS PARA LAS IA QUE TRABAJEN EN ESTE REPOSITORIO

1. Leer este documento y los documentos de arquitectura existentes antes de proponer cambios.
2. Respetar los Mandamientos 1–15 existentes, complementados por los Mandamientos 16–25 de este documento.
3. No eliminar funcionalidades existentes.
4. No reconstruir módulos sin inspeccionar primero su implementación actual.
5. No inventar archivos, endpoints, servicios, conexiones ni escenarios Fusion.
6. No asumir que una API está operativa porque exista una variable de entorno.
7. No realizar llamadas externas en LOCAL.
8. No solicitar ni publicar secretos.
9. No borrar datos persistentes ni backups.
10. No modificar contratos API sin analizar sus consumidores.
11. Trabajar por fases y entregar cambios verificables.
12. Antes de modificar un archivo, revisar su contenido actual.
13. Entregar archivos completos cuando se solicite una sustitución integral.
14. Proporcionar comandos PowerShell listos para copiar, sin incluir el prompt de terminal.
15. Ejecutar pruebas pertinentes y comunicar exactamente cuáles pasaron y cuáles no.
16. Diferenciar implementaciones reales, simulaciones y funcionalidades pendientes.
17. No introducir servicios que requieran puertos, permisos o conexiones bloqueadas por la red corporativa.
18. No convertir una contingencia temporal en una decisión arquitectónica permanente sin autorización.
19. Preservar licencias, avisos de copyright y atribuciones de terceros.
20. No avanzar a una fase posterior si los criterios de aceptación de la fase actual no están demostrados.

---

# 14. PRINCIPIO FINAL

**Martech Engineer Dynamic Media AJO debe ser una plataforma única con múltiples rutas de ejecución y persistencia, no un conjunto de soluciones independientes que se reemplazan entre sí.**

MongoDB Atlas, Workfront, Workfront Fusion, AEM, AJO, AEP/CDP, los agentes, los proveedores de IA, MCP y DAM Craft deben retroalimentarse mediante contratos controlados.

Si una conexión falla, el sistema cambia de ruta.

Si todas las conexiones externas fallan, el sistema continúa en modo local.

Cuando se recuperan, los registros se sincronizan de manera controlada.

La demostración no debe depender de infraestructura corporativa, pero la arquitectura tampoco debe limitarse a una demostración.

**Construir una solución que funcione hoy en local, se integre mañana en Adobe y pueda escalar posteriormente a una plataforma empresarial con persistencia, gobierno, automatización y trazabilidad.**