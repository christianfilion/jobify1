const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeGreenhouse({ company, url, proxy }) {
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox']
  };

  if (proxy) {
    launchOptions.args.push(`--proxy-server=${proxy}`);
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  try {
    console.log(`🔍 [${company}] Scraping Greenhouse at ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Optional: manual wait if necessary
    // await new Promise(resolve => setTimeout(resolve, 3000));

    await page.waitForSelector('section#jobs li a, div.openings a', { timeout: 15000 });

    const jobs = await page.$$eval('section#jobs li a, div.openings a', links =>
      links.map(link => ({
        title: link.innerText?.trim() || "Untitled",
        url: link.href,
        source: "Greenhouse",
        created_at: new Date().toISOString()
      }))
    );

    if (jobs.length > 0) {
      await insertJobs(jobs);
      console.log(`✅ [${company}] Inserted ${jobs.length} Greenhouse jobs`);
    } else {
      console.warn(`⚠️ [${company}] No jobs found on Greenhouse`);
    }
  } catch (err) {
    console.error(`❌ [${company}] Greenhouse error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeGreenhouse };
