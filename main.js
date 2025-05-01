require('dotenv').config();
const { withRetry } = require('./utils');
const { logToSupabase } = require('./supabase');

(async () => {
  console.log("\n🚀 Starting Full Jobify Scraping Engine...\n");

  try {
    await withRetry(() => require('./modules/workday-multi')(), 'Workday');
    await withRetry(() => require('./modules/taleo')(), 'Taleo');
    await withRetry(() => require('./modules/lever')(), 'Lever');
    await withRetry(() => require('./modules/greenhouse')(), 'Greenhouse');
    await withRetry(() => require('./modules/successfactors')(), 'SuccessFactors');
    await withRetry(() => require('./modules/jobvite')(), 'Jobvite');
    await withRetry(() => require('./modules/brassring')(), 'Brassring');
    await withRetry(() => require('./modules/recruitee')(), 'Recruitee');
    await withRetry(() => require('./modules/smartrecruiters')(), 'SmartRecruiters');
    await withRetry(() => require('./modules/icims')(), 'iCIMS');

    await logToSupabase("Success", "✅ Full Jobify scraping engine completed.");
    console.log("\n✅ All scraping modules finished successfully.\n");
  } catch (err) {
    console.error("❌ Unexpected engine error:", err);
    await logToSupabase("Error", `Engine failure: ${err.message}`);
  }
})();
