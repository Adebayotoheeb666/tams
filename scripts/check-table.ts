import 'dotenv/config';
import { createClient } from '@libsql/client';

async function main() {
  const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db';
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  try {
    const res = await client.execute({ sql: `PRAGMA table_info('customer_testimonials');` });
    console.log('PRAGMA result:', JSON.stringify(res, null, 2));

    // If sentiment column missing, apply ALTER TABLE migration
    const hasSentiment = (res.rows || []).some((r: any) => r[1] === 'sentiment');
    if (!hasSentiment) {
      console.log('sentiment column missing — applying ALTER TABLE to add columns');
      try {
        await client.execute({ sql: `ALTER TABLE customer_testimonials ADD COLUMN sentiment TEXT;` });
        await client.execute({ sql: `ALTER TABLE customer_testimonials ADD COLUMN sentiment_score INTEGER DEFAULT 0;` });
        console.log('ALTER TABLE applied successfully');
      } catch (e) {
        console.error('Failed to apply ALTER TABLE:', e);
      }
      const res2 = await client.execute({ sql: `PRAGMA table_info('customer_testimonials');` });
      console.log('PRAGMA after alter:', JSON.stringify(res2, null, 2));
    } else {
      console.log('sentiment column already present');
    }

    const sqlRes = await client.execute({ sql: `SELECT sql FROM sqlite_master WHERE type='table' AND name='customer_testimonials';` });
    console.log('table sql:', JSON.stringify(sqlRes, null, 2));
    const tables = await client.execute({ sql: `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;` });
    console.log('tables:', JSON.stringify(tables, null, 2));

    // Attempt to read drizzle migrations table if present
    try {
      const mig = await client.execute({ sql: `SELECT * FROM __drizzle_migrations ORDER BY id DESC LIMIT 20;` });
      console.log('__drizzle_migrations:', JSON.stringify(mig, null, 2));
    } catch (e) {
      console.log('no __drizzle_migrations table or failed to read it');
    }
  } catch (err) {
    console.error('Error querying DB:', err);
    process.exitCode = 1;
  }
}

main();
