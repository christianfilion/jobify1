const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeLever() {
  console.log("🔍 Scraping Lever...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36');

  const url = 'https://jobs.lever.co/example-company'; // Replace with real Lever URL

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
      console.log(`✅ Inserted ${jobs.length} jobs from Lever.`);
    } else {
      console.log("⚠️ No jobs found on Lever.");
    }

  } catch (err) {
    console.error("❌ Error scraping Lever:", err.message);
  }

  await browser.close();
}

module.exports = { scrapeLever };
