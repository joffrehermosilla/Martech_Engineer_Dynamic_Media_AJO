/**
 * workfrontService.mjs
 * Servicio de integración para Adobe Workfront & Adobe Workfront Fusion (Document Webhooks API).
 * 
 * Cumple con:
 * - Adobe Workfront Document Webhooks API Specification:
 *   https://experienceleague.adobe.com/en/docs/workfront/using/adobe-workfront-api/document-webhooks-api/docu-webhook-api
 * - Orquestación con Adobe Workfront Fusion (Integromat) para alternar flujos de la Fase 2:
 *   Recepción de casos de uso (briefs), aprobaciones de assets/proofs y transiciones de estado.
 * - Modo Local-First determinista: funciona tanto conectado a Workfront Cloud como en modo simulación/offline.
 */

import crypto from "crypto";
import { getDb } from "./storageAdapter.mjs";
import { validateAssetRequest } from "./governanceEngine.mjs";
import { executeAssetTransform } from "./assetEditorService.mjs";

/**
 * Metadata oficial según el estándar Document Webhooks API de Adobe Workfront
 */
export function getWorkfrontMetadata() {
  return {
    name: "BCP DAM Craft Integration",
    version: "2.0.0-STAGE2",
    company: "Banco de Crédito del Perú (BCP)",
    provider: "DAM Craft Martech Platform",
    supportedWebhookEvents: [
      "document.approval",
      "document.update",
      "document.create",
      "proof.decision",
      "task.update",
      "project.update",
      "use_case.submit"
    ],
    capabilities: {
      documentUpload: true,
      documentDownload: true,
      thumbnailView: true,
      search: true,
      approvalDelegation: true,
      fusionOrchestration: true,
      multiAssetComposition: true
    },
    endpoints: {
      metadata: "/api/workfront/metadata",
      webhook: "/api/workfront/webhook",
      approvals: "/api/workfront/approvals",
      useCases: "/api/workfront/use-cases",
      fusionTrigger: "/api/workfront/fusion/trigger"
    },
    status: "ACTIVE",
    timestamp: new Date().toISOString()
  };
}

/**
 * Procesar webhook entrante desde Adobe Workfront
 */
export async function processWorkfrontWebhook(body, headers = {}) {
  const db = await getDb();
  const eventId = `wf_evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const timestamp = new Date();

  // Extraer datos comunes normalizados
  const eventType = body.eventType || body.event || body.action || "document.approval";
  const documentId = body.documentId || body.docId || body.assetId || null;
  const projectName = body.projectName || body.project || "Campaña BCP Dynamic Media";
  const status = (body.status || body.decision || "APPROVED").toUpperCase();
  const actor = body.actor || body.user || body.approver || "workfront-approver@viabcp.com";
  const comment = body.comment || body.comments || body.notes || "Aprobación recibida vía Webhook de Workfront";
  const payload = body.payload || body;

  const eventRecord = {
    eventId,
    eventType,
    documentId,
    projectName,
    status,
    actor,
    comment,
    rawPayload: payload,
    headers: {
      userAgent: headers["user-agent"] || "Adobe-Workfront-Webhook/1.0",
      workfrontSignature: headers["x-workfront-signature"] || headers["x-workfront-hmac"] || "SIMULATED_LOCAL"
    },
    processedAt: timestamp,
    outcome: "PROCESSED"
  };

  // 1. Manejo de Aprobaciones de Documentos / Proofs
  if (eventType.includes("approval") || eventType.includes("proof") || eventType === "document.update") {
    if (documentId) {
      // Actualizar estado en asset_catalog
      const updateResult = await db.collection("asset_catalog").findOneAndUpdate(
        { $or: [{ assetId: documentId }, { externalDocId: documentId }] },
        { 
          $set: { 
            status: status === "APPROVED" ? "APPROVED" : "REJECTED",
            workfrontStatus: status,
            approvedBy: actor,
            approvalComment: comment,
            approvedAt: timestamp,
            updatedAt: timestamp
          } 
        },
        { returnDocument: "after" }
      );

      eventRecord.assetUpdated = Boolean(updateResult);
    }
  }

  // 2. Manejo de Nuevos Casos de Uso / Briefs desde Workfront
  if (eventType.includes("use_case") || eventType.includes("brief") || eventType === "project.create") {
    const briefId = body.briefId || `WF-BRF-${Date.now()}`;
    const initiativeId = body.initiativeId || "INIT-BCP-CAMP-2026-01";
    const briefText = body.briefText || body.description || `Caso de uso Workfront: ${projectName}`;
    const channel = body.channel || "AJO_INWEB";

    // Validar automáticamente con el motor de gobernanza BCP
    const governanceResult = await validateAssetRequest(initiativeId, "CREATIVE_GENERATION", briefText, channel);

    const useCaseDoc = {
      briefId,
      source: "ADOBE_WORKFRONT",
      workfrontEventId: eventId,
      projectName,
      initiativeId,
      briefText,
      channel,
      governanceResult,
      status: governanceResult.compliant ? "GOVERNANCE_PASSED" : "REQUIRES_REVIEW",
      createdAt: timestamp,
      createdBy: actor
    };

    await db.collection("workfront_use_cases").insertOne(useCaseDoc);
    eventRecord.useCaseCreated = useCaseDoc;
  }

  // Guardar en colección de auditoría de Workfront
  await db.collection("workfront_events").insertOne(eventRecord);

  // Guardar en bitácora general de la plataforma
  await db.collection("audit_log").insertOne({
    action: "WORKFRONT_WEBHOOK_RECEIVED",
    eventId,
    eventType,
    documentId,
    status,
    actor,
    timestamp
  }).catch(() => {});

  return {
    success: true,
    eventId,
    eventType,
    status,
    documentId,
    message: `Evento de Workfront '${eventType}' procesado exitosamente.`,
    eventRecord
  };
}

/**
 * Orquestación vía Adobe Workfront Fusion (Integromat)
 * Permite que un escenario de Fusion alterne flujos de edición, apruebe o genere activos compuestos
 */
export async function executeFusionAction(actionRequest) {
  const {
    scenarioId = `fusion_scn_${Date.now()}`,
    action = "ALTERNATE_FLOW", // TRANSFORM_ASSET | COMPOSITE_PIECES | VALIDATE_BRIEF | ALTERNATE_FLOW
    parameters = {},
    actor = "workfront-fusion-scenario"
  } = actionRequest;

  const db = await getDb();
  const timestamp = new Date();
  let resultData = {};

  switch (action) {
    case "TRANSFORM_ASSET": {
      // Fusion orquesta transformación de activo en DAM Craft
      resultData = await executeAssetTransform({
        assetId: parameters.assetId,
        sourceImagePath: parameters.sourceImagePath,
        operations: parameters.operations || [],
        outputFormat: parameters.outputFormat || "png",
        actor
      });
      break;
    }

    case "VALIDATE_BRIEF": {
      // Fusion solicita validación de gobernanza para un caso de uso
      resultData = await validateAssetRequest(
        parameters.initiativeId || "INIT-BCP-CAMP-2026-01",
        parameters.intention || "DYNAMIC_CONTENT",
        parameters.briefText || "Brief orquestado por Fusion",
        parameters.channel || "WHATSAPP"
      );
      break;
    }

    case "APPROVE_ASSET": {
      // Fusion confirma aprobación y actualiza el estado del catálogo
      const assetId = parameters.assetId;
      await db.collection("asset_catalog").updateOne(
        { assetId },
        {
          $set: {
            status: "APPROVED",
            workfrontStatus: "FUSION_APPROVED",
            approvedBy: actor,
            approvalComment: parameters.comment || "Aprobado por escenario de Adobe Workfront Fusion",
            updatedAt: timestamp
          }
        }
      );
      resultData = { assetId, status: "APPROVED", approvedBy: actor };
      break;
    }

    case "ALTERNATE_FLOW":
    default: {
      // Alternar o actualizar un flujo guardado en Flow Studio
      const flowId = parameters.flowId;
      const targetState = parameters.targetState || "IN_REVIEW_WORKFRONT";
      if (flowId) {
        await db.collection("saved_flows").updateOne(
          { flowId },
          {
            $set: {
              approvalStatus: targetState,
              fusionScenarioId: scenarioId,
              updatedAt: timestamp,
              updatedBy: actor
            }
          }
        );
      }
      resultData = { flowId, alternateState: targetState, scenarioId };
      break;
    }
  }

  // Registrar auditoría de Fusion
  const fusionLog = {
    scenarioId,
    action,
    parameters,
    result: resultData,
    actor,
    timestamp
  };
  await db.collection("workfront_fusion_logs").insertOne(fusionLog);

  return {
    success: true,
    scenarioId,
    action,
    result: resultData,
    timestamp: timestamp.toISOString()
  };
}

/**
 * Listar eventos recientes de Workfront y Fusion (para la UI)
 */
export async function getRecentWorkfrontEvents(limit = 30) {
  const db = await getDb();
  const events = await db.collection("workfront_events")
    .find({})
    .sort({ processedAt: -1 })
    .limit(limit)
    .toArray();

  const useCases = await db.collection("workfront_use_cases")
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const fusionLogs = await db.collection("workfront_fusion_logs")
    .find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();

  return {
    eventsCount: events.length,
    events,
    useCasesCount: useCases.length,
    useCases,
    fusionLogsCount: fusionLogs.length,
    fusionLogs
  };
}

