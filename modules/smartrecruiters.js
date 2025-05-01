const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeSmartRecruiters() {
  console.log("📡 Scraping SmartRecruiters with Puppeteer and XHR response capture...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36');

  const url = 'https://jobs.smartrecruiters.com/Verkada'; // Actual SmartRecruiters company page
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
            url: job.ref || job.applyUrl || resUrl,
            source: "SmartRecruiters - Verkada",
            created_at: new Date().toISOString()
          });
        });
      } catch (err) {
        console.error("❌ Failed to parse SmartRecruiters response:", err.message);
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForTimeout(8000);
  } catch (err) {
    console.error("❌ Error loading SmartRecruiters page:", err.message);
    await browser.close();
    return;
  }

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found via SmartRecruiters.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} SmartRecruiters jobs.`);
  }

  await browser.close();
}

module.exports = { scrapeSmartRecruiters };
