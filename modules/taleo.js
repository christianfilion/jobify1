const { chromium } = require('playwright');
const { insertJobs } = require('../supabase');

async function scrapeTaleo() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("🔍 Scraping Taleo job board...");
    await page.goto("https://your-taleo-url.example.com", { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    const jobs = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('li.job-title')).map(el => ({
        title: el.innerText.trim(),
        url: window.location.href,
        source: "Taleo",
        created_at: new Date().toISOString()
      }));
      return items;
    });

    await insertJobs(jobs);
    console.log(`✅ ${jobs.length} Taleo jobs inserted.`);
  } catch (err) {
    console.error("❌ Error scraping Taleo:", err.message);
  }

  await browser.close();
}

module.exports = { scrapeTaleo };
