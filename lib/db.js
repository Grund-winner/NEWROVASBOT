const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
    // Disable prepared statements to avoid type caching issues
    pool.on('connect', (client) => {
      client.query('SET prepared_statement_cache_size = 0').catch(() => {});
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  const result = await p.query(text, params);
  return result;
}

module.exports = { query, getPool };
