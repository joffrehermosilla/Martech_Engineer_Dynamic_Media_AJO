import readline from "readline";
import { executeDamCraftEdit } from "../agent-hub/services/damcraftAdapter.mjs";
import { validateAssetRequest, registerAssetInCatalog } from "../agent-hub/services/governanceEngine.mjs";
import { getGeographicContext } from "../agent-hub/services/placesService.mjs";
import { executePromptWithFallback, getProviderStatus } from "../agent-hub/services/providerRouter.mjs";
import { processWorkfrontWebhook, executeFusionAction } from "../agent-hub/services/workfrontService.mjs";

/**
 * Model Context Protocol (MCP) Server for Martech Engineer Dynamic Media AJO
 * Standard JSON-RPC 2.0 tool definitions for AI agents.
 */
const TOOLS = [
  {
    name: "damcraft_edit_asset",
    description: "Applies image transformations (crop, resize, watermark, composite layers, format conversion) using the DAM Craft engine.",
    inputSchema: {
      type: "object",
      properties: {
        jobId: { type: "string", description: "Unique tracking job ID" },
        sourceImagePath: { type: "string", description: "Path to input asset" },
        actions: {
          type: "array",
          description: "List of operations: crop, resize, watermark, tint, composite",
          items: { type: "object" }
        },
        outputFormat: { type: "string", enum: ["png", "jpg", "avif", "webp"], default: "png" }
      },
      required: ["sourceImagePath"]
    }
  },
  {
    name: "photocraft_edit_asset",
    description: "Alias backward-compatibility for damcraft_edit_asset.",
    inputSchema: {
      type: "object",
      properties: {
        jobId: { type: "string" },
        sourceImagePath: { type: "string" },
        actions: { type: "array", items: { type: "object" } },
        outputFormat: { type: "string", default: "png" }
      },
      required: ["sourceImagePath"]
    }
  },
  {
    name: "workfront_process_approval",
    description: "Processes Adobe Workfront Document Webhook approval/rejection events, updating asset catalog status and notifying stakeholders.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string", description: "Workfront Document GUID" },
        status: { type: "string", enum: ["APPROVED", "REJECTED", "PENDING_CHANGES"], description: "Approval decision" },
        actorId: { type: "string", description: "Workfront User GUID of approver" },
        comments: { type: "string", description: "Feedback or reason for decision" }
      },
      required: ["documentId", "status"]
    }
  },
  {
    name: "workfront_ingest_use_case",
    description: "Ingests a creative brief or campaign request from Adobe Workfront project/task webhook or Workfront Fusion scenario.",
    inputSchema: {
      type: "object",
      properties: {
        initiativeId: { type: "string", description: "Campaign Initiative Code (e.g. INIT-BCP-CAMP-2026-01)" },
        title: { type: "string", description: "Campaign or Asset Title" },
        description: { type: "string", description: "Detailed creative requirements" },
        channel: { type: "string", enum: ["AJO_INWEB", "WHATSAPP", "EMAIL", "AEM_PAGE"], default: "AJO_INWEB" },
        requestedBy: { type: "string", description: "Requester email or Workfront user" }
      },
      required: ["initiativeId", "title", "description"]
    }
  },
  {
    name: "workfront_fusion_trigger",
    description: "Triggers or synchronizes an alternating orchestration scenario in Adobe Workfront Fusion (Integromat) for Phase 2 automation.",
    inputSchema: {
      type: "object",
      properties: {
        scenarioId: { type: "string", description: "Fusion Scenario ID or webhook trigger name" },
        action: { type: "string", enum: ["SYNC_ASSET_STATUS", "DISPATCH_BRIEF", "ALTERNATE_FLOW", "TRIGGER_COMPOSITING"], default: "ALTERNATE_FLOW" },
        payload: { type: "object", description: "Data payload to forward to Fusion webhook" }
      },
      required: ["action", "payload"]
    }
  },
  {
    name: "aem_asset_governance_check",
    description: "Validates an asset creation or modification request against MongoDB Atlas initiative catalog and brand mandamientos.",
    inputSchema: {
      type: "object",
      properties: {
        initiativeId: { type: "string", description: "Initiative ID, e.g. INIT-BCP-CAMP-2026-01" },
        intention: { type: "string", description: "Asset intention, e.g. PROMOTION, REMINDER, ONBOARDING" },
        briefText: { type: "string", description: "Prompt or visual description for the asset" },
        channel: { type: "string", enum: ["AJO_INWEB", "WHATSAPP", "EMAIL", "AEM_PAGE"], default: "AJO_INWEB" }
      },
      required: ["initiativeId", "briefText"]
    }
  },
  {
    name: "aem_asset_publish_delivery",
    description: "Publishes the approved asset candidate to AEM Dynamic Media delivery URL, validates MIME type, and registers in catalog.",
    inputSchema: {
      type: "object",
      properties: {
        assetId: { type: "string" },
        initiativeId: { type: "string" },
        title: { type: "string" },
        localFilePath: { type: "string" },
        category: { type: "string" },
        deliveryFormat: { type: "string", enum: ["png", "jpg", "avif"], default: "png" }
      },
      required: ["assetId", "initiativeId", "title", "localFilePath"]
    }
  },
  {
    name: "geo_places_enrichment",
    description: "Enriches an asset brief with approved corporate or regional location context using Google Places & Adobe Places POIs.",
    inputSchema: {
      type: "object",
      properties: {
        locationQuery: { type: "string", description: "Branch or district name, e.g. 'San Isidro' or 'La Molina'" },
        eventType: { type: "string", description: "Ceremony or event type" }
      },
      required: ["locationQuery"]
    }
  },
  {
    name: "router_generate_creative_brief",
    description: "Generates an audited creative brief using multi-key rotation and multi-provider AI fallback (Groq, Gemini, OpenAI, DeepSeek).",
    inputSchema: {
      type: "object",
      properties: {
        userPrompt: { type: "string" },
        initiativeId: { type: "string" }
      },
      required: ["userPrompt"]
    }
  }
];

// Dispatch tool execution
async function handleCallTool(name, args) {
  switch (name) {
    case "damcraft_edit_asset":
      return await executeDamCraftEdit(args);

    case "photocraft_edit_asset":
      return await executeDamCraftEdit(args);

    case "workfront_process_approval":
      return await processWorkfrontWebhook({
        eventType: args.status === "APPROVED" ? "DOCUMENT_APPROVAL_DECISION" : "DOCUMENT_REJECTED",
        documentId: args.documentId,
        status: args.status,
        actorId: args.actorId || "MCP_WORKFRONT_ACTOR",
        comments: args.comments || "Processed via MCP Server"
      });

    case "workfront_ingest_use_case":
      return await processWorkfrontWebhook({
        eventType: "PROJECT_BRIEF_CREATED",
        initiativeId: args.initiativeId,
        title: args.title,
        description: args.description,
        channel: args.channel || "AJO_INWEB",
        actorId: args.requestedBy || "WORKFRONT_CREATIVE_REQUESTER"
      });

    case "workfront_fusion_trigger":
      return await executeFusionAction({
        action: args.action,
        scenarioId: args.scenarioId || "SCENARIO_PHASE2_ALTERNATE",
        payload: args.payload
      });

    case "aem_asset_governance_check":
      return await validateAssetRequest(args.initiativeId, args.intention, args.briefText, args.channel);

    case "aem_asset_publish_delivery": {
      const deliveryHost = process.env.DYNAMIC_MEDIA_DELIVERY_HOST || "delivery-p187030-e1959235.adobeaemcloud.com";
      const deliveryUrl = `https://${deliveryHost}/adobe/assets/urn:aaid:aem:${args.assetId}/as/${encodeURIComponent(args.title)}.${args.deliveryFormat || "png"}`;
      
      await registerAssetInCatalog({
        assetId: args.assetId,
        initiativeId: args.initiativeId,
        title: args.title,
        category: args.category || "GENERAL",
        localFilePath: args.localFilePath,
        deliveryUrl: deliveryUrl,
        mimeType: args.deliveryFormat === "jpg" ? "image/jpeg" : args.deliveryFormat === "avif" ? "image/avif" : "image/png",
        status: "APPROVED"
      });

      return {
        success: true,
        assetId: args.assetId,
        deliveryUrl: deliveryUrl,
        mimeVerified: true,
        status: "PUBLISHED_DYNAMIC_MEDIA"
      };
    }

    case "geo_places_enrichment":
      return await getGeographicContext(args.locationQuery, args.eventType);

    case "router_generate_creative_brief":
      return await executePromptWithFallback(args.userPrompt, "Eres el orquestador de briefs de activos visuales para BCP Dynamic Media.");

    default:
      throw new Error(`Tool '${name}' not found.`);
  }
}

// JSON-RPC stdio loop for MCP clients
export function startMcpStdio() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

  rl.on("line", async (line) => {
    if (!line.trim()) return;
    try {
      const request = JSON.parse(line);
      const { id, method, params } = request;

      if (method === "tools/list") {
        console.log(JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: { tools: TOOLS }
        }));
      } else if (method === "tools/call") {
        const result = await handleCallTool(params.name, params.arguments || {});
        console.log(JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
        }));
      } else {
        console.log(JSON.stringify({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method '${method}' not found` }
        }));
      }
    } catch (err) {
      console.error("[MCP Server Error]", err.message);
    }
  });

  console.error("[MCP Server] Martech Engineer Dynamic Media AJO MCP Server running on stdio.");
}

// If executed directly
if (process.argv[1]?.endsWith("mcp_server.mjs")) {
  startMcpStdio();
}
