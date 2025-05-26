const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeRecruitee({ company, url, proxy }) {
  console.log(`🔍 [${company}] Scraping Recruitee at ${url}`);

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  if (proxy) {
    launchOptions.args.push(`--proxy-server=${proxy}`);
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36'
  );

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Optional wait for dynamic content
    // await new Promise(resolve => setTimeout(resolve, 3000));

    await page.waitForSelector('a[href*="/o/"]', { timeout: 10000 });

    const jobs = await page.$$eval('a[href*="/o/"]', links =>
      links.map(el => ({
        title: (el.innerText ? el.innerText.trim() : '') || 'Untitled',
        url: el.href,
        source: 'Recruitee',
        created_at: new Date().toISOString()
      }))
    );

    if (jobs.length > 0) {
      await insertJobs(jobs);
      console.log(`✅ [${company}] Inserted ${jobs.length} Recruitee jobs`);
    } else {
      console.warn(`⚠️ [${company}] No jobs found on Recruitee`);
    }
  } catch (err) {
    console.error(`❌ [${company}] Recruitee error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeRecruitee };
