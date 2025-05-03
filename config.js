const { program } = require('commander');
const fs = require('fs');
require('dotenv').config();

program
  .option('-c, --company <name>', 'Filter by company name (e.g., RBC)')
  .option('-d, --delay <ms>', 'Delay between scrapes in ms (default: 5000)')
  .option('-p, --proxy <index>', 'Use proxy from config list by index');

program.parse(process.argv);
const options = program.opts();

// Load optional config.json
let config = {};
if (fs.existsSync('./config.json')) {
  try {
    config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
  } catch (e) {
    console.error("❌ Failed to parse config.json:", e.message);
  }
}

// Final runtime config (priority: CLI > config.json > .env)
const runtime = {
  company: options.company || config.company || null,
  delay: parseInt(options.delay || config.delay || process.env.SCRAPE_DELAY || '5000', 10),
  proxy:
    typeof options.proxy !== 'undefined'
      ? config.proxies?.[options.proxy]
      : config.proxy || process.env.PROXY_URL || null
};

module.exports = { runtime };
