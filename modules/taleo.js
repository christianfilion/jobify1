const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeTaleo({ company, url, proxy }) {
  console.log(`🌐 [${company}] Scraping Taleo at ${url}`);

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
    await new Promise(resolve => setTimeout(resolve, 5000)); // ✅ Fixed delay

    const jobs = await page.$$eval('li.job-title', elements =>
      elements.map(el => ({
        title: el.innerText?.trim() || 'Untitled',
        url: window.location.href,
        source: 'Taleo',
        created_at: new Date().toISOString()
      }))
    );

    if (jobs.length > 0) {
      await insertJobs(jobs);
      console.log(`✅ [${company}] Inserted ${jobs.length} Taleo jobs`);
    } else {
      console.warn(`⚠️ [${company}] No jobs found on Taleo`);
    }
  } catch (err) {
    console.error(`❌ [${company}] Taleo error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeTaleo };
