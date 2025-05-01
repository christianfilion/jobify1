const { chromium } = require('playwright');
const { insertJobs } = require('../supabase');
require('dotenv').config();

const companies = [
  { name: "RBC", url: "https://recruiting.adp.com/srccar/public/RTI.home?c=1534801&d=ExternalCareerSite" },
  { name: "Capital One", url: "https://capitalone.wd1.myworkdayjobs.com/Capital_One" },
  { name: "Deloitte", url: "https://deloitte.wd1.myworkdayjobs.com/DeloitteCareers" },
  { name: "Amazon", url: "https://amazon.jobs/en/teams/workday" },
  { name: "TD", url: "https://recruiting.adp.com/srccar/public/RTI.home?c=1234567&d=ExternalCareerSite" } // placeholder
];

async function scrapeWorkdayCompany(company, browser) {
  console.log(`🌐 Scraping ${company.name}: ${company.url}`);

  const context = await browser.newContext({
    ...(process.env.PROXY_URL ? { proxy: { server: process.env.PROXY_URL } } : {})
  });
  const page = await context.newPage();

  try {
    await page.goto(company.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);

    const allFrames = page.frames();
    const workdayFrame = allFrames.find(f => f.url().includes("workday") || f.url().includes("adp.com"));
    const target = workdayFrame || page;

    if (!target) throw new Error("No scraping context found");

    const jobs = await target.evaluate(() => {
      const selectors = ['div.job-title', '.jobPosting', 'li.job', '.posting-title'];
      const elements = selectors.flatMap(sel => Array.from(document.querySelectorAll(sel)));
      const deduped = [...new Set(elements)];
      return deduped.map(el => ({
        title: el.innerText?.trim() || "Untitled",
        url: window.location.href
      }));
    });

    if (jobs.length > 0) {
      await insertJobs(jobs);
      console.log(`✅ ${jobs.length} jobs added from ${company.name}`);
    } else {
      console.log(`⚠️ No jobs found for ${company.name}`);
    }
  } catch (err) {
    console.error(`❌ Error scraping ${company.name}:`, err.message);
  }

  await page.close();
}

async function scrapeWorkday() {
  console.log("🚀 Starting Workday multi-company scrape...");
  const browser = await chromium.launch({ headless: true });

  for (const company of companies) {
    await scrapeWorkdayCompany(company, browser);
    const delay = Math.floor(Math.random() * 5000 + 3000); // 3-8s delay
    console.log(`⏳ Waiting ${delay}ms before next company...`);
    await new Promise(res => setTimeout(res, delay));
  }

  await browser.close();
  console.log("✅ Completed all Workday scrapes.");
}

module.exports = { scrapeWorkday };

