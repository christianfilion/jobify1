const { chromium } = require('playwright-extra');
const stealth = require('playwright-extra-plugin-stealth')();
const { insertJobs } = require('../supabase');

chromium.use(stealth);

async function scrapeSuccessFactors() {
  console.log("🧠 Scraping SuccessFactors with shadow DOM...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://career2.successfactors.eu/career?company=example'; // Replace with real target
  await page.goto(url, { waitUntil: 'networkidle' });

  // CAPTCHA fallback
  const isCaptcha = await page.$('iframe[src*="recaptcha"]');
  if (isCaptcha) {
    console.log("🔒 CAPTCHA detected. Aborting.");
    await page.screenshot({ path: 'successfactors_captcha.png' });
    await browser.close();
    return;
  }

  const shadowHandle = await page.evaluateHandle(() => {
    const host = document.querySelector('custom-element, sf-search-results, job-search, job-opportunity-list');
    return host?.shadowRoot || null;
  });

  const jobs = await shadowHandle.evaluate(shadowRoot => {
    if (!shadowRoot) return [];
    const listings = shadowRoot.querySelectorAll('a.jobTitle, div.job-card');
    return Array.from(listings).map(el => ({
      title: el.innerText?.trim() || "Untitled",
      url: el.href || window.location.href
    }));
  });

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found in shadow DOM.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} jobs from SuccessFactors.`);
  }

  await browser.close();
}
module.exports = { scrapeSuccessFactors };
