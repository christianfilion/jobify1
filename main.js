require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { withRetry } = require('./utils');
const { logToSupabase } = require('./supabase');

// ✅ Load all scraper modules
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

// ✅ Map ATS to correct handler
const atsHandlers = {
  Workday: scrapeWorkday,
  Taleo: scrapeTaleo,
  Lever: scrapeLever,
  Greenhouse: scrapeGreenhouse,
  SuccessFactors: scrapeSuccessFactors,
  Jobvite: scrapeJobvite,
  Brassring: scrapeBrassring,
  Recruitee: scrapeRecruitee,
  SmartRecruiters: scrapeSmartRecruiters,
  iCIMS: scrapeICIMS
};

// ✅ Load companies.json
const companies = JSON.parse(fs.readFileSync(path.join(__dirname, 'config/companies.json'), 'utf-8'));

(async () => {
  console.log("\n🚀 Starting Jobify Company-by-Company Scraper...\n");

  for (const company of companies) {
    const { name, ats, url } = company;
    const handler = atsHandlers[ats];

    if (!handler) {
      console.warn(`⚠️ No handler found for ATS "${ats}" (Company: ${name})`);
      continue;
    }

    try {
      console.log(`\n🔍 Scraping ${name} via ${ats}...`);
      await withRetry(() => handler({ company: name, url }), ats);
      console.log(`✅ Finished ${name}\n`);
    } catch (err) {
      console.error(`❌ Error scraping ${name}: ${err.message}`);
      await logToSupabase("ScrapeError", `❌ ${name} (${ats}): ${err.message}`);
    }
  }

  await logToSupabase("Success", "✅ Finished company-by-company scrape.");
  console.log("\n🏁 All companies processed.\n");
})();
