const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeSuccessFactors() {
  console.log("🧠 Scraping SuccessFactors with Puppeteer and Shadow DOM...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36');

  const url = 'https://career5.successfactors.eu/career?company=sap'; // ✅ Real SAP SuccessFactors URL
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const captchaFrame = await page.$('iframe[src*="recaptcha"]');
  if (captchaFrame) {
    console.log("🔒 CAPTCHA detected. Aborting scrape.");
    await page.screenshot({ path: 'successfactors_captcha.png' });
    await browser.close();
    return;
  }

  const jobs = await page.evaluate(() => {
    function queryShadowRoots(selector, root = document) {
      const elements = [];
      const traverse = (node) => {
        if (!node) return;
        if (node.shadowRoot) {
          try {
            const matches = node.shadowRoot.querySelectorAll(selector);
            if (matches.length) elements.push(...matches);
            Array.from(node.shadowRoot.children).forEach(traverse);
          } catch (_) {}
        } else if (node.children) {
          Array.from(node.children).forEach(traverse);
        }
      };
      traverse(root.body);
      return elements.map(el => ({
        title: el.innerText?.trim() || "Untitled",
        url: el.href || window.location.href,
        source: "SuccessFactors - SAP",
        created_at: new Date().toISOString()
      }));
    }

    return queryShadowRoots('a.jobTitle, div.job-card');
  });

  if (jobs.length > 0) {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} jobs from SuccessFactors.`);
  } else {
    console.log("⚠️ No jobs found in SuccessFactors shadow DOM.");
  }

  await browser.close();
}

module.exports = { scrapeSuccessFactors };
