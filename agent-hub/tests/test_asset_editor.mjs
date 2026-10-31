/**
 * test_asset_editor.mjs
 * Pruebas automatizadas de la Fase 2: Servicio de edición de activos, transformaciones, versiones y exportación.
 */

import fs from "fs/promises";
import {
  executeAssetTransform,
  buildPreviewMetadata,
  listAssetVersions,
  getAssetDetails,
  SUPPORTED_FORMATS,
  BCP_ASPECT_RATIOS
} from "../services/assetEditorService.mjs";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 TESTING FASE 2: NATIVE ASSET EDITOR SERVICE");
  console.log("=================================================");

  // 1. Verificación de Formatos y Presets Oficiales
  console.log("\n[Test 1] Verificando formatos soportados y presets BCP...");
  console.log("Formatos soportados:", SUPPORTED_FORMATS.join(", "));
  if (!SUPPORTED_FORMATS.includes("png") || !SUPPORTED_FORMATS.includes("jpg") || !SUPPORTED_FORMATS.includes("webp")) {
    throw new Error("Faltan formatos básicos obligatorios.");
  }

  const presets = Object.keys(BCP_ASPECT_RATIOS);
  console.log("Presets disponibles:", presets.join(", "));
  if (!BCP_ASPECT_RATIOS.AJO_INWEB_BANNER || BCP_ASPECT_RATIOS.AJO_INWEB_BANNER.width !== 1200) {
    throw new Error("Preset AJO_INWEB_BANNER incorrecto.");
  }
  console.log("✅ Presets y formatos verificados.");

  // 2. Cálculo de Metadatos de Previsualización (Preview Engine)
  console.log("\n[Test 2] Probando motor de cálculo de previsualización...");
  const operations = [
    { type: "crop", width: 1200, height: 628 },
    { type: "rotate", degrees: 90 },
    { type: "flip", horizontal: true },
    { type: "adjust", adjustments: { brightness: 15, contrast: 10, saturation: -5 } },
    { type: "brand_overlay", brand: "BCP_OFFICIAL" }
  ];

  const preview = buildPreviewMetadata(operations, { width: 800, height: 800 });
  console.log("Preview calculado:", JSON.stringify(preview, null, 2));

  // Tras crop a 1200x628 y rotación de 90°, el ancho debe ser 628 y alto 1200
  if (preview.targetDimensions.width !== 628 || preview.targetDimensions.height !== 1200) {
    throw new Error(`Dimensiones inesperadas tras rotación: ${preview.targetDimensions.width}x${preview.targetDimensions.height}`);
  }
  if (!preview.flipped.horizontal) throw new Error("Fallo en volteo horizontal");
  if (preview.adjustments.brightness !== 15) throw new Error("Fallo en ajustes de brillo");
  if (preview.brandOverlay !== "BCP_OFFICIAL") throw new Error("Fallo en overlay de marca");
  console.log("✅ Cálculo de previsualización correcto.");

  // 3. Ejecución de Transformación Real y Creación de Versión
  console.log("\n[Test 3] Ejecutando transformación de activo (asset.transform)...");
  const testAssetId = `test_ast_${Date.now()}`;
  const transform1 = await executeAssetTransform({
    assetId: testAssetId,
    operations: [
      { type: "crop", width: 1200, height: 628 },
      { type: "brand_overlay", brand: "BCP_OFFICIAL" }
    ],
    outputFormat: "svg",
    actor: "designer1"
  });

  console.log("Resultado Transform 1:", {
    jobId: transform1.jobId,
    version: transform1.version,
    url: transform1.outputRelativeUrl
  });

  if (!transform1.success || transform1.version !== "v1.1") {
    throw new Error(`Versión inesperada tras primera transformación: ${transform1.version}`);
  }

  // Comprobar que el archivo se guardó físicamente en disco
  const fileExists = await fs.stat(transform1.outputPath).then(() => true).catch(() => false);
  console.log("Archivo exportado existe en disco:", fileExists ? "SÍ" : "NO");
  if (!fileExists) throw new Error("El archivo exportado no existe en disco.");

  // 4. Segunda Transformación (Generación de v1.2 sin destruir v1.1 ni el original)
  console.log("\n[Test 4] Ejecutando segunda transformación para probar versionamiento incremental...");
  const transform2 = await executeAssetTransform({
    assetId: testAssetId,
    operations: [
      { type: "crop", width: 800, height: 800 },
      { type: "adjust", adjustments: { brightness: 20 } }
    ],
    outputFormat: "svg",
    actor: "martech1"
  });

  console.log("Resultado Transform 2:", {
    jobId: transform2.jobId,
    version: transform2.version,
    url: transform2.outputRelativeUrl
  });

  if (!transform2.success || transform2.version !== "v1.2") {
    throw new Error(`Versión inesperada tras segunda transformación: ${transform2.version}`);
  }

  // 5. Listar Historial de Versiones (asset.versions)
  console.log("\n[Test 5] Consultando historial completo de versiones (asset.versions)...");
  const versionHistory = await listAssetVersions(testAssetId);
  console.log("Historial de versiones:", JSON.stringify(versionHistory.versions, null, 2));

  if (versionHistory.versions.length !== 3) {
    throw new Error(`Se esperaban 3 versiones (Original, v1.1, v1.2), pero se obtuvieron ${versionHistory.versions.length}`);
  }
  if (!versionHistory.versions[0].isOriginal) {
    throw new Error("La primera versión no está identificada como archivo original.");
  }
  console.log("✅ Preservación de versiones y original verificada.");

  // 6. Validación de Errores ante Formatos No Soportados
  console.log("\n[Test 6] Probando validación de formatos no permitidos...");
  try {
    await executeAssetTransform({
      assetId: testAssetId,
      operations: [],
      outputFormat: "exe", // Formato no válido
      actor: "test"
    });
    throw new Error("El servicio no rechazó el formato no válido.");
  } catch (err) {
    if (err.message.includes("no soportado")) {
      console.log("✅ Formato inválido rechazado correctamente con mensaje descriptivo.");
    } else {
      throw err;
    }
  }

  console.log("\n=================================================");
  console.log("🎉 TODAS LAS PRUEBAS DE FASE 2 PASARON CON ÉXITO");
  console.log("=================================================");
}

runTests().catch(err => {
  console.error("❌ Error en pruebas de Fase 2:", err);
  process.exit(1);
});
