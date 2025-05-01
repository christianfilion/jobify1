require('dotenv').config();
const { withRetry } = require('./utils');
const { logToSupabase } = require('./supabase');

// ✅ Import all named scraper functions
const { scrapeWorkday } = require('./modules/workday-multi');
const { scrapeTaleo } = require('./modules/taleo');
const { scrapeLever } = require('./modules/lever');
const { scrapeGreenhouse } = require('./modules/greenhouse');
const { scrapeSuccessFactors } = require('./modules/successfactors');
const { scrapeJobvite } = require('./modules/jobvite');
const { scrapeBrassring } = require('./modules/brassring');
const { scrapeRecruitee } = require('./modules/recruitee');
const { scrapeSmartRecruiters } = require('./modules/smartrecruiters');
const { scrapeICIMS } = require('./modules/icims');

(async () => {
  console.log("\n🚀 Starting Full Jobify Scraping Engine...\n");

  try {
    await withRetry(scrapeWorkday, 'Workday');
    await withRetry(scrapeTaleo, 'Taleo');
    await withRetry(scrapeLever, 'Lever');
    await withRetry(scrapeGreenhouse, 'Greenhouse');
    await withRetry(scrapeSuccessFactors, 'SuccessFactors');
    await withRetry(scrapeJobvite, 'Jobvite');
    await withRetry(scrapeBrassring, 'Brassring');
    await withRetry(scrapeRecruitee, 'Recruitee');
    await withRetry(scrapeSmartRecruiters, 'SmartRecruiters');
    await withRetry(scrapeICIMS, 'iCIMS');

    await logToSupabase("Success", "✅ Full Jobify scraping engine completed.");
    console.log("\n✅ All scraping modules finished successfully.\n");
  } catch (err) {
    console.error("❌ Unexpected engine error:", err);
    await logToSupabase("Error", `Engine failure: ${err.message}`);
  }
})();
