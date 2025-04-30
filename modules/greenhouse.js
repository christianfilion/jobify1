const { chromium } = require('playwright');
const { insertJobs } = require('../supabase');

async function scrapeGreenhouse() {
  console.log("🔍 Scraping Greenhouse...");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = 'https://boards.greenhouse.io/shopify'; // Example company using Greenhouse
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const jobs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('section#jobs li')).map(el => {
      const titleEl = el.querySelector('a');
      return {
        title: titleEl?.innerText.trim() || "Untitled",
        url: titleEl?.href || window.location.href
      };
    });
  });

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found on Greenhouse page.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} jobs from Greenhouse.`);
  }

  await browser.close();
}
module.exports = { scrapeGreenhouse };
