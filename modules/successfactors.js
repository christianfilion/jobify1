const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeSuccessFactors({ company, url, proxy }) {
  console.log(`🧠 [${company}] Scraping SuccessFactors at ${url} (Shadow DOM detection enabled)...`);

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

    const captchaFrame = await page.$('iframe[src*="recaptcha"]');
    if (captchaFrame) {
      console.log(`🔒 [${company}] CAPTCHA detected. Skipping.`);
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
          title: el.innerText?.trim() || 'Untitled',
          url: el.href || window.location.href,
          source: 'SuccessFactors',
          created_at: new Date().toISOString()
        }));
      }

      console.log(document.body.innerHTML);
      return [];
    });

    if (jobs.length > 0) {
      await insertJobs(jobs);
      console.log(`✅ [${company}] Inserted ${jobs.length} SuccessFactors jobs`);
    } else {
      console.warn(`⚠️ [${company}] No jobs found in SuccessFactors shadow DOM`);
    }
  } catch (err) {
    console.error(`❌ [${company}] SuccessFactors error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeSuccessFactors };
