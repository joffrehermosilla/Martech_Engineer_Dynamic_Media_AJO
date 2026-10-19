import { getProviderStatus, executePromptWithFallback } from "../services/providerRouter.mjs";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 TESTING MULTI-PROVIDER ROUTER & KEY ROTATION");
  console.log("=================================================");

  console.log("\n[Test 1] Inspect Provider Status & Registered Keys...");
  const status = getProviderStatus();
  console.table(status);

  console.log("\n[Test 2] Execute Creative Brief Prompt with Automatic Fallback...");
  const prompt = "Genera un copy breve para AJO InWeb sobre Préstamo al Toque BCP.";
  const result = await executePromptWithFallback(prompt);

  console.log("Result Provider:", result.provider);
  console.log("Success:", result.success);
  console.log("Latency:", result.latencyMs, "ms");
  console.log("Generated Content:\n", result.content);

  console.log("\n✅ Provider Router Tests Completed.\n");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Router Test Error:", err);
  process.exit(1);
});
