const { chromium } = require('playwright-extra');
const stealth = require('playwright-extra-plugin-stealth')();
const { insertJobs } = require('../supabase');

chromium.use(stealth);

async function scrapeICIMS() {
  console.log("🔍 Scraping iCIMS with XHR response interception...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://jobs.icims.com/jobs/search?ss=1&searchLocation='; // Example
  let jobs = [];

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/jobs/search.json') || url.includes('/jobs/')) {
      try {
        const json = await response.json();
        const results = json.jobs || json || [];
        results.forEach(job => {
          jobs.push({
            title: job.title || "Untitled",
            url: job.link || job.url || response.url()
          });
        });
      } catch (e) {}
    }
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(8000); // Allow time for XHR to load

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found via iCIMS XHR.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} jobs from iCIMS.`);
  }

  await browser.close();
}
module.exports = { scrapeICIMS };
