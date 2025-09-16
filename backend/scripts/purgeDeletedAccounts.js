// scripts/purgeDeletedAccounts.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const purge = async () => {
  try {
    console.log('Starting purge job...');
    // Customize: you may want to anonymize instead of hard delete
    const res = await pool.query(`
      DELETE FROM users
      WHERE delete_requested_at IS NOT NULL
        AND delete_requested_at <= NOW() - INTERVAL '30 days'
      RETURNING id;
    `);
    console.log('Purged users:', res.rowCount);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Purge error', err);
    process.exit(1);
  }
};

purge();
