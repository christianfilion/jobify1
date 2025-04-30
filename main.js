require('dotenv').config();
const { scrapeWorkday } = require('./modules/workday');
const { scrapeLever } = require('./modules/lever');
const { scrapeTaleo } = require('./modules/taleo');
const { logToSupabase } = require('./supabase');

(async () => {
  try {
    console.log("🚀 Starting Jobify Scraping Engine...");
    await scrapeWorkday();
    await scrapeLever();
    await scrapeTaleo();
    await logToSupabase("Success", "Scraping completed without errors.");
    console.log("✅ All ATS scraping tasks completed.");
  } catch (error) {
    console.error("❌ Error during scraping:", error);
    await logToSupabase("Error", error.message);
  }
})();
