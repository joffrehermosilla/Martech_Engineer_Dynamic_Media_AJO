import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { getProviderStatus, executePromptWithFallback } from "./services/providerRouter.mjs";
import { validateAssetRequest, getDb, registerAssetInCatalog, getStorageStatus } from "./services/governanceEngine.mjs";
import { executePhotoCraftEdit, executeDamCraftEdit } from "./services/photocraftAdapter.mjs";
import {
  getWorkfrontMetadata, processWorkfrontWebhook, executeFusionAction, getRecentWorkfrontEvents
} from "./services/workfrontService.mjs";
import {
  executeAssetTransform, listAssetVersions, getAssetDetails,
  SUPPORTED_FORMATS, BCP_ASPECT_RATIOS
} from "./services/assetEditorService.mjs";
import { getGeographicContext } from "./services/placesService.mjs";
import {
  loginUser, logoutUser, verifyToken, requireAuth, requirePermission,
  listUsers, upsertUser, getAllRoles, getRolePermissions
} from "./services/authService.mjs";
import {
  listPolicies, createPolicy, updatePolicy, deletePolicy,
  listSquads, createSquad, updateSquad,
  listNetworkGroups, createNetworkGroup,
  generateAccessCode, createApiKey, listApiKeys, verifyApiKey,
  getPendingNotifications, approveAsset, rejectAsset,
  listDbConnections, saveDbConnection, provisionPoliciesInExternalDb,
  getRoleViewConfig, updateRoleViewConfig
} from "./services/adminService.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import { renderFlowToHtml, DEFAULT_AEM_FLOW_MODEL, FLOW_TEMPLATES } from "../flow_studio/generator.mjs";

// ─── STATIC ASSETS ─────────────────────────────────────────────────────────────
// Serve PhotoCraft job artifacts (images, metadata)
app.use("/photocraft/jobs", express.static(path.resolve(__dirname, "../photocraft/jobs")));
app.use("/damcraft/jobs", express.static(path.resolve(__dirname, "../photocraft/jobs")));
// Serve agent-hub public assets
app.use("/public", express.static(path.resolve(__dirname, "public")));
// Serve Flow Studio
app.use("/flow_studio", express.static(path.resolve(__dirname, "../flow_studio/public")));

// ─── AUTH ENDPOINTS ─────────────────────────────────────────────────────────────

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username y password son requeridos." });
  }
  const result = await loginUser(username, password);
  if (!result.success) return res.status(401).json(result);
  res.json(result);
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  res.json(logoutUser(token));
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ success: true, user: req.session });
});

app.get("/api/auth/roles", (req, res) => {
  res.json({ roles: getAllRoles() });
});

// ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────────

// Users management
app.get("/api/admin/users", requireAuth, requirePermission("canManageRoles"), async (req, res) => {
  try {
    const users = await listUsers();
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/users", requireAuth, requirePermission("canManageRoles"), async (req, res) => {
  try {
    const result = await upsertUser(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Policies
app.get("/api/admin/policies", requireAuth, requirePermission("canCreatePolicies"), async (req, res) => {
  try {
    const policies = await listPolicies(req.query);
    res.json({ count: policies.length, policies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/policies", requireAuth, requirePermission("canCreatePolicies"), async (req, res) => {
  try {
    const result = await createPolicy(req.body, req.session.username);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/policies/:policyId", requireAuth, requirePermission("canCreatePolicies"), async (req, res) => {
  try {
    const result = await updatePolicy(req.params.policyId, req.body, req.session.username);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/policies/:policyId", requireAuth, requirePermission("canManageRoles"), async (req, res) => {
  try {
    const result = await deletePolicy(req.params.policyId, req.session.username);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Squads
app.get("/api/admin/squads", requireAuth, async (req, res) => {
  try {
    const squads = await listSquads();
    res.json({ count: squads.length, squads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/squads", requireAuth, requirePermission("canManageSquads"), async (req, res) => {
  try {
    const result = await createSquad(req.body, req.session.username);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Network Groups
app.get("/api/admin/network-groups", requireAuth, async (req, res) => {
  try {
    const groups = await listNetworkGroups();
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/network-groups", requireAuth, requirePermission("canManageRoles"), async (req, res) => {
  try {
    const result = await createNetworkGroup(req.body, req.session.username);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Keys
app.get("/api/admin/api-keys", requireAuth, requirePermission("canManageRoles"), async (req, res) => {
  try {
    const keys = await listApiKeys();
    res.json({ keys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/api-keys", requireAuth, requirePermission("canManageRoles"), async (req, res) => {
  try {
    const { label, permissions } = req.body;
    const result = await createApiKey(label, permissions, req.session.username);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/generate-code", requireAuth, requirePermission("canManageRoles"), (req, res) => {
  const { prefix } = req.body;
  res.json(generateAccessCode(prefix));
});

// Role view config
app.get("/api/admin/view-config", requireAuth, requirePermission("canManageRoles"), async (req, res) => {
  try {
    const config = await getRoleViewConfig();
    res.json(config || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/view-config", requireAuth, requirePermission("canManageRoles"), async (req, res) => {
  try {
    const result = await updateRoleViewConfig(req.body, req.session.username);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NOTIFICATIONS & APPROVALS ───────────────────────────────────────────────

app.get("/api/notifications/pending", requireAuth, requirePermission("canApprove"), async (req, res) => {
  try {
    const items = await getPendingNotifications(req.session.role, req.session.networkGroup);
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/assets/:assetId/approve", requireAuth, requirePermission("canApprove"), async (req, res) => {
  try {
    const result = await approveAsset(req.params.assetId, req.session.username, req.body.comment);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/assets/:assetId/reject", requireAuth, requirePermission("canApprove"), async (req, res) => {
  try {
    const result = await rejectAsset(req.params.assetId, req.session.username, req.body.reason);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EXTERNAL DB CONNECTIONS ────────────────────────────────────────────────

app.get("/api/connections", requireAuth, requirePermission("canConnectExternalDB"), async (req, res) => {
  try {
    const connections = await listDbConnections();
    res.json({ connections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/connections", requireAuth, requirePermission("canConnectExternalDB"), async (req, res) => {
  try {
    const result = await saveDbConnection(req.body, req.session.username);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/connections/:connId/provision", requireAuth, requirePermission("canConnectExternalDB"), async (req, res) => {
  try {
    const result = await provisionPoliciesInExternalDb(req.params.connId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FLOW STUDIO ENDPOINTS ───────────────────────────────────────────────────

app.get("/api/flow-studio/templates", (req, res) => {
  res.json({ templates: FLOW_TEMPLATES });
});

app.get("/api/flow-studio/preview", async (req, res) => {
  try {
    const templateKey = req.query.template || "AEM_DYNAMIC_MEDIA_E2E";
    const model = FLOW_TEMPLATES[templateKey]?.model || DEFAULT_AEM_FLOW_MODEL;
    const html = await renderFlowToHtml(model, {
      title: FLOW_TEMPLATES[templateKey]?.label || "Mapa Dinámico de Arquitectura Martech | BCP Dynamic Media & AJO",
      badge: "BCP DYNAMIC MEDIA",
      brandTitle: "AEM Assets • PhotoCraft • AJO InWeb • WhatsApp",
      brandSub: "Arquitectura E2E Gobernanza y Entrega de Medios"
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    res.status(500).send("Error generando preview: " + err.message);
  }
});

app.post("/api/flow-studio/generate", async (req, res) => {
  try {
    const { title, prompt, template } = req.body;
    const templateKey = template || "AEM_DYNAMIC_MEDIA_E2E";
    const model = FLOW_TEMPLATES[templateKey]?.model || DEFAULT_AEM_FLOW_MODEL;
    const html = await renderFlowToHtml(model, {
      title: title || "Mapa Dinámico de Arquitectura Generado",
      badge: "FLOW STUDIO IA",
      brandTitle: title || "Flujo de Arquitectura y Trazabilidad",
      brandSub: "Generado Dinámicamente por Agente IA"
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

// ─── REST API ENDPOINTS ──────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({
    status: "UP",
    project: "Martech Engineer Dynamic Media AJO - Agent Hub",
    version: "2.0.0-LOCAL-FIRST",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    features: ["RBAC", "LocalFirst", "DeterministicData", "PhotoCraft", "FlowStudio", "MultiDB", "ApprovalAPI"],
    storage: getStorageStatus()
  });
});

app.get("/api/system/mode", (req, res) => {
  res.json(getStorageStatus());
});

app.get("/api/providers", (req, res) => {
  res.json({
    providers: getProviderStatus(),
    timestamp: new Date()
  });
});

app.post("/api/governance/validate", async (req, res) => {
  const { initiativeId, intention, briefText, channel } = req.body;
  if (!initiativeId || !briefText) {
    return res.status(400).json({ error: "initiativeId and briefText are required." });
  }
  const result = await validateAssetRequest(initiativeId, intention, briefText, channel);
  res.json(result);
});

app.get("/api/catalog", async (req, res) => {
  try {
    const db = await getDb();
    const filter = {};
    if (req.query.initiativeId) filter.initiativeId = req.query.initiativeId;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    const assets = await db.collection("asset_catalog").find(filter).toArray();
    res.json({ count: assets.length, assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/catalog", requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const assetData = {
      assetId: req.body.assetId || `AST-${Date.now()}`,
      initiativeId: req.body.initiativeId || "INIT-BCP-CAMP-2026-01",
      title: req.body.title || "Activo DAM",
      category: req.body.category || "GENERAL",
      deliveryUrl: req.body.deliveryUrl || "",
      mimeType: req.body.mimeType || "image/png",
      dimensions: req.body.dimensions || { width: 1200, height: 628 },
      status: req.body.status || "PENDING_APPROVAL",
      createdBy: req.session?.username || "designer1",
      createdAt: new Date(),
      updatedAt: new Date(),
      operations: req.body.operations || []
    };
    await db.collection("asset_catalog").insertOne(assetData);
    await db.collection("audit_log").insertOne({
      action: "ASSET_SAVED_TO_CATALOG",
      assetId: assetData.assetId,
      actor: req.session?.username || "designer1",
      status: assetData.status,
      timestamp: new Date()
    });
    res.json({ success: true, asset: assetData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─── BATCH ASSET UPLOAD (Fase 2 — Carga Masiva) ──────────────────────────────
app.post("/api/catalog/batch-upload", requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const assets = Array.isArray(req.body.assets) ? req.body.assets : [req.body];
    const inserted = [];
    const now = new Date();

    for (const item of assets) {
      const doc = {
        assetId: item.assetId || `AST-BATCH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        initiativeId: item.initiativeId || "INIT-BCP-CAMP-2026-01",
        title: item.title || "Activo DAM Cargado",
        category: item.category || "GENERAL",
        deliveryUrl: item.deliveryUrl || "",
        mimeType: item.mimeType || "image/png",
        dimensions: item.dimensions || { width: 1200, height: 628 },
        status: item.status || "APPROVED",
        isComponent: Boolean(item.isComponent),
        createdBy: req.session?.username || "designer1",
        createdAt: now,
        updatedAt: now,
        operations: item.operations || []
      };
      await db.collection("asset_catalog").insertOne(doc);
      inserted.push(doc);
    }

    await db.collection("audit_log").insertOne({
      action: "BATCH_ASSETS_UPLOADED",
      count: inserted.length,
      actor: req.session?.username || "designer1",
      timestamp: now
    }).catch(() => {});

    res.json({ success: true, count: inserted.length, assets: inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COMPOSITE ASSETS (Fase 2 — Traslape de Piezas Aprobadas) ───────────────
app.post("/api/editor/composite", requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const {
      title = "Nuevo Activo Compuesto",
      initiativeId = "INIT-BCP-CAMP-2026-01",
      canvasWidth = 1200,
      canvasHeight = 628,
      layers = [],
      outputFormat = "png"
    } = req.body;

    if (!layers || layers.length === 0) {
      return res.status(400).json({ error: "Se requiere al menos una capa para componer el activo." });
    }

    const jobId = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const compositeAssetId = `AST-COMP-${Date.now()}`;
    const sortedLayers = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    const svgLayers = sortedLayers.map((layer, idx) => {
      const lx = layer.x || 0;
      const ly = layer.y || 0;
      const lw = layer.width || canvasWidth;
      const lh = layer.height || canvasHeight;
      const op = layer.opacity !== undefined ? layer.opacity : 1.0;
      const blend = layer.blendMode || "normal";

      if (layer.deliveryUrl && (layer.deliveryUrl.startsWith("http") || layer.deliveryUrl.startsWith("data:") || layer.deliveryUrl.startsWith("/"))) {
        return `<image href="${layer.deliveryUrl}" x="${lx}" y="${ly}" width="${lw}" height="${lh}" opacity="${op}" style="mix-blend-mode: ${blend};" preserveAspectRatio="xMidYMid slice"/>`;
      }
      return `<g transform="translate(${lx}, ${ly})" opacity="${op}" style="mix-blend-mode: ${blend};">
        <rect width="${lw}" height="${lh}" rx="12" fill="rgba(0, 42, 143, 0.4)" stroke="#FF7800" stroke-width="2"/>
        <text x="20" y="35" font-family="'Archivo', sans-serif" font-weight="bold" font-size="18" fill="#FFFFFF">${layer.title || `Pieza ${idx + 1}`}</text>
        <text x="20" y="60" font-family="'JetBrains Mono', monospace" font-size="12" fill="#FF7800">Capa #${idx + 1} (${layer.assetId || "Sin ID"})</text>
      </g>`;
    }).join("\n");

    const compositeSvg = `<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#05080E" />
      ${svgLayers}
      <g transform="translate(${canvasWidth - 140}, ${canvasHeight - 60})">
        <rect width="120" height="40" rx="8" fill="#FF7800" opacity="0.9" />
        <text x="60" y="26" font-family="'Archivo', sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle">DAM CRAFT</text>
      </g>
    </svg>`.trim();

    const jobsDir = path.resolve(__dirname, "../photocraft/jobs", jobId);
    await fs.promises.mkdir(jobsDir, { recursive: true });
    const fileName = `composite_${compositeAssetId}.${outputFormat}`;
    await fs.promises.writeFile(path.join(jobsDir, fileName), compositeSvg, "utf-8");

    const deliveryUrl = `/photocraft/jobs/${jobId}/${fileName}`;
    const compositeDoc = {
      assetId: compositeAssetId,
      initiativeId,
      title,
      category: "COMPOSITE_LAYERED",
      deliveryUrl,
      mimeType: `image/${outputFormat}`,
      dimensions: { width: canvasWidth, height: canvasHeight },
      status: "PENDING_APPROVAL",
      isComposite: true,
      sourcePieces: sortedLayers.map(l => ({ assetId: l.assetId, title: l.title, zIndex: l.zIndex })),
      createdBy: req.session?.username || "designer1",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection("asset_catalog").insertOne(compositeDoc);
    await db.collection("audit_log").insertOne({
      action: "COMPOSITE_ASSET_CREATED",
      assetId: compositeAssetId,
      layersCount: sortedLayers.length,
      actor: req.session?.username || "designer1",
      timestamp: new Date()
    }).catch(() => {});

    res.json({ success: true, compositeAsset: compositeDoc, jobId, deliveryUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/damcraft/edit", async (req, res) => {
  try {
    const result = await executeDamCraftEdit(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/photocraft/edit", async (req, res) => {
  try {
    const result = await executePhotoCraftEdit(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─── WORKFRONT & FUSION WEBHOOKS API ─────────────────────────────────────────

app.get("/api/workfront/metadata", (req, res) => {
  res.json(getWorkfrontMetadata());
});

app.post("/api/workfront/webhook", async (req, res) => {
  try {
    const result = await processWorkfrontWebhook(req.body, req.headers);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/workfront/fusion/trigger", async (req, res) => {
  try {
    const result = await executeFusionAction(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/workfront/events", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const data = await getRecentWorkfrontEvents(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/workfront/simulate-event", requireAuth, async (req, res) => {
  try {
    const { type = "document.approval", documentId, status = "APPROVED", comment } = req.body;
    const simulatedPayload = {
      eventType: type,
      documentId,
      status,
      actor: req.session?.username ? `${req.session.username}@viabcp.com` : "approver.workfront@viabcp.com",
      comment: comment || `Aprobación simulada desde DAM Craft para activo ${documentId}`,
      timestamp: new Date().toISOString()
    };
    const result = await processWorkfrontWebhook(simulatedPayload, { "user-agent": "DAMCraft-Workfront-Simulator/2.0" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ASSET EDITOR DOMAIN ENDPOINTS (Fase 2) ──────────────────────────────────

app.get("/api/editor/presets", (req, res) => {
  res.json({
    supportedFormats: SUPPORTED_FORMATS,
    aspectRatios: BCP_ASPECT_RATIOS
  });
});

app.post("/api/editor/transform", async (req, res) => {
  try {
    const actor = req.session?.username || req.body.actor || "web-user";
    const result = await executeAssetTransform({ ...req.body, actor });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/editor/assets/:assetId/versions", async (req, res) => {
  try {
    const result = await listAssetVersions(req.params.assetId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/editor/assets/:assetId", async (req, res) => {
  try {
    const result = await getAssetDetails(req.params.assetId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/places/enrich", async (req, res) => {
  const { locationQuery, eventType } = req.body;
  const result = await getGeographicContext(locationQuery, eventType);
  res.json(result);
});

app.post("/api/generate-brief", async (req, res) => {
  const { prompt, systemInstruction } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt is required." });
  const result = await executePromptWithFallback(prompt, systemInstruction);
  res.json(result);
});

// ─── PUBLIC REST API (con API Key) ───────────────────────────────────────────

async function requireApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  if (!apiKey) return res.status(401).json({ error: "API Key requerida. Use header X-API-Key." });
  const keyDoc = await verifyApiKey(apiKey).catch(() => null);
  if (!keyDoc) return res.status(403).json({ error: "API Key inválida o inactiva." });
  req.apiKeyDoc = keyDoc;
  next();
}

app.get("/api/public/assets", requireApiKey, async (req, res) => {
  try {
    const db = await getDb();
    const filter = { status: { $in: ["APPROVED", "PUBLISHED"] } };
    if (req.query.initiativeId) filter.initiativeId = req.query.initiativeId;
    const assets = await db.collection("asset_catalog").find(filter).toArray();
    res.json({ count: assets.length, assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/public/assets/:assetId/status", requireApiKey, async (req, res) => {
  try {
    const db = await getDb();
    const asset = await db.collection("asset_catalog").findOne({ assetId: req.params.assetId });
    if (!asset) return res.status(404).json({ error: "Asset no encontrado." });
    res.json({ assetId: asset.assetId, status: asset.status, title: asset.title, deliveryUrl: asset.deliveryUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SAVED FLOWS (Fase 4 — Flow Studio Interactivo) ─────────────────────────

/**
 * GET /api/flow-studio/saved-flows
 * Lista todos los flujos guardados en MongoDB (colección saved_flows)
 * Requiere auth. Ordenados por fecha desc.
 */
app.get("/api/flow-studio/saved-flows", requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const filter = {};
    if (req.query.templateKey) filter.templateKey = req.query.templateKey;
    const flows = await db.collection("saved_flows")
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();
    res.json({ count: flows.length, flows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/flow-studio/saved-flows
 * Crea o actualiza un flujo guardado.
 * Body: { flowId?, templateKey, title, nodeEdits, approvalStatus, tags }
 * nodeEdits: { nodeId: { title, subtitle, summary, inputs, outputs, rules, imageUrl, approvalStatus } }
 */
app.post("/api/flow-studio/saved-flows", requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const {
      flowId,
      templateKey = "AEM_DYNAMIC_MEDIA_E2E",
      title,
      nodeEdits = {},
      approvalStatus = "DRAFT",
      tags = []
    } = req.body;

    if (!title) return res.status(400).json({ error: "title es requerido." });

    const now = new Date();
    const doc = {
      templateKey,
      title,
      nodeEdits,
      approvalStatus,
      tags,
      updatedAt: now,
      updatedBy: req.session.username
    };

    let result;
    if (flowId) {
      // Update existing
      result = await db.collection("saved_flows").findOneAndUpdate(
        { flowId },
        { $set: doc },
        { returnDocument: "after", upsert: false }
      );
      if (!result) return res.status(404).json({ error: "Flujo no encontrado." });
    } else {
      // Create new
      const newFlowId = `flow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      doc.flowId = newFlowId;
      doc.createdAt = now;
      doc.createdBy = req.session.username;
      await db.collection("saved_flows").insertOne(doc);
      result = doc;
    }

    // Audit log
    await db.collection("audit_log").insertOne({
      action: flowId ? "FLOW_UPDATE" : "FLOW_CREATE",
      flowId: result.flowId || flowId,
      actor: req.session.username,
      templateKey,
      timestamp: now
    }).catch(() => {});

    res.json({ success: true, flow: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/flow-studio/saved-flows/:flowId
 * Actualiza campos específicos de un flujo guardado (patch parcial).
 */
app.put("/api/flow-studio/saved-flows/:flowId", requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const { flowId } = req.params;
    const allowed = ["title", "nodeEdits", "approvalStatus", "tags"];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    update.updatedAt = new Date();
    update.updatedBy = req.session.username;

    const result = await db.collection("saved_flows").findOneAndUpdate(
      { flowId },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Flujo no encontrado." });

    await db.collection("audit_log").insertOne({
      action: "FLOW_PATCH",
      flowId,
      fields: Object.keys(update),
      actor: req.session.username,
      timestamp: new Date()
    }).catch(() => {});

    res.json({ success: true, flow: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/flow-studio/saved-flows/:flowId
 * Elimina (soft-delete: marca como ARCHIVED) un flujo guardado.
 * Solo ADMIN puede eliminar.
 */
app.delete("/api/flow-studio/saved-flows/:flowId",
  requireAuth, requirePermission("canManageRoles"), async (req, res) => {
  try {
    const db = await getDb();
    const { flowId } = req.params;
    const result = await db.collection("saved_flows").findOneAndUpdate(
      { flowId },
      { $set: { approvalStatus: "ARCHIVED", updatedAt: new Date(), updatedBy: req.session.username } },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Flujo no encontrado." });
    res.json({ success: true, message: "Flujo archivado.", flow: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/flow-studio/saved-flows/:flowId/export
 * Genera el HTML completo del flujo con los nodeEdits y approvalStatus embebidos.
 * Devuelve el HTML como text/html descargable.
 */
app.post("/api/flow-studio/saved-flows/:flowId/export", requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const { flowId } = req.params;
    const savedFlow = await db.collection("saved_flows").findOne({ flowId });
    if (!savedFlow) return res.status(404).json({ error: "Flujo no encontrado." });

    const templateData = FLOW_TEMPLATES[savedFlow.templateKey];
    if (!templateData) return res.status(400).json({ error: "Plantilla no encontrada." });

    // Merge nodeEdits into the model's details
    const model = JSON.parse(JSON.stringify(templateData.model)); // deep clone
    const edits = savedFlow.nodeEdits || {};
    Object.entries(edits).forEach(([nodeId, edits]) => {
      if (!model.details) model.details = {};
      if (!model.details[nodeId]) model.details[nodeId] = {};
      Object.assign(model.details[nodeId], edits);
    });

    // Stamp approval status in title
    const statusBadge = savedFlow.approvalStatus !== "DRAFT"
      ? ` [${savedFlow.approvalStatus}]` : "";

    const html = await renderFlowToHtml(model, {
      title: savedFlow.title + statusBadge,
      badge: "BCP FLOW EXPORT",
      brandTitle: savedFlow.title,
      brandSub: `Exportado por ${savedFlow.updatedBy} | ${new Date(savedFlow.updatedAt).toLocaleString("es-PE")} | Estado: ${savedFlow.approvalStatus}`
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="flow_${flowId}.html"`);
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SPA ROOT ────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 MARTECH ENGINEER DYNAMIC MEDIA AJO - AGENT HUB v2.0 RUNNING`);
  console.log(`📡 Dashboard URL:    http://localhost:${PORT}`);
  console.log(`🔐 Auth API:         http://localhost:${PORT}/api/auth/login`);
  console.log(`🛡️  Governance API:   http://localhost:${PORT}/api/governance/validate`);
  console.log(`📦 Catalog API:      http://localhost:${PORT}/api/catalog`);
  console.log(`🔔 Notifications:    http://localhost:${PORT}/api/notifications/pending`);
  console.log(`🌍 Public REST API:  http://localhost:${PORT}/api/public/assets`);
  console.log(`⚡ Flow Studio:      http://localhost:${PORT}/flow_studio/index.html`);
  console.log(`================================================================`);
  console.log(`👤 Usuarios por defecto (primera ejecución):`);
  console.log(`   admin / Admin2026! → ADMIN`);
  console.log(`   martech1 / Martech2026! → MARTECH`);
  console.log(`   designer1 / Design2026! → VCD`);
  console.log(`   viewer1 / View2026! → VIEWER`);
  console.log(`================================================================`);
});
