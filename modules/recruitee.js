const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');
require('dotenv').config();

puppeteer.use(StealthPlugin());

const companies = [
  { name: "Bunq", url: "https://bunq.recruitee.com" },
  { name: "CM.com", url: "https://cm.recruitee.com" },
  { name: "Triple", url: "https://wearetriple.recruitee.com" }
  // Add more Recruitee-powered companies here
];

async function scrapeRecruiteeCompany(company, browser) {
  console.log(`🌐 Scraping Recruitee: ${company.name} (${company.url})`);

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36');

  try {
    await page.goto(company.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('a[href*="/o/"]', { timeout: 10000 });

    const jobs = await page.$$eval('a[href*="/o/"]', links =>
      links.map(el => ({
        title: el.innerText?.trim() || "Untitled",
        url: el.href,
        source: `Recruitee - ${company.name}`,
        created_at: new Date().toISOString()
      }))
    );

    if (jobs.length > 0) {
      await insertJobs(jobs);
      console.log(`✅ ${jobs.length} jobs inserted from ${company.name}`);
    } else {
      console.log(`⚠️ No jobs found on ${company.name}`);
    }

  } catch (err) {
    console.error(`❌ Error scraping ${company.name}:`, err.message);
  }

  await page.close();
}

async function scrapeRecruitee() {
  console.log("🚀 Starting multi-company Recruitee scrape...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const company of companies) {
    await scrapeRecruiteeCompany(company, browser);
    const delay = Math.floor(Math.random() * 3000 + 2000); // 2–5 sec delay
    console.log(`⏳ Waiting ${delay}ms before next company...`);
    await new Promise(res => setTimeout(res, delay));
  }

  await browser.close();
  console.log("✅ Completed all Recruitee scrapes.");
}

module.exports = { scrapeRecruitee };
