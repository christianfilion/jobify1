const { insertJobs } = require('../supabase');

async function scrapeLever() {
  console.log("🔍 Scraping Lever...");
  const jobs = [
    { title: "Product Manager", url: "https://jobs.lever.co/abc" },
    { title: "Growth Hacker", url: "https://jobs.lever.co/xyz" }
  ];
  await insertJobs(jobs);
  console.log("✅ Lever jobs inserted.");
}
module.exports = { scrapeLever };
