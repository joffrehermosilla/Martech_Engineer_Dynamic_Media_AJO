import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://joffre:joffre@bootcamp-microservicios.c9yhl.mongodb.net/ajo-cdp-meta-db?retryWrites=true&w=majority";
const DB_NAME = process.env.DB_NAME || "ajo-cdp-meta-db";

let cachedClient = null;

export async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    });
    await cachedClient.connect();
    console.log(`[MongoDB Atlas] Connected successfully to database: ${DB_NAME}`);
  }
  return cachedClient.db(DB_NAME);
}

/**
 * Validates an Asset Request against BCP Governance Mandamientos
 * Prevents AI hallucinations, guarantees brand compliance, and verifies initiative validity.
 */
export async function validateAssetRequest(initiativeId, intention, briefText, channel = "AJO_INWEB") {
  try {
    const db = await getDb();

    // 1. Validate Initiative ID
    const initiative = await db.collection("initiatives").findOne({
      initiativeId: initiativeId,
      status: "ACTIVE"
    });

    if (!initiative) {
      return {
        decision: "DENY",
        reason: `Iniciativa '${initiativeId}' no encontrada o inactiva en el catálogo de BCP.`,
        mandamientoId: "MAND-001-VALID-INITIATIVE",
        allowed: false
      };
    }

    // 2. Validate Allowed Channels
    if (initiative.allowedChannels && !initiative.allowedChannels.includes(channel)) {
      return {
        decision: "DENY",
        reason: `El canal '${channel}' no está autorizado para la iniciativa '${initiative.name}'. Canales autorizados: ${initiative.allowedChannels.join(", ")}`,
        mandamientoId: "MAND-002-CHANNEL-RESTRICTION",
        allowed: false
      };
    }

    // 3. Load Brand Mandamientos (Rules)
    const mandamientos = await db.collection("governance_mandamientos").findOne({ policyVersion: "BCP_BRAND_V1" });
    const forbiddenKeywords = mandamientos?.forbiddenTerms || [
      "100% garantizado", "sin evaluacion", "sin evaluación",
      "gratis de por vida", "dinero facil", "dinero fácil",
      "sorteo millonario", "criptomoneda", "bitcoin"
    ];

    const normalizedBrief = (briefText || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 4. Hallucination & Forbidden Terms Check
    for (const term of forbiddenKeywords) {
      const normalizedTerm = term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalizedBrief.includes(normalizedTerm)) {
        return {
          decision: "DENY",
          reason: `Violación de gobernanza: el brief incluye el término no permitido '${term}'. Riesgo de alucinación o promesa publicitaria indebida.`,
          mandamientoId: "MAND-003-NO-HALLUCINATION",
          allowed: false
        };
      }
    }

    // 5. Sensitive Intention Check (Requires Human Review)
    const sensitiveIntentions = ["CREDIT_DEFAULT", "COLLECTIONS", "URGENT_KYC", "LEGAL_NOTICE"];
    if (sensitiveIntentions.includes(intention)) {
      return {
        decision: "REVIEW_REQUIRED",
        reason: `La intención '${intention}' está categorizada como de Alto Riesgo Bancario. Requiere aprobación obligatoria de Legal y Marca antes de publicar.`,
        mandamientoId: "MAND-004-HUMAN-IN-THE-LOOP",
        allowed: false,
        requiresHumanApproval: true
      };
    }

    // 6. Check for Reusable Assets in Catalog
    const reusableAssets = await db.collection("asset_catalog").find({
      initiativeId: initiativeId,
      status: "APPROVED"
    }).limit(3).toArray();

    return {
      decision: "ALLOW",
      reason: "La solicitud cumple con todos los mandamientos de marca, gobernanza de iniciativa y canal.",
      allowed: true,
      initiativeName: initiative.name,
      category: initiative.category,
      suggestedDisclaimers: initiative.mandatoryDisclaimers || ["Sujeto a evaluación crediticia. Más información en viabcp.com"],
      reusableAssetsFound: reusableAssets.length,
      reusableAssets: reusableAssets.map(a => ({
        assetId: a.assetId,
        title: a.title,
        deliveryUrl: a.deliveryUrl,
        category: a.category
      }))
    };

  } catch (err) {
    console.error("[GovernanceEngine] Error evaluating request:", err.message);
    // Fail closed: Never grant automatic approval on database outage
    return {
      decision: "REVIEW_REQUIRED",
      reason: `Error de verificación en repositorio de gobernanza (${err.message}). Bloqueo preventivo Fail-Closed.`,
      allowed: false,
      requiresHumanApproval: true
    };
  }
}

/**
 * Register Asset in Catalog & Audit Trail
 */
export async function registerAssetInCatalog(assetData) {
  const db = await getDb();
  const doc = {
    ...assetData,
    createdAt: new Date(),
    status: assetData.status || "DRAFT"
  };

  const result = await db.collection("asset_catalog").insertOne(doc);
  await db.collection("audit_log").insertOne({
    action: "ASSET_REGISTERED",
    assetId: assetData.assetId,
    initiativeId: assetData.initiativeId,
    actor: assetData.actor || "AI_AGENT_HUB",
    timestamp: new Date()
  });

  return result;
}
