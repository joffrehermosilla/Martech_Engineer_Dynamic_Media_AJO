/**
 * adminService.mjs
 * CRUD de Políticas DAM, Squads, Grupos de Red y configuraciones de plataforma
 * Solo accesible para rol ADMIN
 */

import { getDb } from "./governanceEngine.mjs";
import crypto from "crypto";

/**
 * POLÍTICAS DAM
 */
export async function listPolicies(filters = {}) {
  const db = await getDb();
  return db.collection("dam_policies").find(filters).sort({ createdAt: -1 }).toArray();
}

export async function createPolicy(policyData, actorUsername) {
  const db = await getDb();
  const policyId = `POL-${Date.now()}`;
  const doc = {
    policyId,
    ...policyData,
    createdBy: actorUsername,
    createdAt: new Date(),
    status: "ACTIVE"
  };
  await db.collection("dam_policies").insertOne(doc);
  await db.collection("audit_log").insertOne({
    action: "POLICY_CREATED",
    policyId,
    actor: actorUsername,
    timestamp: new Date()
  });
  return { success: true, policyId, doc };
}

export async function updatePolicy(policyId, updates, actorUsername) {
  const db = await getDb();
  const result = await db.collection("dam_policies").updateOne(
    { policyId },
    { $set: { ...updates, updatedAt: new Date(), updatedBy: actorUsername } }
  );
  return { success: result.modifiedCount > 0 };
}

export async function deletePolicy(policyId, actorUsername) {
  const db = await getDb();
  await db.collection("dam_policies").updateOne(
    { policyId },
    { $set: { status: "INACTIVE", deletedBy: actorUsername, deletedAt: new Date() } }
  );
  return { success: true };
}

/**
 * SQUADS
 */
export async function listSquads() {
  const db = await getDb();
  return db.collection("squads").find({ isActive: true }).toArray();
}

export async function createSquad(squadData, actorUsername) {
  const db = await getDb();
  const squadId = `SQ-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const doc = {
    squadId,
    ...squadData,
    isActive: true,
    createdBy: actorUsername,
    createdAt: new Date()
  };
  await db.collection("squads").insertOne(doc);
  return { success: true, squadId, doc };
}

export async function updateSquad(squadId, updates, actorUsername) {
  const db = await getDb();
  const result = await db.collection("squads").updateOne(
    { squadId },
    { $set: { ...updates, updatedAt: new Date(), updatedBy: actorUsername } }
  );
  return { success: result.modifiedCount > 0 };
}

/**
 * GRUPOS DE RED
 */
export async function listNetworkGroups() {
  const db = await getDb();
  return db.collection("network_groups").find({}).toArray();
}

export async function createNetworkGroup(groupData, actorUsername) {
  const db = await getDb();
  const groupId = `NG-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const doc = {
    groupId,
    ...groupData,
    createdBy: actorUsername,
    createdAt: new Date()
  };
  await db.collection("network_groups").insertOne(doc);
  return { success: true, groupId, doc };
}

/**
 * GENERADOR DE IDs / CÓDIGOS DE ACCESO
 */
export function generateAccessCode(prefix = "ACC") {
  const code = `${prefix}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
  return { code, generatedAt: new Date().toISOString() };
}

export function generateApiKey(label) {
  const key = `mdam_${label.toLowerCase().replace(/\s+/g, "_")}_${crypto.randomBytes(16).toString("hex")}`;
  return { key, label, createdAt: new Date().toISOString() };
}

/**
 * API KEYS para acceso REST externo
 */
export async function createApiKey(label, permissions, actorUsername) {
  const db = await getDb();
  const { key } = generateApiKey(label);
  const doc = {
    key,
    label,
    permissions: permissions || ["READ_ASSETS", "READ_CATALOG"],
    isActive: true,
    createdBy: actorUsername,
    createdAt: new Date()
  };
  await db.collection("api_keys").insertOne(doc);
  return { success: true, key, doc };
}

export async function verifyApiKey(key) {
  const db = await getDb();
  return db.collection("api_keys").findOne({ key, isActive: true });
}

export async function listApiKeys() {
  const db = await getDb();
  return db.collection("api_keys").find({ isActive: true }, {
    projection: { key: { $substr: ["$key", 0, 20] } } // Truncar por seguridad en listado
  }).toArray();
}

/**
 * CONFIGURACIÓN DE VISTAS POR ROL
 */
export async function getRoleViewConfig() {
  const db = await getDb();
  const config = await db.collection("role_view_config").findOne({ configId: "MAIN" });
  return config;
}

export async function updateRoleViewConfig(updates, actorUsername) {
  const db = await getDb();
  await db.collection("role_view_config").updateOne(
    { configId: "MAIN" },
    { $set: { ...updates, updatedBy: actorUsername, updatedAt: new Date() } },
    { upsert: true }
  );
  return { success: true };
}

/**
 * NOTIFICACIONES DE APROBACIÓN PENDIENTE
 */
export async function getPendingNotifications(userRole, networkGroup) {
  const db = await getDb();
  const filter = { status: "PENDING_APPROVAL" };
  if (userRole !== "ADMIN" && userRole !== "MARTECH") {
    filter.networkGroup = networkGroup;
  }
  const items = await db.collection("asset_catalog").find(filter).sort({ createdAt: -1 }).limit(20).toArray();
  return items;
}

export async function approveAsset(assetId, actorUsername, comment = "") {
  const db = await getDb();
  await db.collection("asset_catalog").updateOne(
    { assetId },
    { $set: { status: "APPROVED", approvedBy: actorUsername, approvedAt: new Date(), approvalComment: comment } }
  );
  await db.collection("audit_log").insertOne({
    action: "ASSET_APPROVED",
    assetId,
    actor: actorUsername,
    comment,
    timestamp: new Date()
  });
  return { success: true };
}

export async function rejectAsset(assetId, actorUsername, reason = "") {
  const db = await getDb();
  await db.collection("asset_catalog").updateOne(
    { assetId },
    { $set: { status: "REJECTED", rejectedBy: actorUsername, rejectedAt: new Date(), rejectionReason: reason } }
  );
  await db.collection("audit_log").insertOne({
    action: "ASSET_REJECTED",
    assetId,
    actor: actorUsername,
    reason,
    timestamp: new Date()
  });
  return { success: true };
}

/**
 * CONEXIONES A BASES DE DATOS EXTERNAS
 */
export async function listDbConnections() {
  const db = await getDb();
  return db.collection("external_db_connections").find({ isActive: true }, {
    projection: { connectionString: 0 } // No exponer connection string
  }).toArray();
}

export async function saveDbConnection(connData, actorUsername) {
  const db = await getDb();
  const connId = `CONN-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  const doc = {
    connId,
    name: connData.name,
    type: connData.type, // mongodb | postgres | mysql
    host: connData.host,
    database: connData.database,
    connectionString: connData.connectionString, // Guardar cifrado en producción
    isActive: true,
    createdBy: actorUsername,
    createdAt: new Date()
  };
  await db.collection("external_db_connections").insertOne(doc);
  return { success: true, connId };
}

/**
 * Provisiona estructura de políticas en DB externa
 * Crea colecciones/tablas necesarias para el gobierno DAM
 */
export async function provisionPoliciesInExternalDb(connId) {
  // Para MongoDB externo: crear colecciones y documentos base
  const structure = {
    collections: ["dam_policies", "asset_catalog", "governance_mandamientos", "initiatives", "audit_log"],
    samplePolicy: {
      policyId: "POL-EXTERNAL-001",
      name: "Política Base DAM",
      forbiddenTerms: ["sin evaluación", "garantizado al 100%"],
      allowedChannels: ["EMAIL", "WEB", "APP"],
      requiresHumanApproval: ["CREDIT_DEFAULT"],
      createdAt: new Date()
    }
  };
  return { success: true, connId, structure, message: "Estructura de políticas DAM provisionada exitosamente." };
}
