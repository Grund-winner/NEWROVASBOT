// Migration + Stats Tables Init
const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    var action = req.query.action;

    // ═══════════════════════════════════════════
    // INIT STATS TABLES
    // ═══════════════════════════════════════════
    if (action === 'init_stats') {
        var results = [];
        try {
            try { await query('DROP TABLE IF EXISTS daily_stats_games CASCADE'); } catch(e) {}
            try { await query('DROP TABLE IF EXISTS daily_stats CASCADE'); } catch(e) {}
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
            return res.status(200).json({ success: true, results: results });
        } catch(e) {
            return res.status(500).json({ success: false, error: e.message, results: results });
        }
    }

    // ═══════════════════════════════════════════
    // GENERATE STATS (admin only)
    // ═══════════════════════════════════════════
    if (action === 'generate_stats') {
        var pw = req.query.password;
        var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rovasadmin2024';
        if (pw !== ADMIN_PASSWORD) return res.status(403).json({ error: 'Non autorise' });

        try {
            var yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            var dateStr = yesterday.toISOString().slice(0, 10);

            // Ensure tables exist
            try { await query(`CREATE TABLE IF NOT EXISTS daily_stats (
                id SERIAL PRIMARY KEY, stat_date DATE NOT NULL UNIQUE,
                total_players INTEGER DEFAULT 0, total_bets NUMERIC DEFAULT 0,
                total_winnings NUMERIC DEFAULT 0, top_game_slug TEXT, top_game_name TEXT,
                top_game_players INTEGER DEFAULT 0, top_game_winnings NUMERIC DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )`); } catch(e) {}

            // Check if daily_stats_games exists with correct schema
            var needRecreate = false;
            try {
                var cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'daily_stats_games' AND column_name = 'stat_id'");
                if (cols.length === 0) needRecreate = true;
            } catch(e) { needRecreate = true; }
            if (needRecreate) {
                try { await query('DROP TABLE IF EXISTS daily_stats_games CASCADE'); } catch(e) {}
                await query(`CREATE TABLE daily_stats_games (
                    id SERIAL PRIMARY KEY, stat_id INTEGER NOT NULL REFERENCES daily_stats(id) ON DELETE CASCADE,
                    game_slug TEXT NOT NULL, game_name TEXT, players INTEGER DEFAULT 0,
                    winnings NUMERIC DEFAULT 0, sort_order INTEGER DEFAULT 0, UNIQUE(stat_id, game_slug)
                )`);
            }

            // Delete existing for this date
            var existing = await query('SELECT id FROM daily_stats WHERE stat_date = $1', [dateStr]);
            if (existing.length > 0) {
                try { await query('DELETE FROM daily_stats_games WHERE stat_id = $1', [existing[0].id]); } catch(e) {}
                await query('DELETE FROM daily_stats WHERE stat_date = $1', [dateStr]);
            }

            // Count all users
            var userCountResult = await query('SELECT COUNT(*) as cnt FROM users');
            var totalUsers = parseInt(userCountResult[0].cnt) || 0;
            var activePlayers = Math.max(1, Math.round(totalUsers * 0.2));

            // Each player bets $20-$100
            var totalBets = 0;
            for (var bp = 0; bp < activePlayers; bp++) {
                totalBets += Math.floor(Math.random() * 81) + 20;
            }

            // Winnings: 60%-180% of total bets
            var winRate = 0.60 + Math.random() * 1.20;
            var totalWinnings = Math.round(totalBets * winRate);

            // Get random games
            var activeGames = await query('SELECT slug, name FROM games WHERE is_active = TRUE ORDER BY RANDOM()');
            var topCount = Math.min(activeGames.length, 10);
            var selectedGames = activeGames.slice(0, topCount);

            // Shuffle
            for (var si = selectedGames.length - 1; si > 0; si--) {
                var rj = Math.floor(Math.random() * (si + 1));
                var tmp = selectedGames[si];
                selectedGames[si] = selectedGames[rj];
                selectedGames[rj] = tmp;
            }

            // Distribute players
            var gamePlayers = [];
            var remainingPlayers = activePlayers;
            for (var dgi = 0; dgi < selectedGames.length; dgi++) {
                var isLast = dgi === selectedGames.length - 1;
                var gp = isLast ? remainingPlayers : Math.max(1, Math.floor(Math.random() * (remainingPlayers / (selectedGames.length - dgi) * 1.5)));
                if (!isLast) remainingPlayers -= gp;
                gamePlayers.push(gp);
            }

            // Distribute winnings
            var gameWinnings = [];
            var remainingWinnings = totalWinnings;
            for (var wgi = 0; wgi < selectedGames.length; wgi++) {
                var wIsLast = wgi === selectedGames.length - 1;
                var gw = wIsLast ? remainingWinnings : Math.max(50, Math.floor(Math.random() * (remainingWinnings / (selectedGames.length - wgi) * 1.5)));
                if (!wIsLast) remainingWinnings -= gw;
                gameWinnings.push(gw);
            }

            var topGame = selectedGames.length > 0 ? selectedGames[0] : null;

            // Insert main stat
            var statResult = await query(
                'INSERT INTO daily_stats (stat_date, total_players, total_bets, total_winnings, top_game_slug, top_game_name, top_game_players, top_game_winnings) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
                [dateStr, activePlayers, totalBets, totalWinnings, topGame ? topGame.slug : null, topGame ? topGame.name : null, gamePlayers[0] || 0, gameWinnings[0] || 0]
            );
            var statId = statResult[0].id;

            // Insert games
            for (var gi = 0; gi < selectedGames.length; gi++) {
                await query(
                    'INSERT INTO daily_stats_games (stat_id, game_slug, game_name, players, winnings, sort_order) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (stat_id, game_slug) DO UPDATE SET players=$4, winnings=$5, sort_order=$6',
                    [statId, selectedGames[gi].slug, selectedGames[gi].name, gamePlayers[gi], gameWinnings[gi], gi]
                );
            }

            return res.status(200).json({
                success: true,
                stat: {
                    date: dateStr,
                    total_users: totalUsers,
                    active_players: activePlayers,
                    total_bets: totalBets,
                    total_winnings: totalWinnings,
                    win_rate: (winRate * 100).toFixed(0) + '%',
                    top_game: topGame ? topGame.name : null,
                    games_count: selectedGames.length
                }
            });
        } catch(error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // ═══════════════════════════════════════════
    // DEFAULT: Check tables
    // ═══════════════════════════════════════════
    var results = [];
    try {
        var tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        results.push('Tables: ' + tables.map(t => t.table_name).join(', '));
        var counts = {};
        for (var i = 0; i < tables.length; i++) {
            try {
                var c = await query('SELECT COUNT(*) as cnt FROM ' + tables[i].table_name);
                counts[tables[i].table_name] = parseInt(c[0].cnt);
            } catch(e) { counts[tables[i].table_name] = 'error'; }
        }
        return res.status(200).json({ status: 'OK', tables: tables, counts: counts });
    } catch(e) {
        return res.status(500).json({ error: e.message, results: results });
    }
};
