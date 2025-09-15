// scripts/cleanupMessages.js
// WARNING (BIG IMPORTANT COMMENT)
// ----------------------------------------------
// This script will DELETE old messages from the `messages` table.
// By default it deletes messages older than 7 days. You can change the interval below.
// If you want messages to persist longer, change the INTERVAL_IN_DAYS variable or comment out the cron schedule.
// Make sure you have a database backup strategy before enabling deletion in production.
//
// To use:
// 1) Install node-cron: npm install node-cron
// 2) Require this module from server.js (or run it as a separate process):
//    const startCleanup = require('./scripts/cleanupMessages');
//    startCleanup();
// 3) Or run `node scripts/cleanupMessages.js` in a scheduler/cron job on the server.
//
// To increase retention, change INTERVAL_IN_DAYS to the number of days to keep.
// To disable deletion, comment out the cron.schedule(...) line.
//
// ----------------------------------------------

const cron = require('node-cron');
const pool = require('../config/db'); // your pg pool

// Number of days to keep messages. Change this value to increase retention.
const INTERVAL_IN_DAYS = 7; // <-- change this to 30 to keep for 30 days, etc.

async function wipeOldMessages() {
  try {
    const q = `DELETE FROM messages WHERE created_at < NOW() - INTERVAL '${INTERVAL_IN_DAYS} days' RETURNING id;`;
    const r = await pool.query(q);
    console.log(`[cleanupMessages] Deleted ${r.rowCount} messages older than ${INTERVAL_IN_DAYS} days`);
  } catch (err) {
    console.error('cleanupMessages error', err);
  }
}

function startCleanup() {
  // schedule to run once a week: "0 3 * * 0" => at 03:00 every Sunday (server timezone)
  // You can change the cron expression as desired.
  cron.schedule('0 3 * * 0', () => {
    console.log('[cleanupMessages] Running scheduled cleanup...');
    wipeOldMessages();
  });

  // Optionally do an initial run at startup (comment out if you don't want this)
  // wipeOldMessages();

  console.log('[cleanupMessages] Scheduler started. Old messages older than', INTERVAL_IN_DAYS, 'days will be removed weekly.');
}

module.exports = startCleanup;
