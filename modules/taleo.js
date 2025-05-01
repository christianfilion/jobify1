const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');
require('dotenv').config();

puppeteer.use(StealthPlugin());

const companies = [
  { name: "TD Bank", url: "https://td.taleo.net/careersection/2/jobsearch.ftl" },
  { name: "CIBC", url: "https://cibc.taleo.net/careersection/1/jobsearch.ftl" },
  { name: "BMO", url: "https://bmo.taleo.net/careersection/2/jobsearch.ftl" },
  { name: "Sun Life", url: "https://sunlife.taleo.net/careersection/1/jobsearch.ftl" }
];

async function scrapeTaleoCompany(company, browser) {
  console.log(`🌐 Scraping Taleo: ${company.name} (${company.url})`);

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0');

  try {
    await page.goto(company.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    const jobs = await page.$$eval('li.job-title', elements =>
      elements.map(el => ({
        title: el.innerText?.trim() || "Untitled",
        url: window.location.href,
        source: `Taleo - ${company.name}`,
        created_at: new Date().toISOString()
      }))
    );

    if (jobs.length > 0) {
      await insertJobs(jobs);
      console.log(`✅ Inserted ${jobs.length} jobs from ${company.name}`);
    } else {
      console.log(`⚠️ No jobs found on ${company.name}`);
    }

  } catch (err) {
    console.error(`❌ Error scraping ${company.name}:`, err.message);
  }

  await page.close();
}

async function scrapeTaleo() {
  console.log("🚀 Starting multi-company Taleo scrape...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const company of companies) {
    await scrapeTaleoCompany(company, browser);
    const delay = Math.floor(Math.random() * 3000 + 2000);
    console.log(`⏳ Waiting ${delay}ms before next company...`);
    await new Promise(res => setTimeout(res, delay));
  }

  await browser.close();
  console.log("✅ Completed all Taleo scrapes.");
}

module.exports = { scrapeTaleo };
