function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(task, label = '', retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`▶️ ${label} attempt ${attempt}`);
      await task();
      console.log(`✅ ${label} succeeded`);
      break;
    } catch (err) {
      console.warn(`⚠️ ${label} failed on attempt ${attempt}: ${err.message}`);
      if (attempt === retries) {
        console.error(`❌ ${label} failed after ${retries} attempts`);
      } else {
        await wait(3000 * attempt); // wait longer on each retry
      }
    }
  }
}

module.exports = { withRetry };
