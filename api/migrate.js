// One-time migration: add missing columns to daily_stats table
const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        var results = [];

        // Add missing columns to daily_stats
        var cols = [
            ['total_players', 'INTEGER DEFAULT 0'],
            ['total_bets', 'NUMERIC DEFAULT 0'],
            ['total_winnings', 'NUMERIC DEFAULT 0'],
            ['top_game_slug', 'TEXT'],
            ['top_game_name', 'TEXT'],
            ['top_game_players', 'INTEGER DEFAULT 0'],
            ['top_game_winnings', 'NUMERIC DEFAULT 0'],
            ['stat_date', 'DATE']
        ];

        for (var i = 0; i < cols.length; i++) {
            try {
                await query('ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS ' + cols[i][0] + ' ' + cols[i][1]);
                results.push(cols[i][0] + ': OK');
            } catch (e) {
                results.push(cols[i][0] + ': SKIP (' + e.message.substring(0, 60) + ')');
            }
        }

        // Ensure daily_stats_games has correct columns
        var gameCols = [
            ['stat_id', 'INTEGER NOT NULL REFERENCES daily_stats(id) ON DELETE CASCADE'],
            ['game_slug', 'TEXT NOT NULL'],
            ['game_name', 'TEXT'],
            ['players', 'INTEGER DEFAULT 0'],
            ['winnings', 'NUMERIC DEFAULT 0'],
            ['sort_order', 'INTEGER DEFAULT 0']
        ];

        for (var j = 0; j < gameCols.length; j++) {
            try {
                await query('ALTER TABLE daily_stats_games ADD COLUMN IF NOT EXISTS ' + gameCols[j][0] + ' ' + gameCols[j][1]);
                results.push('games.' + gameCols[j][0] + ': OK');
            } catch (e) {
                results.push('games.' + gameCols[j][0] + ': SKIP');
            }
        }

        res.status(200).json({ success: true, results: results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
