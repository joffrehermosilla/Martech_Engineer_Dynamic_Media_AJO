import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { getProviderStatus, executePromptWithFallback } from "./services/providerRouter.mjs";
import { validateAssetRequest, getDb, registerAssetInCatalog } from "./services/governanceEngine.mjs";
import { executePhotoCraftEdit } from "./services/photocraftAdapter.mjs";
import { getGeographicContext } from "./services/placesService.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import { renderFlowToHtml, DEFAULT_AEM_FLOW_MODEL } from "../flow_studio/generator.mjs";

// Serve static jobs/artifacts from PhotoCraft sandbox
app.use("/photocraft/jobs", express.static(path.resolve(__dirname, "../photocraft/jobs")));
// Serve dashboard static assets
app.use("/public", express.static(path.resolve(__dirname, "public")));
// Serve Flow Studio web assets
app.use("/flow_studio", express.static(path.resolve(__dirname, "../flow_studio/public")));

// --- FLOW STUDIO ENDPOINTS ---

app.get("/api/flow-studio/preview", async (req, res) => {
  try {
    const html = await renderFlowToHtml(DEFAULT_AEM_FLOW_MODEL, {
      title: "Mapa Dinámico de Arquitectura Martech | BCP Dynamic Media & AJO",
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
    const { title, prompt } = req.body;
    // Uses the validated robust model with custom metadata
    const html = await renderFlowToHtml(DEFAULT_AEM_FLOW_MODEL, {
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

// --- REST API ENDPOINTS ---

app.get("/api/health", (req, res) => {
  res.json({
    status: "UP",
    project: "Martech Engineer Dynamic Media AJO - Agent Hub",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
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

// Single Page Application (Dashboard)
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 MARTECH ENGINEER DYNAMIC MEDIA AJO - AGENT HUB RUNNING`);
  console.log(`📡 Dashboard URL:   http://localhost:${PORT}`);
  console.log(`🤖 Providers API:   http://localhost:${PORT}/api/providers`);
  console.log(`🛡️ Governance API:  http://localhost:${PORT}/api/governance/validate`);
  console.log(`================================================================`);
});
