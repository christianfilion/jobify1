const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeRecruitee({ company, url, proxy }) {
  console.log(`🔍 [${company}] Scraping Recruitee at ${url}`);

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

    // Optional delay if the page needs more time to render fully
    // await new Promise(resolve => setTimeout(resolve, 3000));

    await page.waitForSelector('a[href*="/o/"]', { timeout: 10000 });

    const jobs = await page.$$eval('a[href*="/o/"]', links =>
      links.map(el => ({
        title: el.innerText?.trim() || 'Untitl
