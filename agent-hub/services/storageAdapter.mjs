/**
 * storageAdapter.mjs
 * Adaptador de almacenamiento desacoplado para Martech Engineer Dynamic Media AJO.
 * 
 * Cumple con los Mandamientos 1, 5, 6, 8 y 15:
 * - Modo Local-First determinista (100% offline, sin dependencias de red ni credenciales externas).
 * - Políticas explícitas: "local" | "auto" | "cloud".
 * - Persistencia local real en disco (agent-hub/data/local_storage.json).
 * - Mismo contrato de datos (colección: find, findOne, insertOne, updateOne, findOneAndUpdate, countDocuments).
 * - Identificación explícita de datos simulados vs reales.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DATA_DIR = path.resolve(__dirname, "../data");
const LOCAL_STORAGE_FILE = path.join(DATA_DIR, "local_storage.json");

// Execution Policy: "local" | "auto" | "cloud"
export const EXECUTION_MODES = {
  LOCAL: "local",
  AUTO: "auto",
  CLOUD: "cloud"
};

const configuredMode = (process.env.APP_EXECUTION_MODE || "auto").toLowerCase();
export const CURRENT_MODE = Object.values(EXECUTION_MODES).includes(configuredMode)
  ? configuredMode
  : EXECUTION_MODES.AUTO;

// Storage Status Tracker
let storageStatus = {
  mode: CURRENT_MODE.toUpperCase(),
  activeProvider: "local-json",
  isRemote: false,
  fallbackActive: false,
  isSimulated: CURRENT_MODE === EXECUTION_MODES.LOCAL,
  lastCheck: new Date().toISOString()
};

/**
 * Hash de contraseña compatible con authService (SHA256 con salt)
 */
function hashPassword(password, salt) {
  return crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

/**
 * Semilla de datos deterministas iniciales para modo local y demostración
 */
export function getDefaultSeedData() {
  const adminSalt = "a1b2c3d4e5f60718";
  const martechSalt = "b2c3d4e5f60718a1";
  const designerSalt = "c3d4e5f60718a1b2";
  const viewerSalt = "d4e5f60718a1b2c3";

  return {
    platform_users: [
      {
        _id: "usr_admin_001",
        username: "admin",
        passwordHash: hashPassword("Admin2026!", adminSalt),
        salt: adminSalt,
        fullName: "Administrador del Sistema",
        role: "ADMIN",
        networkGroup: "CORE_NETWORK",
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        _id: "usr_martech_002",
        username: "martech1",
        passwordHash: hashPassword("Martech2026!", martechSalt),
        salt: martechSalt,
        fullName: "Martech Engineer",
        role: "MARTECH",
        networkGroup: "MARTECH_TEAM",
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        _id: "usr_designer_003",
        username: "designer1",
        passwordHash: hashPassword("Design2026!", designerSalt),
        salt: designerSalt,
        fullName: "Visual Content Designer",
        role: "VCD",
        networkGroup: "CREATIVE_SQUAD",
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        _id: "usr_viewer_004",
        username: "viewer1",
        passwordHash: hashPassword("View2026!", viewerSalt),
        salt: viewerSalt,
        fullName: "Stakeholder Viewer",
        role: "VIEWER",
        networkGroup: "STAKEHOLDERS",
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ],
    initiatives: [
      {
        _id: "init_001",
        initiativeId: "INIT-BCP-CAMP-2026-01",
        name: "Campaña Préstamo al Toque",
        category: "PERSONAL_LOANS",
        targetAudience: "Clientes pre-evaluados con abono en cuenta sueldo",
        allowedChannels: ["AJO_INWEB", "WHATSAPP", "AEM_PAGE"],
        mandatoryDisclaimers: ["Sujeto a evaluación crediticia. TCEA referencial calculada a 36 meses. Más información en viabcp.com"],
        status: "ACTIVE",
        updatedAt: new Date().toISOString()
      },
      {
        _id: "init_002",
        initiativeId: "INIT-BCP-CARD-2026-02",
        name: "Tarjeta Visa Signature Gastronomía & Millas",
        category: "CREDIT_CARDS",
        targetAudience: "Segmento Banca Exclusiva y Viajeros",
        allowedChannels: ["AJO_INWEB", "WHATSAPP"],
        mandatoryDisclaimers: ["Acumula Millas LATAM Pass por cada USD 1 de consumo. Aplican términos y condiciones."],
        status: "ACTIVE",
        updatedAt: new Date().toISOString()
      },
      {
        _id: "init_003",
        initiativeId: "INIT-BCP-MORT-2026-03",
        name: "Crédito Hipotecario Sostenible Verde",
        category: "MORTGAGE",
        targetAudience: "Familias interesadas en proyectos eco-amigables Mivivienda",
        allowedChannels: ["AEM_PAGE", "EMAIL"],
        mandatoryDisclaimers: ["Bono Mivivienda Verde sujeto a calificación del fondo Mivivienda."],
        status: "ACTIVE",
        updatedAt: new Date().toISOString()
      }
    ],
    governance_mandamientos: [
      {
        _id: "mand_001",
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
        allowedDeliveryFormats: ["png", "jpg", "avif", "webp", "svg"],
        humanApprovalMandatoryForChannels: ["WHATSAPP", "BROADCAST"],
        updatedAt: new Date().toISOString()
      }
    ],
    asset_catalog: [
      {
        _id: "ast_001",
        assetId: "aem_asset_bcp_logo_primary",
        initiativeId: "INIT-BCP-CAMP-2026-01",
        title: "Logo Oficial BCP Azul y Naranja 2026",
        category: "BRAND_IDENTITY",
        deliveryUrl: "https://delivery-p187030-e1959235.adobeaemcloud.com/adobe/assets/urn:aaid:aem:bcp_logo_primary/as/bcp_logo.png",
        mimeType: "image/png",
        dimensions: { width: 512, height: 512 },
        status: "APPROVED",
        isSimulated: true,
        updatedAt: new Date().toISOString()
      },
      {
        _id: "ast_002",
        assetId: "aem_asset_prestamo_toque_banner",
        initiativeId: "INIT-BCP-CAMP-2026-01",
        title: "Banner Principal Préstamo al Toque InWeb",
        category: "PERSONAL_LOANS",
        deliveryUrl: "https://delivery-p187030-e1959235.adobeaemcloud.com/adobe/assets/urn:aaid:aem:prestamo_toque_banner/as/banner_prestamo.avif?width=1024&quality=65",
        mimeType: "image/avif",
        dimensions: { width: 1200, height: 628 },
        status: "APPROVED",
        isSimulated: true,
        updatedAt: new Date().toISOString()
      },
      {
        _id: "ast_003",
        assetId: "aem_asset_visa_signature_card",
        initiativeId: "INIT-BCP-CARD-2026-02",
        title: "Render Tarjeta Visa Signature Metal",
        category: "CREDIT_CARDS",
        deliveryUrl: "/photocraft/jobs/sample_card/visa_signature.png",
        mimeType: "image/png",
        dimensions: { width: 1080, height: 1080 },
        status: "PENDING_APPROVAL",
        isSimulated: true,
        updatedAt: new Date().toISOString()
      },
      {
        _id: "ast_004",
        assetId: "aem_asset_hipotecario_social_draft",
        initiativeId: "INIT-BCP-MORT-2026-03",
        title: "Boceto Campaña Crédito Verde Stories",
        category: "MORTGAGE",
        deliveryUrl: "/photocraft/jobs/sample_draft/stories_verde.jpg",
        mimeType: "image/jpeg",
        dimensions: { width: 1080, height: 1920 },
        status: "DRAFT",
        isSimulated: true,
        updatedAt: new Date().toISOString()
      }
    ],
    dam_policies: [
      {
        _id: "pol_001",
        policyId: "POL-001-AJO-INWEB-CROP",
        title: "Política de Formato y Calidad para AJO InWeb",
        description: "Todos los activos para banners InWeb deben ser 1200x628 y no superar 150KB en formato AVIF o JPEG optimizado.",
        aspectRatio: "1.91:1",
        maxWeightKb: 150,
        allowedFormats: ["avif", "jpg", "webp"],
        status: "ACTIVE",
        createdBy: "admin",
        createdAt: new Date().toISOString()
      },
      {
        _id: "pol_002",
        policyId: "POL-002-WHATSAPP-COMPLIANCE",
        title: "Gobernanza de Activos WhatsApp Notificaciones",
        description: "Requiere aprobación humana obligatoria y cláusula disclaimer visible.",
        aspectRatio: "1:1",
        maxWeightKb: 300,
        allowedFormats: ["png", "jpg"],
        status: "ACTIVE",
        createdBy: "admin",
        createdAt: new Date().toISOString()
      }
    ],
    squads: [
      {
        _id: "sq_001",
        squadId: "SQUAD-MARTECH-CORE",
        name: "Squad Martech & Dynamic Media Core",
        lead: "martech1",
        members: ["martech1", "admin"],
        createdAt: new Date().toISOString()
      },
      {
        _id: "sq_002",
        squadId: "SQUAD-CREATIVE-VCD",
        name: "Squad Diseño y Contenido Visual (VCD)",
        lead: "designer1",
        members: ["designer1"],
        createdAt: new Date().toISOString()
      }
    ],
    network_groups: [
      { _id: "net_001", code: "CORE_NETWORK", name: "Red Principal Segura BCP", requiresVPN: true },
      { _id: "net_002", code: "MARTECH_TEAM", name: "Red Operaciones Martech", requiresVPN: true },
      { _id: "net_003", code: "CREATIVE_SQUAD", name: "Red Contenido y Diseño", requiresVPN: false },
      { _id: "net_004", code: "STAKEHOLDERS", name: "Acceso Consultivo", requiresVPN: false }
    ],
    api_keys: [
      {
        _id: "key_001",
        keyId: "key_demo_public_001",
        name: "Clave Demo Integración Local",
        hashedKey: crypto.createHash("sha256").update("bcp_demo_key_2026").digest("hex"),
        truncated: "bcp_demo...2026",
        role: "MARTECH",
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ],
    role_view_config: [],
    external_db_connections: [],
    saved_flows: [
      {
        _id: "flw_001",
        flowId: "flow_demo_default",
        templateKey: "AEM_DYNAMIC_MEDIA_E2E",
        title: "Flujo End-to-End AEM Dynamic Media & AJO",
        nodeEdits: {},
        approvalStatus: "APPROVED",
        tags: ["E2E", "BCP", "AJO", "DYNAMIC_MEDIA"],
        createdBy: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: "admin"
      }
    ],
    audit_log: [
      {
        _id: "aud_001",
        action: "SYSTEM_INITIALIZED",
        actor: "system",
        mode: CURRENT_MODE.toUpperCase(),
        timestamp: new Date().toISOString()
      }
    ]
  };
}

/**
 * Coincidencia de filtros estilo MongoDB en memoria
 */
function matchesFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, value] of Object.entries(filter)) {
    if (key === "$or" && Array.isArray(value)) {
      if (!value.some(subFilter => matchesFilter(doc, subFilter))) return false;
      continue;
    }
    if (key === "$and" && Array.isArray(value)) {
      if (!value.every(subFilter => matchesFilter(doc, subFilter))) return false;
      continue;
    }

    const docValue = doc[key];

    // Comparadores de objeto
    if (value && typeof value === "object" && !(value instanceof Date) && !Array.isArray(value)) {
      if ("$ne" in value) {
        if (docValue === value.$ne) return false;
        continue;
      }
      if ("$in" in value && Array.isArray(value.$in)) {
        if (!value.$in.includes(docValue)) return false;
        continue;
      }
      if ("$nin" in value && Array.isArray(value.$nin)) {
        if (value.$nin.includes(docValue)) return false;
        continue;
      }
      if ("$regex" in value) {
        const regex = new RegExp(value.$regex, value.$options || "");
        if (!regex.test(String(docValue || ""))) return false;
        continue;
      }
    }

    // Igualdad estándar
    if (docValue !== value) {
      // Coincidencia suave para IDs y strings
      if (String(docValue) !== String(value)) return false;
    }
  }

  return true;
}

/**
 * Colección local en memoria con interfaz compatible con MongoDB
 */
class LocalCollection {
  constructor(name, initialDocs = [], onPersist) {
    this.name = name;
    this.docs = JSON.parse(JSON.stringify(initialDocs));
    this.onPersist = onPersist;
  }

  find(filter = {}) {
    const matched = this.docs.filter(doc => matchesFilter(doc, filter));
    let result = JSON.parse(JSON.stringify(matched));

    return {
      sort(sortObj = {}) {
        const entries = Object.entries(sortObj);
        if (entries.length > 0) {
          result.sort((a, b) => {
            for (const [field, direction] of entries) {
              const valA = a[field] ?? "";
              const valB = b[field] ?? "";
              if (valA < valB) return direction === 1 ? -1 : 1;
              if (valA > valB) return direction === 1 ? 1 : -1;
            }
            return 0;
          });
        }
        return this;
      },
      limit(n) {
        if (typeof n === "number" && n > 0) {
          result = result.slice(0, n);
        }
        return this;
      },
      toArray: async () => JSON.parse(JSON.stringify(result))
    };
  }

  async findOne(filter = {}) {
    const doc = this.docs.find(d => matchesFilter(d, filter));
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  }

  async insertOne(doc) {
    const toInsert = {
      _id: doc._id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...doc
    };
    this.docs.push(toInsert);
    this.onPersist?.();
    return { acknowledged: true, insertedId: toInsert._id };
  }

  async insertMany(docs) {
    const insertedIds = [];
    for (const doc of docs) {
      const toInsert = {
        _id: doc._id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...doc
      };
      this.docs.push(toInsert);
      insertedIds.push(toInsert._id);
    }
    this.onPersist?.();
    return { acknowledged: true, insertedCount: docs.length, insertedIds };
  }

  async updateOne(filter, update, options = {}) {
    const index = this.docs.findIndex(d => matchesFilter(d, filter));

    if (index !== -1) {
      const doc = this.docs[index];
      if (update.$set) {
        Object.assign(doc, update.$set);
      } else {
        Object.assign(doc, update);
      }
      this.onPersist?.();
      return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
    }

    if (options.upsert) {
      const newDoc = {
        _id: `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...(filter || {}),
        ...(update.$set || update || {})
      };
      this.docs.push(newDoc);
      this.onPersist?.();
      return { matchedCount: 0, modifiedCount: 0, upsertedId: newDoc._id, acknowledged: true };
    }

    return { matchedCount: 0, modifiedCount: 0, acknowledged: true };
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const index = this.docs.findIndex(d => matchesFilter(d, filter));

    if (index === -1) {
      if (options.upsert) {
        const newDoc = {
          _id: `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          ...(filter || {}),
          ...(update.$set || update || {})
        };
        this.docs.push(newDoc);
        this.onPersist?.();
        return JSON.parse(JSON.stringify(newDoc));
      }
      return null;
    }

    const previousDoc = JSON.parse(JSON.stringify(this.docs[index]));
    if (update.$set) {
      Object.assign(this.docs[index], update.$set);
    } else {
      Object.assign(this.docs[index], update);
    }
    this.onPersist?.();

    if (options.returnDocument === "after") {
      return JSON.parse(JSON.stringify(this.docs[index]));
    }
    return previousDoc;
  }

  async deleteOne(filter) {
    const index = this.docs.findIndex(d => matchesFilter(d, filter));
    if (index !== -1) {
      this.docs.splice(index, 1);
      this.onPersist?.();
      return { acknowledged: true, deletedCount: 1 };
    }
    return { acknowledged: true, deletedCount: 0 };
  }

  async countDocuments(filter = {}) {
    if (!filter || Object.keys(filter).length === 0) {
      return this.docs.length;
    }
    return this.docs.filter(d => matchesFilter(d, filter)).length;
  }
}

/**
 * Base de datos local determinista con persistencia en JSON
 */
class LocalDatabase {
  constructor() {
    this.collections = new Map();
    this.persistDebounceTimer = null;
    this.init();
  }

  init() {
    let savedData = null;

    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.warn(`[LocalDatabase] No se pudo crear directorio ${DATA_DIR}:`, err.message);
      }
    }

    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      try {
        const raw = fs.readFileSync(LOCAL_STORAGE_FILE, "utf-8");
        savedData = JSON.parse(raw);
        console.log(`[LocalDatabase] Almacenamiento local cargado desde: ${LOCAL_STORAGE_FILE}`);
      } catch (err) {
        console.warn("[LocalDatabase] Error leyendo local_storage.json, usando semillas por defecto:", err.message);
      }
    }

    const initialData = savedData || getDefaultSeedData();

    for (const [colName, docs] of Object.entries(initialData)) {
      this.collections.set(colName, new LocalCollection(colName, docs, () => this.schedulePersist()));
    }
  }

  schedulePersist() {
    if (this.persistDebounceTimer) clearTimeout(this.persistDebounceTimer);
    this.persistDebounceTimer = setTimeout(() => {
      this.persistToDisk();
    }, 150);
  }

  persistToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      const dump = {};
      for (const [name, col] of this.collections.entries()) {
        dump[name] = col.docs;
      }
      fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(dump, null, 2), "utf-8");
    } catch (err) {
      console.warn("[LocalDatabase] Error persistiendo almacenamiento a disco:", err.message);
    }
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new LocalCollection(name, [], () => this.schedulePersist()));
    }
    return this.collections.get(name);
  }
}

// Singleton de Base de Datos Local
const localDbInstance = new LocalDatabase();

// Instancia remota MongoClient
let cachedMongoClient = null;
let cachedRemoteDb = null;

/**
 * Obtener la base de datos según la política de ejecución
 * Mandamiento 6: local | auto | cloud
 */
export async function getDb() {
  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || "ajo-cdp-meta-db";

  // MODO 1: LOCAL (Incondicionalmente fuera de línea)
  if (CURRENT_MODE === EXECUTION_MODES.LOCAL) {
    storageStatus = {
      mode: "LOCAL",
      activeProvider: "local-json",
      isRemote: false,
      fallbackActive: false,
      isSimulated: true,
      lastCheck: new Date().toISOString()
    };
    return localDbInstance;
  }

  // MODO 2: CLOUD (Estrictamente remoto - falla explícitamente si Atlas no está disponible)
  if (CURRENT_MODE === EXECUTION_MODES.CLOUD) {
    if (!MONGODB_URI) {
      throw new Error("[StorageAdapter - Modo CLOUD] MONGODB_URI no está configurada en .env.local.");
    }
    if (!cachedRemoteDb) {
      const client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000
      });
      await client.connect();
      cachedMongoClient = client;
      cachedRemoteDb = client.db(DB_NAME);
      console.log(`[StorageAdapter] Conectado en Modo CLOUD a MongoDB Atlas (${DB_NAME})`);
    }
    storageStatus = {
      mode: "CLOUD",
      activeProvider: "mongodb-atlas",
      isRemote: true,
      fallbackActive: false,
      isSimulated: false,
      lastCheck: new Date().toISOString()
    };
    return cachedRemoteDb;
  }

  // MODO 3: AUTO (Intenta Atlas; si falla o no hay conexión, recurre al almacenamiento local determinista)
  if (cachedRemoteDb) {
    return cachedRemoteDb;
  }

  if (MONGODB_URI && !MONGODB_URI.includes("<username>")) {
    try {
      const client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 2500,
        connectTimeoutMS: 2500
      });
      await client.connect();
      cachedMongoClient = client;
      cachedRemoteDb = client.db(DB_NAME);
      console.log(`[StorageAdapter] Conexión Atlas exitosa en modo AUTO (${DB_NAME})`);

      storageStatus = {
        mode: "AUTO",
        activeProvider: "mongodb-atlas",
        isRemote: true,
        fallbackActive: false,
        isSimulated: false,
        lastCheck: new Date().toISOString()
      };
      return cachedRemoteDb;
    } catch (err) {
      console.warn(`[StorageAdapter] Conexión a MongoDB Atlas no disponible en modo AUTO: ${err.message}. Operando con adaptador local determinista.`);
    }
  } else {
    console.log("[StorageAdapter] Modo AUTO: MONGODB_URI sin configurar o placeholder detectado. Usando almacenamiento local.");
  }

  // Fallback a almacenamiento local determinista
  storageStatus = {
    mode: "AUTO",
    activeProvider: "local-json",
    isRemote: false,
    fallbackActive: true,
    isSimulated: true,
    lastCheck: new Date().toISOString()
  };
  return localDbInstance;
}

/**
 * Diagnóstico del estado del adaptador de almacenamiento
 */
export function getStorageStatus() {
  return {
    ...storageStatus,
    configuredMode: CURRENT_MODE,
    localStorageFile: LOCAL_STORAGE_FILE,
    collectionsCount: localDbInstance.collections.size
  };
}
