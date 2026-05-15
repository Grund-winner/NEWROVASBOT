// Migration: check daily_stats schema and fix if needed
const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    var results = [];

    try {
        // 1. Check current state
        try {
            var tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'daily_stats%'");
            results.push('Tables found: ' + tables.map(t => t.table_name).join(', ') || 'NONE');
        } catch(e) { results.push('Table check error: ' + e.message); }

        // 2. Check daily_stats columns
        try {
            var cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name='daily_stats' ORDER BY ordinal_position");
            var colNames = cols.map(c => c.column_name);
            results.push('daily_stats columns: ' + (colNames.join(', ') || 'NONE'));
        } catch(e) { results.push('Column check error: ' + e.message); }

        // 3. Try DROP + CREATE (most reliable fix)
        try {
            await query('DROP TABLE IF EXISTS daily_stats_games CASCADE');
            results.push('Dropped daily_stats_games');
        } catch(e) { results.push('Drop games error: ' + e.message); }

        try {
            await query('DROP TABLE IF EXISTS daily_stats CASCADE');
            results.push('Dropped daily_stats');
        } catch(e) { results.push('Drop stats error: ' + e.message); }

        try {
            await query(`CREATE TABLE daily_stats (
                id SERIAL PRIMARY KEY,
                stat_date DATE NOT NULL UNIQUE,
                total_players INTEGER DEFAULT 0,
                total_bets NUMERIC DEFAULT 0,
                total_winnings NUMERIC DEFAULT 0,
                top_game_slug TEXT,
                top_game_name TEXT,
                top_game_players INTEGER DEFAULT 0,
                top_game_winnings NUMERIC DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )`);
            results.push('Created daily_stats');
        } catch(e) { results.push('Create stats error: ' + e.message); }

        try {
            await query(`CREATE TABLE daily_stats_games (
                id SERIAL PRIMARY KEY,
                stat_id INTEGER NOT NULL REFERENCES daily_stats(id) ON DELETE CASCADE,
                game_slug TEXT NOT NULL,
                game_name TEXT,
                players INTEGER DEFAULT 0,
                winnings NUMERIC DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                UNIQUE(stat_id, game_slug)
            )`);
            results.push('Created daily_stats_games');
        } catch(e) { results.push('Create games error: ' + e.message); }

        // 4. Verify
        try {
            var verify = await query("SELECT column_name FROM information_schema.columns WHERE table_name='daily_stats' ORDER BY ordinal_position");
            results.push('Verified columns: ' + verify.map(c => c.column_name).join(', '));
        } catch(e) {}

        res.status(200).json({ success: true, results: results });
    } catch (e) {
        res.status(500).json({ error: e.message, results: results });
    }
};
