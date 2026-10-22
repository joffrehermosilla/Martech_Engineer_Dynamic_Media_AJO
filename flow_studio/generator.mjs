import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.resolve(__dirname, "../resources/flow-template.html");

/**
 * Default Baseline Architecture Flow: AEM Dynamic Media + PhotoCraft + AJO + Azure + CDP
 */
export const DEFAULT_AEM_FLOW_MODEL = {
  size: { w: 1800, h: 900 },
  lanes: [
    { id: "aep", name: "AEM DAM & Dynamic Media", role: "Fuente Oficial de Activos y Entrega CDN", x: 0, w: 300 },
    { id: "user", name: "PhotoCraft Engine", role: "Edición & Composición Sandbox", x: 300, w: 300 },
    { id: "azure", name: "Agent Hub & MCP", role: "Gobernanza Mongo Atlas & Router IA", x: 600, w: 300 },
    { id: "ajo", name: "Adobe Journey Optimizer", role: "Orquestación de Experiencias InWeb", x: 900, w: 300 },
    { id: "meta", name: "Meta WhatsApp API", role: "Canal de Mensajería Saliente", x: 1200, w: 300 },
    { id: "cdp", name: "AEP / Adobe CDP", role: "Ingesta de Streaming & Feedback Logs", x: 1500, w: 300 }
  ],
  nodes: [
    { id: "n_brief", lane: "azure", kind: "step", x: 630, y: 120, w: 240, h: 70, t: "Solicitud de Asset", s: "Validación Mandamientos BCP", cd: "INITIATIVE_VALIDATE" },
    { id: "n_router", lane: "azure", kind: "step", x: 630, y: 240, w: 240, h: 70, t: "Router Multi-IA", s: "Groq / Gemini / Firefly Fallback", cd: "PROMPT_SYNTHESIS" },
    { id: "n_photocraft", lane: "user", kind: "step", x: 330, y: 240, w: 240, h: 70, t: "PhotoCraft Sandbox", s: "Crop, Resize, Brand Watermark", cd: "BATCH_RECIPE" },
    { id: "n_human", lane: "azure", kind: "decision", x: 720, y: 360, w: 60, h: 60, t: "Revisión Humana", s: "Brand & Rights Approval", cd: "APPROVE_OR_DENY" },
    { id: "n_aem_upload", lane: "aep", kind: "step", x: 30, y: 360, w: 240, h: 70, t: "Direct Binary Upload", s: "AEM as a Cloud Service DAM", cd: "METADATA_SYNC" },
    { id: "n_dm_delivery", lane: "aep", kind: "step", x: 30, y: 500, w: 240, h: 70, t: "Dynamic Media Delivery", s: "URL CDN: AVIF / WebP / JPEG", cd: "MIME_VERIFIED" },
    { id: "n_ajo_inweb", lane: "ajo", kind: "step", x: 930, y: 500, w: 240, h: 70, t: "AJO InWeb Proposition", s: "Entrega de Banner Personalizado", cd: "PROPOSITION_DISPLAY" },
    { id: "n_meta_wa", lane: "meta", kind: "step", x: 1230, y: 500, w: 240, h: 70, t: "WhatsApp Header Media", s: "Template con URL de Asset", cd: "WAMID_GENERATION" },
    { id: "n_cdp_feedback", lane: "cdp", kind: "step", x: 1530, y: 500, w: 240, h: 70, t: "Streaming Ingestion", s: "Dataset Whatsapp Feedback & Delivery", cd: "CDP_DATASET_V1" }
  ],
  edges: [
    { id: "e1", from: "n_brief", to: "n_router", pts: [[750, 190], [750, 240]], dash: false },
    { id: "e2", from: "n_router", to: "n_photocraft", pts: [[630, 275], [570, 275]], dash: false },
    { id: "e3", from: "n_photocraft", to: "n_human", pts: [[450, 310], [450, 390], [720, 390]], dash: false },
    { id: "e4", from: "n_human", to: "n_aem_upload", pts: [[720, 390], [270, 390]], dash: false },
    { id: "e5", from: "n_aem_upload", to: "n_dm_delivery", pts: [[150, 430], [150, 500]], dash: false },
    { id: "e6", from: "n_dm_delivery", to: "n_ajo_inweb", pts: [[270, 535], [930, 535]], dash: true },
    { id: "e7", from: "n_dm_delivery", to: "n_meta_wa", pts: [[270, 535], [500, 600], [1230, 535]], dash: true },
    { id: "e8", from: "n_meta_wa", to: "n_cdp_feedback", pts: [[1470, 535], [1530, 535]], dash: false }
  ],
  tours: [
    {
      name: "Flujo Completo: Creación, PhotoCraft, DAM y Entrega AJO/Meta",
      accent: "#FF7800",
      steps: [
        {
          node: "n_brief",
          title: "1. Validación de Solicitud en Mongo Atlas",
          desc: "Se verifica que la iniciativa ID esté activa y el brief no contenga promesas indebidas.",
          origin: "Marketing BCP", target: "Agent Hub", proto: "REST JSON",
          json: { initiativeId: "INIT-BCP-CAMP-2026-01", channel: "AJO_INWEB", decision: "ALLOW" }
        },
        {
          node: "n_router",
          title: "2. Síntesis de Brief con Router de IA",
          desc: "Se genera el brief visual normalizado con Groq o Gemini asegurando la paleta oficial BCP.",
          origin: "Agent Hub", target: "Groq/Gemini LPU", proto: "HTTPS Bearer",
          json: { model: "llama-3.3-70b", latencyMs: 240, prompt: "Generar especificaciones de composición..." }
        },
        {
          node: "n_photocraft",
          title: "3. Edición en PhotoCraft Sandbox",
          desc: "PhotoCraft aplica recorte 1200x628, marcas de agua BCP y optimización de render.",
          origin: "Agent Hub", target: "PhotoCraft Engine", proto: "MCP / CLI",
          json: { engine: "PhotoCraft", operations: ["crop", "watermark", "tone_mapping"], format: "AVIF" }
        },
        {
          node: "n_aem_upload",
          title: "4. Ingesta Oficial a AEM DAM",
          desc: "Carga del binario aprobado vía Direct Binary Upload hacia AEM Cloud Service.",
          origin: "Agent Hub", target: "AEM Assets Cloud", proto: "Direct Binary API",
          json: { assetPath: "/content/dam/martechdynamicmediaajo/asset.avif", status: "PROCESSING" }
        },
        {
          node: "n_dm_delivery",
          title: "5. Publicación en Dynamic Media CDN",
          desc: "Generación de URL de entrega de alta velocidad y verificación de formato MIME real.",
          origin: "AEM DAM", target: "Dynamic Media CDN", proto: "HTTP CDN",
          json: { deliveryUrl: "https://delivery-p187030-e1959235.adobeaemcloud.com/adobe/assets/.../as/asset.avif", mime: "image/avif" }
        },
        {
          node: "n_cdp_feedback",
          title: "6. Trazabilidad & Streaming Ingestion",
          desc: "Recepción de eventos de entrega y clics para auditoría unificada en Adobe Experience Platform.",
          origin: "Meta / AJO", target: "AEP Streaming Endpoint", proto: "DCS HTTP",
          json: { eventType: "decisioning.propositionInteract", flowId: "f3cffd10-8fe9-4952-9e39-91d03bab4f85" }
        }
      ]
    }
  ],
  details: {
    n_brief: {
      title: "Solicitud de Asset & Mandamientos",
      subtitle: "Gobernanza de Marca BCP",
      lane: "azure",
      laneName: "Agent Hub & MCP",
      summary: "Comprueba en MongoDB Atlas que la iniciativa exista, el canal esté permitido y los mandamientos no sean vulnerados.",
      inputs: ["initiativeId", "intention", "briefText", "targetChannel"],
      outputs: ["Decision: ALLOW | DENY | REVIEW_REQUIRED", "suggestedDisclaimers"],
      rules: ["Fail-Closed: Ante error de base de datos, no aprobar automáticamente.", "Verificar que no haya promesas de rentabilidad o préstamos sin evaluación."]
    },
    n_photocraft: {
      title: "PhotoCraft Sandbox Engine",
      subtitle: "Motor Rust de Edición y Composición",
      lane: "user",
      laneName: "PhotoCraft Engine",
      summary: "Transforma imágenes mediante recetas de automatización sin modificar el archivo original de AEM DAM.",
      inputs: ["sourceImagePath", "recipe.json", "targetDimensions"],
      outputs: ["candidateImage.avif", "output_metadata.json", "appliedOperations"],
      rules: ["Ejecución aislada por Job ID", "Conversión precisa de perfiles de color BCP"]
    },
    n_dm_delivery: {
      title: "Dynamic Media CDN Delivery",
      subtitle: "Entrega Omnicanal de Alto Rendimiento",
      lane: "aep",
      laneName: "AEM DAM & Dynamic Media",
      summary: "Distribuye activos aprobados con transformaciones en tiempo real para AJO InWeb y cabeceras WhatsApp.",
      inputs: ["aemAssetId", "renditionProfile"],
      outputs: ["deliveryUrl", "mimeVerifiedHeader"],
      rules: ["Verificar Content-Type real antes de enviar a canales móviles.", "Asegurar compatibilidad de formatos (AVIF para Web, JPEG/PNG para WhatsApp)."]
    }
  }
};

/**
 * PLANTILLA: DAM Governance & Roles
 * Flujo de gobierno de activos con roles ADMIN/MARTECH/VCD
 */
const DAM_GOVERNANCE_ROLES_MODEL = {
  size: { w: 1800, h: 900 },
  lanes: [
    { id: "admin", name: "Administrador DAM", role: "Gobernanza, Políticas & Control de Acceso", x: 0, w: 300 },
    { id: "martech", name: "Martech Engineer", role: "Reglas, Casos de Uso & Aprobaciones", x: 300, w: 300 },
    { id: "vcd", name: "Visual Content Designer", role: "Creación & Edición de Assets", x: 600, w: 300 },
    { id: "photocraft", name: "PhotoCraft Engine", role: "Transformación & Composición", x: 900, w: 300 },
    { id: "atlas", name: "MongoDB Atlas", role: "Estado, Catálogo & Audit Trail", x: 1200, w: 300 },
    { id: "approvals", name: "Flujo de Aprobaciones", role: "Notificaciones & Estado Final", x: 1500, w: 300 }
  ],
  nodes: [
    { id: "n_policy_create", lane: "admin", kind: "step", x: 30, y: 120, w: 240, h: 70, t: "Crear Política DAM", s: "Grupos de Red & Permisos de Rol", cd: "POLICY_CRUD" },
    { id: "n_squad_assign", lane: "admin", kind: "step", x: 30, y: 240, w: 240, h: 70, t: "Asignar Squads", s: "Perfiles & Roles por Equipo", cd: "SQUAD_MGMT" },
    { id: "n_usecase_define", lane: "martech", kind: "step", x: 330, y: 120, w: 240, h: 70, t: "Definir Caso de Uso", s: "Iniciativa + Canal + Intención", cd: "USECASE_DEF" },
    { id: "n_brief_validate", lane: "martech", kind: "step", x: 330, y: 240, w: 240, h: 70, t: "Validar Brief", s: "Mandamientos BCP Atlas", cd: "BRIEF_VALIDATE" },
    { id: "n_asset_create", lane: "vcd", kind: "step", x: 630, y: 240, w: 240, h: 70, t: "Crear Asset", s: "VCD carga imagen base", cd: "ASSET_UPLOAD" },
    { id: "n_pc_transform", lane: "photocraft", kind: "step", x: 930, y: 240, w: 240, h: 70, t: "Transformar Asset", s: "Crop, Resize, Watermark, AVIF", cd: "PC_BATCH" },
    { id: "n_review_gate", lane: "martech", kind: "decision", x: 420, y: 400, w: 60, h: 60, t: "Gate de Revisión", s: "Aprobación Martech/Legal", cd: "REVIEW_GATE" },
    { id: "n_catalog_register", lane: "atlas", kind: "step", x: 1230, y: 400, w: 240, h: 70, t: "Registrar en Catálogo", s: "MongoDB Atlas asset_catalog", cd: "CATALOG_WRITE" },
    { id: "n_notify_pending", lane: "approvals", kind: "step", x: 1530, y: 300, w: 240, h: 70, t: "Notificar Pendiente", s: "Notificación Push a Aprobador", cd: "NOTIFY_PUSH" },
    { id: "n_final_approved", lane: "approvals", kind: "step", x: 1530, y: 500, w: 240, h: 70, t: "Estado: APROBADO", s: "Asset publicado & URL activa", cd: "STATUS_APPROVED" },
    { id: "n_final_rejected", lane: "approvals", kind: "step", x: 1530, y: 650, w: 240, h: 70, t: "Estado: RECHAZADO", s: "Feedback al VCD para corrección", cd: "STATUS_REJECTED" }
  ],
  edges: [
    { id: "e1", from: "n_policy_create", to: "n_usecase_define", pts: [[270, 155], [330, 155]], dash: false },
    { id: "e2", from: "n_squad_assign", to: "n_asset_create", pts: [[270, 275], [630, 275]], dash: true },
    { id: "e3", from: "n_usecase_define", to: "n_brief_validate", pts: [[450, 190], [450, 240]], dash: false },
    { id: "e4", from: "n_brief_validate", to: "n_asset_create", pts: [[570, 275], [630, 275]], dash: false },
    { id: "e5", from: "n_asset_create", to: "n_pc_transform", pts: [[870, 275], [930, 275]], dash: false },
    { id: "e6", from: "n_pc_transform", to: "n_review_gate", pts: [[1050, 310], [1050, 430], [480, 430]], dash: false },
    { id: "e7", from: "n_review_gate", to: "n_catalog_register", pts: [[480, 430], [1230, 435]], dash: false },
    { id: "e8", from: "n_review_gate", to: "n_notify_pending", pts: [[480, 430], [1530, 335]], dash: true },
    { id: "e9", from: "n_notify_pending", to: "n_final_approved", pts: [[1650, 370], [1650, 500]], dash: false },
    { id: "e10", from: "n_notify_pending", to: "n_final_rejected", pts: [[1650, 370], [1650, 650]], dash: true }
  ],
  tours: [
    {
      name: "Flujo de Gobierno DAM por Roles",
      accent: "#0084FF",
      steps: [
        { node: "n_policy_create", title: "1. Admin crea Política DAM", desc: "El Admin configura grupos de red, permisos y políticas de gobernanza que aplican a todos los roles." , origin: "Admin", target: "MongoDB Atlas", proto: "REST", json: { policyId: "POL-001", networkGroup: "MARTECH_TEAM", allowedRoles: ["MARTECH", "VCD"] } },
        { node: "n_usecase_define", title: "2. Martech define Caso de Uso", desc: "El Martech Engineer define la iniciativa, canal objetivo e intención del asset.", origin: "Martech", target: "Agent Hub", proto: "UI", json: { initiativeId: "INIT-BCP-CAMP-2026-01", channel: "EMAIL", intention: "PROMOTION" } },
        { node: "n_asset_create", title: "3. VCD crea el Asset", desc: "El diseñador carga la imagen base y la envía al motor PhotoCraft para transformación.", origin: "VCD", target: "PhotoCraft", proto: "MCP", json: { operation: "AJO_INWEB_BANNER", format: "jpg", sourceImage: "asset_base.png" } },
        { node: "n_review_gate", title: "4. Gate de Revisión", desc: "El Martech Engineer recibe notificación y aprueba o rechaza el asset candidato.", origin: "System", target: "Martech Approver", proto: "Notification", json: { assetId: "AST-001", status: "PENDING_APPROVAL" } },
        { node: "n_final_approved", title: "5. Asset Aprobado", desc: "El asset queda en estado APPROVED en el catálogo con URL de entrega activa.", origin: "Martech", target: "Atlas Catalog", proto: "REST", json: { assetId: "AST-001", status: "APPROVED", deliveryUrl: "https://cdn.bcp.com/assets/banner.avif" } }
      ]
    }
  ],
  details: {
    n_policy_create: {
      title: "Crear Política DAM", subtitle: "Gobernanza de Acceso",
      lane: "admin", laneName: "Administrador DAM",
      summary: "El Admin crea políticas que definen qué roles pueden acceder a qué funciones, vinculadas a grupos de red.",
      inputs: ["roleName", "networkGroup", "allowedTabs", "canApprove"],
      outputs: ["policyId", "accessToken"],
      rules: ["Solo el rol ADMIN puede crear políticas", "Las políticas se aplican por grupo de red"]
    },
    n_review_gate: {
      title: "Gate de Revisión", subtitle: "Aprobación Multi-nivel",
      lane: "martech", laneName: "Martech Engineer",
      summary: "Punto de decisión donde el Martech/Admin revisa el asset candidato y decide APPROVE o REJECT.",
      inputs: ["assetId", "previewUrl", "governanceResult"],
      outputs: ["APPROVED | REJECTED", "comment", "auditEntry"],
      rules: ["Solo roles con canApprove pueden actuar", "Toda decisión queda en audit_log"]
    }
  }
};

/**
 * PLANTILLA: Email Marketing Flow
 */
const EMAIL_MARKETING_MODEL = {
  size: { w: 1800, h: 900 },
  lanes: [
    { id: "brief", name: "Brief & Estrategia", role: "Definición de Campaña Email", x: 0, w: 300 },
    { id: "content", name: "Contenido & Assets", role: "Generación y Edición de Piezas", x: 300, w: 300 },
    { id: "template", name: "HTML Template", role: "Maquetación y Responsive Design", x: 600, w: 300 },
    { id: "ajo", name: "Adobe Journey Optimizer", role: "Orquestación y Personalización", x: 900, w: 300 },
    { id: "delivery", name: "Email Delivery", role: "Envío y Tracking", x: 1200, w: 300 },
    { id: "analytics", name: "Analytics & CDP", role: "Métricas y Audiencia", x: 1500, w: 300 }
  ],
  nodes: [
    { id: "n_campaign", lane: "brief", kind: "step", x: 30, y: 120, w: 240, h: 70, t: "Definir Campaña", s: "Segmento, Objetivo, KPIs", cd: "CAMPAIGN_DEF" },
    { id: "n_subject", lane: "brief", kind: "step", x: 30, y: 250, w: 240, h: 70, t: "Subject & Preheader", s: "A/B Testing con IA", cd: "SUBJECT_GEN" },
    { id: "n_hero_image", lane: "content", kind: "step", x: 330, y: 120, w: 240, h: 70, t: "Hero Image", s: "PhotoCraft 600x300px Email Header", cd: "HERO_GEN" },
    { id: "n_copy_ai", lane: "content", kind: "step", x: 330, y: 250, w: 240, h: 70, t: "Copy con IA", s: "Router IA genera cuerpo del email", cd: "COPY_GEN" },
    { id: "n_html_build", lane: "template", kind: "step", x: 630, y: 180, w: 240, h: 70, t: "Build HTML", s: "Maquetación Responsive BCP", cd: "HTML_BUILD" },
    { id: "n_preview_test", lane: "template", kind: "decision", x: 720, y: 310, w: 60, h: 60, t: "Preview Test", s: "Desktop & Mobile Check", cd: "PREVIEW_OK" },
    { id: "n_ajo_journey", lane: "ajo", kind: "step", x: 930, y: 180, w: 240, h: 70, t: "Journey Trigger", s: "Segmento CDP + Personalización", cd: "JOURNEY_START" },
    { id: "n_send_batch", lane: "delivery", kind: "step", x: 1230, y: 180, w: 240, h: 70, t: "Envío Batch", s: "Bulk Email con Throttling", cd: "EMAIL_SEND" },
    { id: "n_open_track", lane: "delivery", kind: "step", x: 1230, y: 330, w: 240, h: 70, t: "Open Tracking", s: "Pixel & Link Click Events", cd: "OPEN_TRACK" },
    { id: "n_cdp_ingest", lane: "analytics", kind: "step", x: 1530, y: 250, w: 240, h: 70, t: "CDP Ingesta", s: "Open/Click Rates a AEP", cd: "CDP_EMAIL" }
  ],
  edges: [
    { id: "e1", from: "n_campaign", to: "n_subject", pts: [[150, 190], [150, 250]], dash: false },
    { id: "e2", from: "n_campaign", to: "n_hero_image", pts: [[270, 155], [330, 155]], dash: false },
    { id: "e3", from: "n_subject", to: "n_copy_ai", pts: [[150, 320], [150, 370], [330, 285]], dash: false },
    { id: "e4", from: "n_hero_image", to: "n_html_build", pts: [[570, 155], [630, 215]], dash: false },
    { id: "e5", from: "n_copy_ai", to: "n_html_build", pts: [[570, 285], [630, 215]], dash: false },
    { id: "e6", from: "n_html_build", to: "n_preview_test", pts: [[750, 250], [750, 310]], dash: false },
    { id: "e7", from: "n_preview_test", to: "n_ajo_journey", pts: [[780, 340], [930, 215]], dash: false },
    { id: "e8", from: "n_ajo_journey", to: "n_send_batch", pts: [[1170, 215], [1230, 215]], dash: false },
    { id: "e9", from: "n_send_batch", to: "n_open_track", pts: [[1350, 250], [1350, 330]], dash: false },
    { id: "e10", from: "n_open_track", to: "n_cdp_ingest", pts: [[1470, 365], [1530, 285]], dash: true }
  ],
  tours: [
    {
      name: "Flujo de Campaña Email Marketing",
      accent: "#E53935",
      steps: [
        { node: "n_campaign", title: "1. Definición de Campaña", desc: "Se definen segmento objetivo, KPIs y canal Email.", origin: "Marketing", target: "Agent Hub", proto: "UI", json: { segment: "CREDITO_PERSONAL", objective: "CTR 3%", channel: "EMAIL" } },
        { node: "n_hero_image", title: "2. Generación de Hero Image", desc: "PhotoCraft genera imagen de 600x300 para email header.", origin: "VCD/Agent", target: "PhotoCraft", proto: "MCP", json: { op: "EMAIL_HEADER", w: 600, h: 300, format: "jpg" } },
        { node: "n_html_build", title: "3. Build HTML Responsive", desc: "Maquetación del email con estructura HTML responsive con assets embebidos.", origin: "Template Engine", target: "HTML Preview", proto: "Flow Export", json: { template: "BCP_EMAIL_V2", responsive: true } },
        { node: "n_send_batch", title: "4. Envío vía AJO", desc: "Adobe Journey Optimizer envía el batch con personalización por segmento.", origin: "AJO", target: "Email Delivery", proto: "SMTP/API", json: { batchSize: 50000, personalizedFields: ["firstName", "creditLimit"] } }
      ]
    }
  ],
  details: {}
};

/**
 * PLANTILLA: Social Media Assets Flow
 */
const SOCIAL_MEDIA_MODEL = {
  size: { w: 1800, h: 900 },
  lanes: [
    { id: "brief", name: "Brief Creativo", role: "Estrategia de Contenido Social", x: 0, w: 300 },
    { id: "gen_ai", name: "IA Generativa", role: "Firefly / Router IA / Prompt", x: 300, w: 300 },
    { id: "photocraft", name: "PhotoCraft", role: "Edición Multi-formato", x: 600, w: 300 },
    { id: "approval", name: "Revisión & Aprobación", role: "Brand Safety & Compliance", x: 900, w: 300 },
    { id: "dam", name: "DAM Catálogo", role: "Almacenamiento & Versionado", x: 1200, w: 300 },
    { id: "publish", name: "Publicación", role: "Multi-canal Social Media", x: 1500, w: 300 }
  ],
  nodes: [
    { id: "n_brief_social", lane: "brief", kind: "step", x: 30, y: 120, w: 240, h: 70, t: "Brief Social Media", s: "Plataforma, Formato, Mensaje", cd: "SOCIAL_BRIEF" },
    { id: "n_prompt_gen", lane: "gen_ai", kind: "step", x: 330, y: 120, w: 240, h: 70, t: "Generación por IA", s: "Firefly / Groq Image Prompt", cd: "AI_GEN" },
    { id: "n_instagram", lane: "photocraft", kind: "step", x: 630, y: 80, w: 240, h: 60, t: "Instagram Square", s: "1080x1080 AVIF", cd: "INSTAGRAM_SQ" },
    { id: "n_story", lane: "photocraft", kind: "step", x: 630, y: 180, w: 240, h: 60, t: "Story/Reel", s: "1080x1920 MP4/PNG", cd: "STORY_FORMAT" },
    { id: "n_linkedin", lane: "photocraft", kind: "step", x: 630, y: 280, w: 240, h: 60, t: "LinkedIn Banner", s: "1200x627 PNG", cd: "LINKEDIN_BAN" },
    { id: "n_twitter", lane: "photocraft", kind: "step", x: 630, y: 380, w: 240, h: 60, t: "Twitter/X Card", s: "800x418 PNG", cd: "TWITTER_CARD" },
    { id: "n_brand_review", lane: "approval", kind: "decision", x: 990, y: 230, w: 60, h: 60, t: "Brand Review", s: "Compliance & Safe Content", cd: "BRAND_REVIEW" },
    { id: "n_dam_store", lane: "dam", kind: "step", x: 1230, y: 220, w: 240, h: 70, t: "Almacenar en DAM", s: "Asset Catalog + Tags IA", cd: "DAM_STORE" },
    { id: "n_schedule", lane: "publish", kind: "step", x: 1530, y: 220, w: 240, h: 70, t: "Programar Publicación", s: "Multi-canal con horario óptimo", cd: "SCHEDULE_PUB" }
  ],
  edges: [
    { id: "e1", from: "n_brief_social", to: "n_prompt_gen", pts: [[270, 155], [330, 155]], dash: false },
    { id: "e2", from: "n_prompt_gen", to: "n_instagram", pts: [[570, 155], [630, 110]], dash: false },
    { id: "e3", from: "n_prompt_gen", to: "n_story", pts: [[570, 155], [630, 210]], dash: false },
    { id: "e4", from: "n_prompt_gen", to: "n_linkedin", pts: [[570, 155], [630, 310]], dash: false },
    { id: "e5", from: "n_prompt_gen", to: "n_twitter", pts: [[570, 155], [630, 410]], dash: false },
    { id: "e6", from: "n_instagram", to: "n_brand_review", pts: [[870, 110], [1020, 230]], dash: false },
    { id: "e7", from: "n_story", to: "n_brand_review", pts: [[870, 210], [1020, 230]], dash: false },
    { id: "e8", from: "n_linkedin", to: "n_brand_review", pts: [[870, 310], [1020, 260]], dash: false },
    { id: "e9", from: "n_brand_review", to: "n_dam_store", pts: [[1050, 260], [1230, 255]], dash: false },
    { id: "e10", from: "n_dam_store", to: "n_schedule", pts: [[1470, 255], [1530, 255]], dash: false }
  ],
  tours: [
    {
      name: "Flujo Social Media Multi-formato",
      accent: "#9C27B0",
      steps: [
        { node: "n_brief_social", title: "1. Brief Social", desc: "Definición de plataformas objetivo, mensaje y tono de comunicación.", origin: "Marketing", target: "Agent Hub", proto: "UI", json: { platforms: ["instagram", "linkedin", "twitter"], campaign: "Préstamo al Toque" } },
        { node: "n_prompt_gen", title: "2. Generación IA", desc: "Router IA genera prompt optimizado para cada formato usando Firefly o Groq.", origin: "Agent Hub", target: "Firefly/Groq", proto: "API", json: { prompt: "Banner bancario moderno, colores BCP azul y naranja", style: "corporate_modern" } },
        { node: "n_brand_review", title: "3. Brand Review", desc: "Revisión automática de seguridad de marca antes de publicar.", origin: "Governance Engine", target: "Compliance", proto: "Rules Engine", json: { forbiddenTerms: 0, brandScore: 0.94 } }
      ]
    }
  ],
  details: {}
};

/**
 * PLANTILLA: Workfront Asset Governance
 */
const WORKFRONT_GOVERNANCE_MODEL = {
  size: { w: 1800, h: 900 },
  lanes: [
    { id: "workfront", name: "Adobe Workfront", role: "Gobierno de Proyectos & Assets", x: 0, w: 300 },
    { id: "dam", name: "AEM DAM", role: "Repositorio Central de Assets", x: 300, w: 300 },
    { id: "agent_hub", name: "Agent Hub DAM", role: "Automatización & MCP", x: 600, w: 300 },
    { id: "approval", name: "Aprobaciones", role: "Workflow de Revisión", x: 900, w: 300 },
    { id: "delivery", name: "Entrega Omnicanal", role: "AJO / DM / WhatsApp", x: 1200, w: 300 },
    { id: "audit", name: "Audit & Trazabilidad", role: "MongoDB Atlas Logs", x: 1500, w: 300 }
  ],
  nodes: [
    { id: "n_wf_task", lane: "workfront", kind: "step", x: 30, y: 120, w: 240, h: 70, t: "Tarea Workfront", s: "Creación de Asset Request", cd: "WF_TASK" },
    { id: "n_wf_url", lane: "workfront", kind: "step", x: 30, y: 250, w: 240, h: 70, t: "Gobierno de URL", s: "URL de Asset vinculada a Tarea", cd: "WF_URL" },
    { id: "n_dam_check", lane: "dam", kind: "step", x: 330, y: 120, w: 240, h: 70, t: "Check en DAM", s: "Buscar Asset Reutilizable", cd: "DAM_SEARCH" },
    { id: "n_agent_create", lane: "agent_hub", kind: "step", x: 630, y: 180, w: 240, h: 70, t: "Crear Asset IA", s: "PhotoCraft + Router IA", cd: "ASSET_CREATE" },
    { id: "n_governance", lane: "agent_hub", kind: "decision", x: 720, y: 330, w: 60, h: 60, t: "Validar Gobernanza", s: "Mandamientos BCP Atlas", cd: "GOV_CHECK" },
    { id: "n_approval_wf", lane: "approval", kind: "step", x: 930, y: 250, w: 240, h: 70, t: "Aprobación Workfront", s: "Notificación al Aprobador", cd: "WF_APPROVAL" },
    { id: "n_publish_dm", lane: "delivery", kind: "step", x: 1230, y: 180, w: 240, h: 70, t: "Publicar Dynamic Media", s: "CDN URL + AJO InWeb", cd: "DM_PUBLISH" },
    { id: "n_sync_wf", lane: "delivery", kind: "step", x: 1230, y: 330, w: 240, h: 70, t: "Sync a Workfront", s: "URL final & Status Completado", cd: "WF_SYNC" },
    { id: "n_audit_log", lane: "audit", kind: "step", x: 1530, y: 250, w: 240, h: 70, t: "Audit Log Atlas", s: "Trazabilidad completa del Asset", cd: "AUDIT_WRITE" }
  ],
  edges: [
    { id: "e1", from: "n_wf_task", to: "n_dam_check", pts: [[270, 155], [330, 155]], dash: false },
    { id: "e2", from: "n_wf_task", to: "n_wf_url", pts: [[150, 190], [150, 250]], dash: false },
    { id: "e3", from: "n_dam_check", to: "n_agent_create", pts: [[570, 155], [630, 215]], dash: true },
    { id: "e4", from: "n_agent_create", to: "n_governance", pts: [[750, 250], [750, 330]], dash: false },
    { id: "e5", from: "n_governance", to: "n_approval_wf", pts: [[780, 360], [930, 285]], dash: false },
    { id: "e6", from: "n_approval_wf", to: "n_publish_dm", pts: [[1170, 285], [1230, 215]], dash: false },
    { id: "e7", from: "n_publish_dm", to: "n_sync_wf", pts: [[1350, 250], [1350, 330]], dash: false },
    { id: "e8", from: "n_sync_wf", to: "n_audit_log", pts: [[1470, 365], [1530, 285]], dash: false },
    { id: "e9", from: "n_wf_url", to: "n_sync_wf", pts: [[270, 285], [1230, 365]], dash: true }
  ],
  tours: [
    {
      name: "Flujo Workfront + DAM Governance",
      accent: "#107C41",
      steps: [
        { node: "n_wf_task", title: "1. Tarea en Workfront", desc: "El proyecto crea una tarea de asset en Workfront con requerimientos de campaña.", origin: "PM Workfront", target: "Agent Hub", proto: "API REST", json: { taskId: "WF-2026-001", assetType: "BANNER", dueDate: "2026-11-01" } },
        { node: "n_governance", title: "2. Validación de Gobernanza", desc: "Agent Hub valida el asset contra mandamientos BCP antes de aprobar.", origin: "Agent Hub", target: "MongoDB Atlas", proto: "REST", json: { decision: "ALLOW", mandamientoId: "MAND-001" } },
        { node: "n_sync_wf", title: "3. Sync de vuelta a Workfront", desc: "La URL final del asset publicado se vincula a la tarea de Workfront.", origin: "Agent Hub", target: "Workfront API", proto: "REST", json: { taskId: "WF-2026-001", assetUrl: "https://cdn.bcp.com/assets/banner.avif", status: "COMPLETED" } }
      ]
    }
  ],
  details: {
    n_wf_task: {
      title: "Tarea Workfront", subtitle: "Gobierno de Asset Request",
      lane: "workfront", laneName: "Adobe Workfront",
      summary: "Workfront actúa como sistema de registro para el gobierno de assets. Cada asset tiene una tarea asociada con dueño, fechas y estado.",
      inputs: ["projectId", "assetType", "requiredChannels", "dueDate"],
      outputs: ["taskId", "assigneeId", "assetRequestId"],
      rules: ["Toda creación de asset debe tener tarea en Workfront", "La URL final del asset debe quedar en Workfront al completarse"]
    }
  }
};

/**
 * Registro de todas las plantillas disponibles
 */
export const FLOW_TEMPLATES = {
  AEM_DYNAMIC_MEDIA_E2E: {
    label: "AEM Dynamic Media + PhotoCraft + AJO E2E",
    description: "Flujo completo de creación, validación y entrega de assets",
    icon: "⚡",
    model: DEFAULT_AEM_FLOW_MODEL
  },
  DAM_GOVERNANCE_ROLES: {
    label: "Gobierno DAM por Roles (Admin/Martech/VCD)",
    description: "Flujo de roles, políticas y aprobaciones DAM",
    icon: "🛡️",
    model: DAM_GOVERNANCE_ROLES_MODEL
  },
  EMAIL_MARKETING: {
    label: "Email Marketing Campaign Flow",
    description: "Creación de assets y envío de campañas email con AJO",
    icon: "📧",
    model: EMAIL_MARKETING_MODEL
  },
  SOCIAL_MEDIA: {
    label: "Social Media Multi-formato (Instagram/LinkedIn/Twitter)",
    description: "Generación y publicación de assets en redes sociales",
    icon: "📱",
    model: SOCIAL_MEDIA_MODEL
  },
  WORKFRONT_GOVERNANCE: {
    label: "Workfront + DAM Asset Governance",
    description: "Gobierno de assets vinculado a proyectos de Workfront",
    icon: "🏢",
    model: WORKFRONT_GOVERNANCE_MODEL
  },
  WHATSAPP_AZURE_CDP: {
    label: "WhatsApp Cloud API + Azure + CDP Trazabilidad",
    description: "Correlación de eventos WhatsApp con Azure y AJO CDP",
    icon: "💬",
    model: DEFAULT_AEM_FLOW_MODEL // Reutilizar base, se diferencia por título
  }
};

/**
 * Builds a standalone dynamic HTML interactive diagram from a Flow Model
 */
export async function renderFlowToHtml(model = DEFAULT_AEM_FLOW_MODEL, options = {}) {
  let template = await fs.readFile(TEMPLATE_PATH, "utf-8");

  const title = options.title || "Mapa Dinámico de Arquitectura Martech | BCP Dynamic Media & AJO";
  const badge = options.badge || "BCP ARQUITECTURA";
  const brandTitle = options.brandTitle || "Flow Studio • Entendimiento Técnico";
  const brandSub = options.brandSub || "Diagramas Dinámicos Interactivos de Arquitectura & Trazabilidad";

  template = template.replaceAll("{{TITLE}}", title);
  template = template.replaceAll("{{BADGE}}", badge);
  template = template.replaceAll("{{BRAND_TITLE}}", brandTitle);
  template = template.replaceAll("{{BRAND_SUB}}", brandSub);
  template = template.replaceAll("{{LANE_VARS}}", "");
  template = template.replaceAll("{{FOOTER}}", "Banco de Crédito del Perú BCP • Arquitectura de Integración Martech Dynamic Media & AJO");

  // Inject FLOW JSON
  const flowJson = JSON.stringify(model);
  template = template.replace("/*__FLOW__*/null", flowJson);

  return template;
}
