import { executeDamCraftEdit } from "../services/damcraftAdapter.mjs";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 TESTING DAM CRAFT ADAPTER & SANDBOX ENGINE");
  console.log("=================================================");

  const options = {
    jobId: `test_job_${Date.now()}`,
    sourceImagePath: "assets/sample_banner.png",
    actions: [
      { type: "crop", width: 1200, height: 628 },
      { type: "brand_overlay", logo: "bcp_white.png" },
      { type: "color_profile", profile: "sRGB_IEC61966-2.1" }
    ],
    outputFormat: "avif",
    targetFileName: "ajo_inweb_prestamo_toque"
  };

  const result = await executeDamCraftEdit(options);
  console.log("Job Execution Result:", JSON.stringify(result, null, 2));

  if (result.success && result.outputPath) {
    console.log("\n✅ DAM Craft Adapter Test PASSED: Candidate generated at:", result.outputPath);
  } else {
    console.error("❌ DAM Craft Adapter Test FAILED");
  }
  process.exit(0);
}

runTests().catch(err => {
  console.error("DAM Craft Test Error:", err);
  process.exit(1);
});
