import { executePhotoCraftEdit } from "../services/photocraftAdapter.mjs";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 TESTING PHOTOCRAFT ADAPTER & SANDBOX ENGINE");
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

  const result = await executePhotoCraftEdit(options);
  console.log("Job Execution Result:", JSON.stringify(result, null, 2));

  if (result.success && result.outputPath) {
    console.log("\n✅ PhotoCraft Adapter Test PASSED: Candidate generated at:", result.outputPath);
  } else {
    console.error("❌ PhotoCraft Adapter Test FAILED");
  }
  process.exit(0);
}

runTests().catch(err => {
  console.error("PhotoCraft Test Error:", err);
  process.exit(1);
});
