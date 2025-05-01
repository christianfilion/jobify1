const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { insertJobs } = require('../supabase');

puppeteer.use(StealthPlugin());

async function scrapeBrassring() {
  console.log("🕵️‍♂️ Scraping Brassring with Puppeteer and deep iframe traversal...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36');

  const url = 'https://sjobs.brassring.com/TGnewUI/Search/Home/Home?partnerid=26039&siteid=5016';
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const getBrassringFrame = (frames) => {
    for (const frame of frames) {
      if (frame.url().includes('brassring.com')) return frame;
      const child = getBrassringFrame(frame.childFrames());
      if (child) return child;
    }
    return null;
  };

  const brassringFrame = getBrassringFrame(page.mainFrame().childFrames());

  if (!brassringFrame) {
    console.log("❌ Could not find Brassring iframe.");
    await browser.close();
    return;
  }

  const jobs = await brassringFrame.evaluate(() => {
    const jobEls = document.querySelectorAll('.jobTitle span, .job-listing-title, .job');
    return Array.from(jobEls).map(el => ({
      title: el.innerText?.trim() || "Untitled",
      url: window.location.href,
      source: "Brassring",
      created_at: new Date().toISOString()
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
