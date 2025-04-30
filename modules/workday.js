const { chromium } = require('playwright-extra');
const stealth = require('playwright-extra-plugin-stealth')();
const { insertJobs } = require('../supabase');
const fs = require('fs');

chromium.use(stealth);

async function scrapeWorkday() {
  console.log("🕵️‍♂️ Launching stealth browser for RBC Workday...");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://recruiting.adp.com/srccar/public/RTI.home?c=1534801&d=ExternalCareerSite';
  await page.goto(url, { waitUntil: 'networkidle' });

  console.log("📸 Saving initial page screenshot...");
  await page.screenshot({ path: 'rbc_workday_home.png' });

  const allFrames = page.frames();
  const targetFrame = allFrames.find(f => f.url().includes("adp.com") && f.name() !== "");

  if (!targetFrame) {
    console.log("❌ No iframe found. Cannot continue.");
    await page.screenshot({ path: 'rbc_workday_iframe_missing.png' });
    await browser.close();
    return;
  }

  // CAPTCHA detection logic
  const isCaptcha = await targetFrame.evaluate(() => {
    return document.querySelector('iframe[src*="recaptcha"]') !== null;
  });

  if (isCaptcha) {
    console.log("🔒 CAPTCHA detected! Aborting scrape.");
    await page.screenshot({ path: 'rbc_workday_captcha_detected.png' });
    await browser.close();
    return;
  }

  let jobs = [];
  let pageCount = 0;

  while (true) {
    console.log(`📄 Scraping page ${pageCount + 1}...`);

    const newJobs = await targetFrame.evaluate(() => {
      const jobElements = document.querySelectorAll('div.job-title, .jobPosting, li.job-listing, .posting-title');
      return Array.from(jobElements).map(el => ({
        title: el.innerText?.trim() || el.textContent?.trim() || "Untitled",
        url: window.location.href
      }));
    });

    jobs.push(...newJobs);

    const nextButton = await targetFrame.$('button[aria-label="Next Page"], a[aria-label="Next"]');
    const isDisabled = nextButton ? await nextButton.getAttribute('disabled') : true;

    if (!nextButton || isDisabled) {
      console.log("⛔ No more pages or Next button is disabled.");
      break;
    }

    await nextButton.click();
    await targetFrame.waitForTimeout(5000);
    pageCount++;
  }

  if (jobs.length === 0) {
    console.log("⚠️ No jobs found across pages.");
    await page.screenshot({ path: 'rbc_workday_no_jobs.png' });
  } else {
    await insertJobs(jobs);
    console.log(`✅ Inserted ${jobs.length} jobs from RBC Workday.`);
  }

  await browser.close();
}
module.exports = { scrapeWorkday };
