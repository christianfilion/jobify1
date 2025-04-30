const { chromium } = require('playwright-extra');
const stealth = require('playwright-extra-plugin-stealth')();
const { insertJobs } = require('../supabase');
chromium.use(stealth);

async function scrapeTaleo() {
  console.log("🕵️‍♂️ Launching Taleo scraper with iframe and CAPTCHA support...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://sjobs.brassring.com/TGnewUI/Search/Home/Home?partnerid=25477&siteid=5756'; // Example Taleo URL
  await page.goto(url, { waitUntil: 'networkidle' });

  const allFrames = page.frames();
  const targetFrame = allFrames.find(f => f.name() && f.url().includes("brassring"));

  if (!targetFrame) {
    console.log("❌ Could not find Taleo iframe.");
    await browser.close();
    return;
  }

  const isCaptcha = await targetFrame.evaluate(() => {
    return !!document.querySelector('iframe[src*="recaptcha"]');
  });

  if (isCaptcha) {
    console.log("🔒 CAPTCHA detected on Taleo. Aborting.");
    await browser.close();
    return;
  }

  const jobs = await targetFrame.evaluate(() => {
    const jobCards = document.querySelectorAll('.jobTitle span, .job');
    return Array.from(jobCards).map(el => ({
      title: el.innerText?.trim() || "Untitled",
      url: window.location.href
    }));
  });

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found inside Taleo iframe.");
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} Taleo jobs.`);
  }

  await browser.close();
}
module.exports = { scrapeTaleo };
