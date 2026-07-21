require('dotenv').config();
const { createClient } = require('@libsql/client');

(async () => {
  const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db';
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  try {
    const res = await client.execute({ sql: `PRAGMA table_info('content_calendar');` });
    console.log('PRAGMA content_calendar', JSON.stringify(res, null, 2));
    const sqlRes = await client.execute({ sql: `SELECT sql FROM sqlite_master WHERE type='table' AND name='content_calendar';` });
    console.log('TABLE SQL', JSON.stringify(sqlRes, null, 2));
  } catch (err) {
    console.error('ERR', err);
    process.exitCode = 1;
  }
})();
