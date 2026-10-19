import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://joffre:joffre@bootcamp-microservicios.c9yhl.mongodb.net/ajo-cdp-meta-db?retryWrites=true&w=majority";
const DB_NAME = process.env.DB_NAME || "ajo-cdp-meta-db";

export async function seedGovernanceData() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`[Seed] Connected to MongoDB Atlas DB: ${DB_NAME}`);

    // 1. Seed Initiatives
    const initiatives = [
      {
        initiativeId: "INIT-BCP-CAMP-2026-01",
        name: "Campaña Préstamo al Toque",
        category: "PERSONAL_LOANS",
        targetAudience: "Clientes pre-evaluados con abono en cuenta sueldo",
        allowedChannels: ["AJO_INWEB", "WHATSAPP", "AEM_PAGE"],
        mandatoryDisclaimers: ["Sujeto a evaluación crediticia. TCEA referencial calculada a 36 meses. Más información en viabcp.com"],
        status: "ACTIVE",
        updatedAt: new Date()
      },
      {
        initiativeId: "INIT-BCP-CARD-2026-02",
        name: "Tarjeta Visa Signature Gastronomía & Millas",
        category: "CREDIT_CARDS",
        targetAudience: "Segmento Banca Exclusiva y Viajeros",
        allowedChannels: ["AJO_INWEB", "WHATSAPP"],
        mandatoryDisclaimers: ["Acumula Millas LATAM Pass por cada USD 1 de consumo. Aplican términos y condiciones."],
        status: "ACTIVE",
        updatedAt: new Date()
      },
      {
        initiativeId: "INIT-BCP-MORT-2026-03",
        name: "Crédito Hipotecario Sostenible Verde",
        category: "MORTGAGE",
        targetAudience: "Familias interesadas en proyectos eco-amigables Mivivienda",
        allowedChannels: ["AEM_PAGE", "EMAIL"],
        mandatoryDisclaimers: ["Bono Mivivienda Verde sujeto a calificación del fondo Mivivienda."],
        status: "ACTIVE",
        updatedAt: new Date()
      }
    ];

    for (const init of initiatives) {
      await db.collection("initiatives").updateOne(
        { initiativeId: init.initiativeId },
        { $set: init },
        { upsert: true }
      );
    }
    console.log(`[Seed] Seeded ${initiatives.length} initiatives.`);

    // 2. Seed Mandamientos (Anti-Hallucination & Brand Rules)
    const mandamientos = {
      policyVersion: "BCP_BRAND_V1",
      brandName: "Banco de Crédito del Perú (BCP)",
      brandColors: {
        primary: "#002A8F",
        accent: "#FF7800",
        surface: "#FFFFFF",
        darkSurface: "#0B0F17"
      },
      forbiddenTerms: [
        "100% garantizado",
        "sin evaluacion",
        "sin evaluación",
        "gratis de por vida",
        "dinero facil",
        "dinero fácil",
        "sorteo millonario",
        "criptomoneda",
        "bitcoin"
      ],
      allowedAspectRatios: ["1:1", "16:9", "1.91:1", "4:5"],
      allowedDeliveryFormats: ["png", "jpg", "avif", "webp"],
      humanApprovalMandatoryForChannels: ["WHATSAPP", "BROADCAST"],
      updatedAt: new Date()
    };

    await db.collection("governance_mandamientos").updateOne(
      { policyVersion: mandamientos.policyVersion },
      { $set: mandamientos },
      { upsert: true }
    );
    console.log("[Seed] Seeded Brand Governance Mandamientos.");

    // 3. Seed Sample Approved Asset Catalog
    const sampleAssets = [
      {
        assetId: "aem_asset_bcp_logo_primary",
        initiativeId: "INIT-BCP-CAMP-2026-01",
        title: "Logo Oficial BCP Azul y Naranja 2026",
        category: "BRAND_IDENTITY",
        deliveryUrl: "https://delivery-p187030-e1959235.adobeaemcloud.com/adobe/assets/urn:aaid:aem:bcp_logo_primary/as/bcp_logo.png",
        mimeType: "image/png",
        dimensions: { width: 512, height: 512 },
        status: "APPROVED",
        updatedAt: new Date()
      },
      {
        assetId: "aem_asset_prestamo_toque_banner",
        initiativeId: "INIT-BCP-CAMP-2026-01",
        title: "Banner Principal Préstamo al Toque InWeb",
        category: "PERSONAL_LOANS",
        deliveryUrl: "https://delivery-p187030-e1959235.adobeaemcloud.com/adobe/assets/urn:aaid:aem:prestamo_toque_banner/as/banner_prestamo.avif?width=1024&quality=65",
        mimeType: "image/avif",
        dimensions: { width: 1200, height: 628 },
        status: "APPROVED",
        updatedAt: new Date()
      }
    ];

    for (const asset of sampleAssets) {
      await db.collection("asset_catalog").updateOne(
        { assetId: asset.assetId },
        { $set: asset },
        { upsert: true }
      );
    }
    console.log(`[Seed] Seeded ${sampleAssets.length} verified assets into Catalog.`);

  } finally {
    await client.close();
    console.log("[Seed] Completed database initialization.");
  }
}

if (process.argv[1]?.endsWith("seed_mongo_governance.mjs")) {
  seedGovernanceData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Seed Error]", err);
      process.exit(1);
    });
}
