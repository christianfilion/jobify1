const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeWorkday({ company, url, proxy }) {
  console.log(`🌐 [${company}] Scraping Workday at ${url}`);

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
    await page.waitForTimeout(5000);

    // Handle embedded iframe or ADP/Workday frame
    const allFrames = page.mainFrame().childFrames();
    const workdayFrame = allFrames.find(f => f.url().includes('workday') || f.url().includes('adp.com'));
    const target = workdayFrame || page;

    // CAPTCHA detection
    const isCaptcha = await target.evaluate(() => {
      return !!document.querySelector('iframe[src*="recaptcha"]');
    });

    if (isCaptcha) {
      console.log(`🔒 [${company}] CAPTCHA detected — skipping.`);
      await page.screenshot({ path: `screenshots/${company}_captcha.png` });
      await browser.close();
      return;
    }

    const jobs = await target.evaluate(() => {
      const selectors = ['div.job-title', '.jobPosting', 'li.job', '.posting-title'];
      const elements = selectors.flatMap(sel => Array.from(document.querySelectorAll(sel)));
      const deduped = [...new Set(elements)];
      return deduped.map(el => ({
        title: el.innerText?.trim() || 'Untitled',
        url: window.location.href,
        source: 'Workday',
        created_at: new Date().toISOString()
      }));
    });

    if (jobs.length > 0) {
      await insertJobs(jobs);
      console.log(`✅ [${company}] Inserted ${jobs.length} Workday jobs`);
    } else {
      console.warn(`⚠️ [${company}] No jobs found on Workday`);
      await page.screenshot({ path: `screenshots/${company}_no_jobs.png` });
    }
  } catch (err) {
    console.error(`❌ [${company}] Workday scrape error: ${err.message}`);
    await page.screenshot({ path: `screenshots/${company}_error.png` });
  }

  await browser.close();
}

module.exports = { scrapeWorkday };
