import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { getProviderStatus, executePromptWithFallback } from "./services/providerRouter.mjs";
import { validateAssetRequest, getDb, registerAssetInCatalog } from "./services/governanceEngine.mjs";
import { executePhotoCraftEdit } from "./services/photocraftAdapter.mjs";
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
    version: "2.0.0-ROLES",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    features: ["RBAC", "PhotoCraft", "FlowStudio", "MultiDB", "ApprovalAPI", "Workfront-Ready"]
  });
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

app.post("/api/photocraft/edit", async (req, res) => {
  try {
    const result = await executePhotoCraftEdit(req.body);
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
