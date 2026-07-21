require('dotenv').config();
const { createClient } = require('@libsql/client');

(async () => {
  const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db';
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  try {
    const res = await client.execute({ sql: `SELECT id, email, name FROM users WHERE id = ?`, args: ['88875459-8324-4e88-aa0e-5ed27963e32c'] });
    console.log('USER QUERY', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('ERR', err);
    process.exitCode = 1;
  }
})();
