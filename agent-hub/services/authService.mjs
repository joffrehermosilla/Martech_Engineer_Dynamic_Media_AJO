/**
 * authService.mjs
 * Sistema de autenticación basado en roles para la plataforma DAM Martech.
 * Roles: ADMIN | MARTECH | VCD | VIEWER
 * Almacenamiento: MongoDB Atlas (colección: platform_users)
 */

import { getDb } from "./governanceEngine.mjs";
import crypto from "crypto";

// Token store in-memory (simple session tokens — en producción usar JWT firmado)
const activeSessions = new Map();

const ROLE_PERMISSIONS = {
  ADMIN: {
    label: "Administrador",
    icon: "🔐",
    color: "#FF7800",
    tabs: ["governance", "photocraft", "places", "catalog", "providers", "admin", "flow", "notifications", "connections"],
    canApprove: true,
    canEdit: true,
    canCreatePolicies: true,
    canManageRoles: true,
    canManageSquads: true,
    canSeeAllAssets: true,
    canConnectExternalDB: true
  },
  MARTECH: {
    label: "Martech Engineer",
    icon: "⚙️",
    color: "#0084FF",
    tabs: ["governance", "catalog", "providers", "flow", "notifications"],
    canApprove: true,
    canEdit: false,
    canCreatePolicies: true,
    canManageRoles: false,
    canManageSquads: false,
    canSeeAllAssets: true,
    canConnectExternalDB: false
  },
  VCD: {
    label: "Visual Content Designer",
    icon: "🎨",
    color: "#10B981",
    tabs: ["photocraft", "catalog", "flow"],
    canApprove: false,
    canEdit: true,
    canCreatePolicies: false,
    canManageRoles: false,
    canManageSquads: false,
    canSeeAllAssets: false,
    canConnectExternalDB: false
  },
  VIEWER: {
    label: "Viewer",
    icon: "👁️",
    color: "#94A3B8",
    tabs: ["catalog", "flow"],
    canApprove: false,
    canEdit: false,
    canCreatePolicies: false,
    canManageRoles: false,
    canManageSquads: false,
    canSeeAllAssets: false,
    canConnectExternalDB: false
  }
};

/**
 * Genera un token de sesión seguro
 */
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash de contraseña simple (SHA256 + salt)
 * En producción: usar bcrypt
 */
function hashPassword(password, salt) {
  return crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

/**
 * Login: verifica credenciales y devuelve token de sesión
 */
export async function loginUser(username, password) {
  try {
    const db = await getDb();

    // Buscar usuario en Atlas
    let user = await db.collection("platform_users").findOne({ username });

    // Si no existe ningún usuario, crear admin por defecto
    const totalUsers = await db.collection("platform_users").countDocuments();
    if (totalUsers === 0) {
      await seedDefaultUsers(db);
      user = await db.collection("platform_users").findOne({ username });
    }

    if (!user) {
      return { success: false, error: "Usuario no encontrado." };
    }

    if (!user.isActive) {
      return { success: false, error: "Usuario deshabilitado. Contacte al administrador." };
    }

    const hashedInput = hashPassword(password, user.salt);
    if (hashedInput !== user.passwordHash) {
      return { success: false, error: "Contraseña incorrecta." };
    }

    // Crear sesión
    const token = generateToken();
    const session = {
      token,
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      networkGroup: user.networkGroup || "DEFAULT",
      squadId: user.squadId || null,
      permissions: ROLE_PERMISSIONS[user.role],
      createdAt: Date.now(),
      expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
    };

    activeSessions.set(token, session);

    // Log de acceso
    await db.collection("audit_log").insertOne({
      action: "USER_LOGIN",
      username: user.username,
      role: user.role,
      networkGroup: user.networkGroup,
      timestamp: new Date(),
      ip: "platform"
    });

    return {
      success: true,
      token,
      user: {
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        networkGroup: user.networkGroup,
        permissions: ROLE_PERMISSIONS[user.role]
      }
    };
  } catch (err) {
    console.error("[AuthService] Login error:", err.message);
    return { success: false, error: "Error de autenticación: " + err.message };
  }
}

/**
 * Verifica token y devuelve la sesión activa
 */
export function verifyToken(token) {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session;
}

/**
 * Logout
 */
export function logoutUser(token) {
  activeSessions.delete(token);
  return { success: true };
}

/**
 * Obtiene los permisos de un rol
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.VIEWER;
}

/**
 * Devuelve todos los roles disponibles
 */
export function getAllRoles() {
  return Object.entries(ROLE_PERMISSIONS).map(([key, val]) => ({
    key,
    ...val
  }));
}

/**
 * Middleware Express: verifica token en header Authorization: Bearer <token>
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.replace("Bearer ", "").trim();
  const session = verifyToken(token);

  if (!session) {
    return res.status(401).json({ error: "No autorizado. Token inválido o expirado." });
  }

  req.session = session;
  next();
}

/**
 * Middleware: verifica que el rol tenga un permiso específico
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.session) return res.status(401).json({ error: "No autenticado." });
    if (!req.session.permissions[permission]) {
      return res.status(403).json({
        error: `Permiso denegado. Su rol '${req.session.role}' no tiene acceso a '${permission}'.`
      });
    }
    next();
  };
}

/**
 * Crea usuarios por defecto en la primera ejecución
 */
async function seedDefaultUsers(db) {
  const defaultUsers = [
    {
      username: "admin",
      password: "Admin2026!",
      fullName: "Administrador del Sistema",
      role: "ADMIN",
      networkGroup: "CORE_NETWORK",
      isActive: true
    },
    {
      username: "martech1",
      password: "Martech2026!",
      fullName: "Martech Engineer",
      role: "MARTECH",
      networkGroup: "MARTECH_TEAM",
      isActive: true
    },
    {
      username: "designer1",
      password: "Design2026!",
      fullName: "Visual Content Designer",
      role: "VCD",
      networkGroup: "CREATIVE_SQUAD",
      isActive: true
    },
    {
      username: "viewer1",
      password: "View2026!",
      fullName: "Stakeholder Viewer",
      role: "VIEWER",
      networkGroup: "STAKEHOLDERS",
      isActive: true
    }
  ];

  for (const u of defaultUsers) {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(u.password, salt);
    await db.collection("platform_users").insertOne({
      username: u.username,
      passwordHash,
      salt,
      fullName: u.fullName,
      role: u.role,
      networkGroup: u.networkGroup,
      isActive: u.isActive,
      createdAt: new Date()
    });
  }
  console.log("[AuthService] ✅ Usuarios por defecto creados en MongoDB Atlas.");
}

/**
 * Lista todos los usuarios (solo ADMIN)
 */
export async function listUsers(filters = {}) {
  const db = await getDb();
  const users = await db.collection("platform_users").find(filters, {
    projection: { passwordHash: 0, salt: 0 }
  }).toArray();
  return users;
}

/**
 * Crea o actualiza un usuario
 */
export async function upsertUser(userData) {
  const db = await getDb();
  const { username, password, fullName, role, networkGroup, squadId, isActive } = userData;

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = password ? hashPassword(password, salt) : undefined;

  const update = {
    $set: {
      fullName,
      role,
      networkGroup,
      squadId: squadId || null,
      isActive: isActive !== false,
      updatedAt: new Date()
    }
  };

  if (passwordHash) {
    update.$set.passwordHash = passwordHash;
    update.$set.salt = salt;
  }

  const result = await db.collection("platform_users").updateOne(
    { username },
    { ...update, $setOnInsert: { username, createdAt: new Date() } },
    { upsert: true }
  );

  return { success: true, result };
}

export { ROLE_PERMISSIONS };
