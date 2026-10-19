import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { executePromptWithFallback } from "../agent-hub/services/providerRouter.mjs";

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
