const { chromium } = require('playwright');
const { insertJobs } = require('../supabase');

async function scrapeRecruitee() {
  console.log("🔍 Scraping Recruitee...");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = 'https://yourcompany.recruitee.com'; // Replace with actual Recruitee page
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const jobs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/o/"]')).map(el => ({
      title: el.innerText?.trim() || "Untitled",
      url: el.href
    }));
  });

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found on Recruitee.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} Recruitee jobs.`);
  }

  await browser.close();
}
module.exports = { scrapeRecruitee };
