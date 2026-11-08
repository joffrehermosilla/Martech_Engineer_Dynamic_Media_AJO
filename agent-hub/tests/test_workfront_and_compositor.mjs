import assert from "assert";
import { getWorkfrontMetadata, processWorkfrontWebhook, executeFusionAction, getRecentWorkfrontEvents } from "../services/workfrontService.mjs";
import { executeDamCraftEdit } from "../services/damcraftAdapter.mjs";

console.log("=================================================");
console.log("🧪 TESTING WORKFRONT, FUSION & DAM CRAFT ENGINE");
console.log("=================================================");

async function runTests() {
  // Test 1: Workfront Document Webhooks Metadata
  console.log("\n[Test 1] Workfront Metadata endpoint...");
  const metadata = getWorkfrontMetadata();
  assert.strictEqual(metadata.name, "BCP DAM Craft Integration");
  assert.strictEqual(metadata.version, "2.0.0-STAGE2");
  assert.ok(metadata.supportedWebhookEvents.includes("document.approval"));
  console.log("✅ Workfront Metadata valid:", metadata.name);

  // Test 2: Ingest Creative Brief / Use Case
  console.log("\n[Test 2] Workfront Ingest Creative Brief...");
  const briefEvent = await processWorkfrontWebhook({
    eventType: "PROJECT_BRIEF_CREATED",
    initiativeId: "INIT-BCP-CAMP-2026-01",
    title: "Campaña Navideña 2026 - Tarjetas",
    description: "Crear banner para banca móvil con logo BCP y fondo azul marino",
    channel: "AJO_INWEB",
    actorId: "director.creativo@bcp.com.pe"
  });
  assert.strictEqual(briefEvent.success, true);
  assert.ok(briefEvent.status === "APPROVED" || briefEvent.status === "BRIEF_INGESTED");
  console.log("✅ Brief Ingestion passed:", briefEvent.initiativeId, "with governance status:", briefEvent.status);

  // Test 3: Document Approval Decision Webhook
  console.log("\n[Test 3] Workfront Document Approval Decision Webhook...");
  const approvalEvent = await processWorkfrontWebhook({
    eventType: "DOCUMENT_APPROVAL_DECISION",
    documentId: "aem_asset_visa_signature_card",
    status: "APPROVED",
    actorId: "maria.santos@bcp.com.pe",
    comments: "Aprobado formalmente bajo directriz de marca BCP."
  });
  assert.strictEqual(approvalEvent.success, true);
  assert.strictEqual(approvalEvent.status, "APPROVED");
  console.log("✅ Approval Decision Webhook passed:", approvalEvent.documentId, "->", approvalEvent.status);

  // Test 4: Workfront Fusion Scenario Trigger
  console.log("\n[Test 4] Workfront Fusion Scenario Trigger...");
  const fusionResult = await executeFusionAction({
    scenarioId: "SCENARIO_1_BRIEF_TO_DAMCRAFT",
    action: "ALTERNATE_FLOW",
    parameters: { initiativeId: "INIT-BCP-CAMP-2026-01", stage: "PHASE_2_COMPOSITING" }
  });
  assert.strictEqual(fusionResult.success, true);
  assert.strictEqual(fusionResult.scenarioId, "SCENARIO_1_BRIEF_TO_DAMCRAFT");
  console.log("✅ Fusion Scenario execution passed:", fusionResult.scenarioId);

  // Test 5: Verify Event Audit Log
  console.log("\n[Test 5] Workfront Audit Log verification...");
  const logData = await getRecentWorkfrontEvents();
  assert.ok(logData.eventsCount >= 1 || logData.events.length >= 1);
  console.log("✅ Audit Log contains", logData.eventsCount, "events and", logData.fusionLogsCount, "fusion logs.");

  // Test 6: DAM Craft Execution
  console.log("\n[Test 6] DAM Craft Transform Execution...");
  const editResult = await executeDamCraftEdit({
    jobId: "test_damcraft_job_001",
    sourceImagePath: "samples/prestamo_base.png",
    actions: [{ type: "crop", width: 1080, height: 1080 }]
  });
  assert.strictEqual(editResult.success, true);
  assert.strictEqual(editResult.metadata.engine, "DAM-Craft-Sandboxed-Bridge");
  console.log("✅ DAM Craft Transformation passed:", editResult.metadata.engine);

  console.log("\n🎉 ALL 6 INTEGRATION TESTS COMPLETED SUCCESSFULLY!");
}

runTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
