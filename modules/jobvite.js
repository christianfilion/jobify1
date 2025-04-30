const { chromium } = require('playwright');
const { insertJobs } = require('../supabase');

async function scrapeJobvite() {
  console.log("🔍 Scraping Jobvite...");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = 'https://jobs.jobvite.com/company-name/jobs'; // Replace with actual Jobvite page
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const jobs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.jv-job-list-name a')).map(el => ({
      title: el.innerText?.trim() || "Untitled",
      url: el.href
    }));
  });

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found on Jobvite.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} Jobvite jobs.`);
  }

  await browser.close();
}
module.exports = { scrapeJobvite };
