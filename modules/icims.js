const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeICIMS() {
  console.log("🔍 Scraping iCIMS with Puppeteer + XHR response interception...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36');

  const url = 'https://jobs.icims.com/jobs/search?ss=1&searchLocation=';
  let jobs = [];

  // Intercept and parse job-related JSON responses
  page.on('response', async (response) => {
    const resUrl = response.url();
    if (resUrl.includes('/jobs/search.json') || resUrl.includes('/jobs/')) {
      try {
        const json = await response.json();
        const results = json.jobs || json || [];
        results.forEach(job => {
          jobs.push({
            title: job.title || "Untitled",
            url: job.link || job.url || resUrl,
            source: "iCIMS",
            created_at: new Date().toISOString()
          });
        });
      } catch (e) {
        console.error("❌ Failed to parse iCIMS XHR response:", e.message);
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForTimeout(8000);
  } catch (err) {
    console.error("❌ Failed to load iCIMS page:", err.message);
    await browser.close();
    return;
  }

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found via iCIMS XHR.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} jobs from iCIMS.`);
  }

  await browser.close();
}

module.exports = { scrapeICIMS };
