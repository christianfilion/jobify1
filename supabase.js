const { createClient } = require('@supabase/supabase-js');
const { sendEmailNotification } = require('./email');
const { sendWebhookNotification } = require('./utils');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function insertJobs(jobs) {
  for (const job of jobs) {
    const { error } = await supabase.from('jobs').insert([job]);
    if (error) console.error("❌ Failed to insert job:", error.message);
  }

  if (jobs.length > 0) {
    await sendWebhookNotification({
      text: `✅ ${jobs.length} new jobs scraped.`,
      jobs
    });
  }
}

async function logToSupabase(type, message) {
  await supabase.from('logs').insert([{ type, message, timestamp: new Date().toISOString() }]);

  if (type === "Error" || message.includes("Inserted")) {
    await sendEmailNotification(`Jobify Log - ${type}`, message);
    await sendWebhookNotification({ text: `⚠️ ${type}: ${message}` });
  }
}

module.exports = { insertJobs, logToSupabase };
