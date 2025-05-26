const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeICIMS({ company, url, proxy }) {
  console.log(`🔍 [${company}] Scraping iCIMS with XHR interception from ${url}`);

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

  // 🧠 Intercept API/XHR calls to extract job data
  page.on('response', async (response) => {
    const resUrl = response.url();
    if (resUrl.includes('/jobs/search.json') || resUrl.includes('/jobs/')) {
      try {
        const json = await response.json();
        const results = json.jobs || json || [];
        results.forEach(job => {
          jobs.push({
            title: job.title || 'Untitled',
            url: job.link || job.url || resUrl,
            source: 'iCIMS',
            created_at: new Date().toISOString()
          });
        });
      } catch (e) {
        console.error(`❌ [${company}] Failed to parse iCIMS response: ${e.message}`);
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 8000)); // ⬅️ Fixed invalid method
  } catch (err) {
    console.error(`❌ [${company}] Failed to load iCIMS page: ${err.message}`);
    await browser.close();
    return;
  }

  if (jobs.length === 0) {
    console.warn(`⚠️ [${company}] No jobs found via iCIMS`);
  } else {
    await insertJobs(jobs);
    console.log(`✅ [${company}] Inserted ${jobs.length} iCIMS jobs`);
  }

  await browser.close();
}

module.exports = { scrapeICIMS };
