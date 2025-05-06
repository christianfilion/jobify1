const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeLever({ company, url, proxy }) {
  console.log(`🔍 [${company}] Scraping Lever at ${url}...`);

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
    await page.waitForSelector('div.posting', { timeout: 10000 });

    const jobs = await page.$$eval('div.posting', postings =>
      postings.map(post => {
        const title = post.querySelector('.posting-title > h5')?.innerText.trim() || "Untitled";
        const link = post.querySelector('a')?.href || window.location.href;
        return {
          title,
          url: link,
          source: "Lever",
          created_at: new Date().toISOString()
        };
      })
    );

    if (jobs.length > 0) {
      await insertJobs(jobs);
      console.log(`✅ [${company}] Inserted ${jobs.length} Lever jobs`);
    } else {
      console.warn(`⚠️ [${company}] No jobs found on Lever`);
    }
  } catch (err) {
    console.error(`❌ [${company}] Lever error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeLever };
