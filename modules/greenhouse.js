const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeGreenhouse() {
  console.log("🔍 Scraping Greenhouse...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36');

  const url = 'https://boards.greenhouse.io/shopify';
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const jobs = await page.$$eval('section#jobs li', elements =>
    elements.map(el => {
      const titleEl = el.querySelector('a');
      return {
        title: titleEl?.innerText.trim() || "Untitled",
        url: titleEl?.href || window.location.href,
        source: "Greenhouse",
        created_at: new Date().toISOString()
      };
    })
  );

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found on Greenhouse page.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} jobs from Greenhouse.`);
  }

  await browser.close();
}

module.exports = { scrapeGreenhouse };
