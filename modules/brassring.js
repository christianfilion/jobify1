
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeBrassring(company) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto(company.url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(5000);

    const allFrames = page.frames();
    const brassringFrame = allFrames.find(f => f.url().includes('brassring.com'));
    if (!brassringFrame) throw new Error("Brassring iframe not found");

    const jobs = await brassringFrame.evaluate(() => {
      const jobEls = document.querySelectorAll('.jobTitle span, .job');
      return Array.from(jobEls).map(el => ({
        title: el.innerText?.trim() || "Untitled",
        url: window.location.href,
        source: "Brassring",
        created_at: new Date().toISOString()
      }));
    });

    if (jobs.length > 0) await insertJobs(jobs);
    else console.warn("⚠️ No jobs found in Brassring.");
  } catch (err) {
    console.error(`❌ Brassring error:`, err.message);
  }

  await browser.close();
}
module.exports = { scrapeBrassring };
