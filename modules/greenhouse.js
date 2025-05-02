
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeGreenhouse(company = { name: "Shopify", url: "https://boards.greenhouse.io/shopify" }) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    console.log(`🔍 Scraping Greenhouse: ${company.name}`);
    await page.goto(company.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('section#jobs li a', { timeout: 15000 });

    const jobs = await page.$$eval('section#jobs li a', links =>
      links.map(link => ({
        title: link.innerText?.trim() || "Untitled",
        url: link.href,
        source: "Greenhouse",
        created_at: new Date().toISOString()
      }))
    );

    if (jobs.length > 0) await insertJobs(jobs);
    else console.warn("⚠️ No jobs found in Greenhouse.");
  } catch (err) {
    console.error(`❌ Greenhouse error:`, err.message);
  }

  await browser.close();
}
module.exports = { scrapeGreenhouse };
