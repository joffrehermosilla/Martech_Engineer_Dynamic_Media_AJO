import { validateAssetRequest } from "../services/governanceEngine.mjs";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 TESTING BCP ASSET GOVERNANCE & MANDAMIENTOS");
  console.log("=================================================");

  // Test 1: Valid compliant request
  console.log("\n[Test 1] Valid Request for Active Initiative...");
  const res1 = await validateAssetRequest(
    "INIT-BCP-CAMP-2026-01",
    "PROMOTION",
    "Banner digital para préstamo personal con desembolso ágil",
    "AJO_INWEB"
  );
  console.log("Result 1:", res1.decision, "| Allowed:", res1.allowed, "| Reason:", res1.reason);
  if (res1.decision !== "ALLOW") console.error("❌ Test 1 Expected ALLOW!");

  // Test 2: Hallucination / Forbidden Term Detection
  console.log("\n[Test 2] Request with Prohibited False Promise (100% garantizado sin evaluación)...");
  const res2 = await validateAssetRequest(
    "INIT-BCP-CAMP-2026-01",
    "PROMOTION",
    "Préstamo 100% garantizado sin evaluación crediticia dinero fácil",
    "AJO_INWEB"
  );
  console.log("Result 2:", res2.decision, "| Allowed:", res2.allowed, "| Reason:", res2.reason);
  if (res2.decision !== "DENY") console.error("❌ Test 2 Expected DENY!");

  // Test 3: Unknown / Inactive Initiative ID
  console.log("\n[Test 3] Unknown Initiative ID...");
  const res3 = await validateAssetRequest(
    "INIT-UNKNOWN-9999",
    "PROMOTION",
    "Banner para producto no catalogado",
    "AJO_INWEB"
  );
  console.log("Result 3:", res3.decision, "| Allowed:", res3.allowed, "| Reason:", res3.reason);
  if (res3.decision !== "DENY") console.error("❌ Test 3 Expected DENY!");

  // Test 4: Unauthorized Channel
  console.log("\n[Test 4] Unauthorized Channel for Initiative...");
  const res4 = await validateAssetRequest(
    "INIT-BCP-CARD-2026-02",
    "PROMOTION",
    "Banner para tarjeta",
    "EMAIL" // Not in allowedChannels for INIT-BCP-CARD-2026-02
  );
  console.log("Result 4:", res4.decision, "| Allowed:", res4.allowed, "| Reason:", res4.reason);
  if (res4.decision !== "DENY") console.error("❌ Test 4 Expected DENY!");

  console.log("\n✅ All Governance Mandamientos Tests Finished.\n");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
