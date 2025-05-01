const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeJobvite() {
  console.log("🔍 Scraping Jobvite...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36');

  const url = 'https://jobs.jobvite.com/company-name/jobs'; // Replace with the actual Jobvite URL

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.jv-job-list-name a', { timeout: 10000 });
  } catch (err) {
    console.error("❌ Failed to load Jobvite page or find job elements:", err.message);
    await browser.close();
    return;
  }

  const jobs = await page.$$eval('.jv-job-list-name a', links =>
    links.map(el => ({
      title: el.innerText?.trim() || "Untitled",
      url: el.href,
      source: "Jobvite",
      created_at: new Date().toISOString()
    }))
  );

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found on Jobvite.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} Jobvite jobs.`);
  }

  await browser.close();
}

module.exports = { scrapeJobvite };
