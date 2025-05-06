const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeSmartRecruiters({ company, url, proxy }) {
  console.log(`📡 [${company}] Scraping SmartRecruiters at ${url} with XHR capture...`);

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

  let jobs = [];

  // Capture and extract SmartRecruiters JSON job data
  page.on('response', async (response) => {
    const resUrl = response.url();
    if (resUrl.includes('/jobs') && resUrl.endsWith('.json')) {
      try {
        const data = await response.json();
        const results = data.content || data || [];
        results.forEach(job => {
          jobs.push({
            title: job.name || job.title || 'Untitled',
            url: job.ref || job.applyUrl || resUrl,
            source: 'SmartRecruiters',
            created_at: new Date().toISOString()
          });
        });
      } catch (err) {
        console.error(`❌ [${company}] Failed to parse SmartRecruiters JSON: ${err.message}`);
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForTimeout(8000);
  } catch (err) {
    console.error(`❌ [${company}] Failed to load SmartRecruiters page: ${err.message}`);
    await browser.close();
    return;
  }

  if (jobs.length === 0) {
    console.warn(`⚠️ [${company}] No jobs found on SmartRecruiters`);
  } else {
    await insertJobs(jobs);
    console.log(`✅ [${company}] Inserted ${jobs.length} SmartRecruiters jobs`);
  }

  await browser.close();
}

module.exports = { scrapeSmartRecruiters };
