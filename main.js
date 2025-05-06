require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { withRetry } = require('./utils');
const { logToSupabase } = require('./supabase');
const { runtime } = require('./config'); // 👈 Inject runtime options

// Import ATS handlers
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

// Map ATS to handlers
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

// Load companies list
const companies = JSON.parse(fs.readFileSync(path.join(__dirname, 'config/companies.json'), 'utf-8'));

// Optionally filter by company if provided in runtime
const targetCompanies = runtime.company
  ? companies.filter(c => c.name.toLowerCase().includes(runtime.company.toLowerCase()))
  : companies;

(async () => {
  console.log("\n🚀 Starting Jobify with Runtime Options:\n", runtime);

  for (const company of targetCompanies) {
    const { name, ats, url } = company;
    const handler = atsHandlers[ats];

    if (!handler) {
      console.warn(`⚠️ No handler for ${ats} (Company: ${name})`);
      continue;
    }

    try {
      console.log(`🔍 Scraping ${name} via ${ats}...`);
      await withRetry(() => handler({ company: name, url, proxy: runtime.proxy }), ats);
      console.log(`✅ Finished ${name}`);
    } catch (err) {
      console.error(`❌ Error scraping ${name}: ${err.message}`);
      await logToSupabase("ScrapeError", `❌ ${name}: ${err.message}`);
    }

    // ⏳ Add delay if configured
    if (runtime.delay) {
      console.log(`⏱ Waiting ${runtime.delay}ms before next company...`);
      await new Promise(res => setTimeout(res, runtime.delay));
    }
  }

  await logToSupabase("Success", "✅ All companies processed.");
  console.log("\n🏁 Scraping session complete.\n");
})();
