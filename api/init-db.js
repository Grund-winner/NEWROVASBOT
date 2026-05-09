const { query } = require('../lib/db');

module.exports = async (req, res) => {
  try {
    const minDep = parseFloat(process.env.MIN_DEPOSIT) || 5;

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE,
        username TEXT DEFAULT '',
        first_name TEXT DEFAULT '',
        last_name TEXT DEFAULT '',
        one_win_user_id TEXT DEFAULT '',
        language TEXT DEFAULT 'fr',
        is_registered BOOLEAN DEFAULT FALSE,
        is_deposited BOOLEAN DEFAULT FALSE,
        deposit_amount NUMERIC DEFAULT 0,
        registered_at TIMESTAMPTZ,
        deposited_at TIMESTAMPTZ,
        last_message_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS deposits (
        id SERIAL PRIMARY KEY,
        one_win_user_id TEXT NOT NULL,
        telegram_id BIGINT,
        amount NUMERIC NOT NULL,
        transaction_id TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS access_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        telegram_id BIGINT,
        is_used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS bot_sessions (
        bot_type TEXT NOT NULL DEFAULT 'ROVAS',
        admin_id BIGINT NOT NULL,
        action TEXT DEFAULT '',
        step INTEGER DEFAULT 0,
        temp_data TEXT DEFAULT '',
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (bot_type, admin_id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        prediction TEXT DEFAULT '',
        description TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        game_url TEXT DEFAULT '',
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Verify tables
    const tables = await query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    res.json({
      status: 'ok',
      tables: tables.rows.map(t => t.table_name),
      min_deposit: minDep
    });
  } catch (error) {
    console.error('Init DB error:', error);
    res.status(500).json({ error: error.message });
  }
};
