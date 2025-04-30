const { chromium } = require('playwright-extra');
const stealth = require('playwright-extra-plugin-stealth')();
const { insertJobs } = require('../supabase');

chromium.use(stealth);

async function scrapeBrassring() {
  console.log("🕵️‍♂️ Scraping Brassring with deep iframe traversal...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://sjobs.brassring.com/TGnewUI/Search/Home/Home?partnerid=26039&siteid=5016'; // Sample Brassring link
  await page.goto(url, { waitUntil: 'networkidle' });

  const getBrassringFrame = (frames) => {
    for (const frame of frames) {
      if (frame.url().includes('brassring.com')) return frame;
      const child = getBrassringFrame(frame.childFrames());
      if (child) return child;
    }
    return null;
  };

  const brassringFrame = getBrassringFrame(page.frames());

  if (!brassringFrame) {
    console.log("❌ Could not find Brassring iframe.");
    await browser.close();
    return;
  }

  const jobs = await brassringFrame.evaluate(() => {
    const jobEls = document.querySelectorAll('.jobTitle span, .job-listing-title, .job');
    return Array.from(jobEls).map(el => ({
      title: el.innerText?.trim() || "Untitled",
      url: window.location.href
    }));
  });

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found in Brassring iframe.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} Brassring jobs.`);
  }

  await browser.close();
}
module.exports = { scrapeBrassring };
