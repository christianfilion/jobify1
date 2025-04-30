const axios = require('axios');
const { logToSupabase } = require('./supabase');

async function withRetry(task, label, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await task();
    } catch (err) {
      console.warn(`⚠️ ${label} failed (attempt ${i + 1}): ${err.message}`);
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  await logToSupabase('Error', `${label} failed after ${retries} attempts`);
  return null;
}

async function sendWebhookNotification(payload) {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await axios.post(webhookUrl, payload);
    console.log("🔔 Webhook sent successfully.");
  } catch (err) {
    console.error("❌ Failed to send webhook:", err.message);
  }
}

module.exports = { withRetry, sendWebhookNotification };
