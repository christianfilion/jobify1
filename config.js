const { program } = require('commander');
const fs = require('fs');
require('dotenv').config();

program
  .option('-c, --company <name>', 'Filter by company name')
  .option('-d, --delay <ms>', 'Delay between scrapes in ms')
  .option('-p, --proxy <index>', 'Use proxy from config list');

program.parse(process.argv);
const options = program.opts();

// Load custom config if present
let config = {};
if (fs.existsSync('./config.json')) {
  config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
}

// Set effective values with priority: CLI > config.json > .env
const runtime = {
  company: options.company || config.company || 'RBC',
  delay: parseInt(options.delay || config.delay || '5000'),
  proxy: options.proxy ? config.proxies?.[options.proxy] : config.proxy || process.env.PROXY_URL
};

module.exports = { runtime };
