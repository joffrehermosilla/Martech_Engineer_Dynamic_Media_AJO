/**
 * test_storage_modes.mjs
 * Pruebas automatizadas de la Fase 1: Modo local-first, adaptadores de almacenamiento y datos deterministas.
 */

import { getDb, getStorageStatus, EXECUTION_MODES } from "../services/storageAdapter.mjs";
import { loginUser, listUsers } from "../services/authService.mjs";
import { listPolicies, createPolicy } from "../services/adminService.mjs";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 TESTING FASE 1: STORAGE ADAPTER & LOCAL-FIRST");
  console.log("=================================================");

  // 1. Diagnóstico de Estado y Modo
  console.log("\n[Test 1] Verificando estado del adaptador de almacenamiento...");
  const status = getStorageStatus();
  console.log("Status:", JSON.stringify(status, null, 2));

  if (!status.mode) throw new Error("Status no incluye modo.");
  console.log(`✅ Adaptador configurado en modo: ${status.mode} | Proveedor activo: ${status.activeProvider}`);

  // 2. Autenticación Local Determinista
  console.log("\n[Test 2] Probando login con cuentas demo en modo local...");
  const adminLogin = await loginUser("admin", "Admin2026!");
  console.log("Login Admin:", adminLogin.success ? "SUCCESS" : "FAILED", "| Rol:", adminLogin.user?.role);
  if (!adminLogin.success || adminLogin.user?.role !== "ADMIN") {
    throw new Error("Fallo en login de usuario admin");
  }

  const badLogin = await loginUser("admin", "PasswordEquivocado!");
  console.log("Login con clave incorrecta rechazado:", !badLogin.success ? "CORRECTO" : "FALLÓ");
  if (badLogin.success) throw new Error("El login con clave incorrecta no fue rechazado.");

  const martechLogin = await loginUser("martech1", "Martech2026!");
  console.log("Login Martech:", martechLogin.success ? "SUCCESS" : "FAILED", "| Rol:", martechLogin.user?.role);
  if (!martechLogin.success || martechLogin.user?.role !== "MARTECH") {
    throw new Error("Fallo en login de usuario martech1");
  }

  // 3. Listar usuarios
  console.log("\n[Test 3] Consultando usuarios en almacén determinista...");
  const users = await listUsers();
  console.log(`Usuarios registrados: ${users.length}`);
  if (users.length < 4) throw new Error("No se encontraron las 4 cuentas demo.");
  console.log("✅ Cuentas encontradas:", users.map(u => `${u.username} (${u.role})`).join(", "));

  // 4. Políticas DAM y Creación
  console.log("\n[Test 4] CRUD de políticas DAM en almacén local...");
  const initialPolicies = await listPolicies();
  console.log(`Políticas iniciales: ${initialPolicies.length}`);

  const newPolicy = await createPolicy({
    title: "Política de Prueba Fase 1 Local",
    description: "Verificación de persistencia determinista",
    aspectRatio: "1:1",
    maxWeightKb: 200,
    allowedFormats: ["png", "jpg"]
  }, "admin");

  console.log("Política creada:", newPolicy.success ? "SUCCESS" : "FAILED", "| ID:", newPolicy.policyId);
  if (!newPolicy.success) throw new Error("Fallo al crear política");

  const updatedPolicies = await listPolicies();
  console.log(`Políticas tras inserción: ${updatedPolicies.length}`);
  if (updatedPolicies.length !== initialPolicies.length + 1) {
    throw new Error("El conteo de políticas no aumentó tras la creación.");
  }

  // 5. Verificar Colecciones del Catálogo
  console.log("\n[Test 5] Verificando catálogo de assets determinista...");
  const db = await getDb();
  const catalogAssets = await db.collection("asset_catalog").find().toArray();
  console.log(`Activos en catálogo: ${catalogAssets.length}`);
  if (catalogAssets.length === 0) throw new Error("El catálogo de assets está vacío.");

  console.log("\n=================================================");
  console.log("🎉 TODAS LAS PRUEBAS DE FASE 1 PASARON CON ÉXITO");
  console.log("=================================================");
}

runTests().catch(err => {
  console.error("❌ Error en pruebas de Fase 1:", err);
  process.exit(1);
});
