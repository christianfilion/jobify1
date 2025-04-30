const { chromium } = require('playwright-extra');
const stealth = require('playwright-extra-plugin-stealth')();
const { insertJobs } = require('../supabase');

chromium.use(stealth);

async function scrapeSmartRecruiters() {
  console.log("📡 Scraping SmartRecruiters with XHR response capture...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://jobs.smartrecruiters.com/company-name'; // Replace with actual company page
  let jobs = [];

  page.on('response', async (response) => {
    const resUrl = response.url();
    if (resUrl.includes('/jobs') && resUrl.endsWith('.json')) {
      try {
        const data = await response.json();
        const results = data.content || data || [];
        results.forEach(job => {
          jobs.push({
            title: job.name || job.title || "Untitled",
            url: job.ref || job.applyUrl || response.url()
          });
        });
      } catch (_) {}
    }
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(8000);

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found via SmartRecruiters.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} SmartRecruiters jobs.`);
  }

  await browser.close();
}
module.exports = { scrapeSmartRecruiters };
