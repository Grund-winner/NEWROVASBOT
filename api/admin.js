const { query } = require('../lib/db');

// ═══════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'NewROVASadmin22';

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ROVAS-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ═══════════════════════════════════════════════════════════════════════
// Action handlers
// ═══════════════════════════════════════════════════════════════════════

/**
 * stats — Dashboard statistics
 */
async function handleStats() {
  const [
    totalUsers,
    registeredUsers,
    depositedUsers,
    depositSum,
    newToday,
  ] = await Promise.all([
    query('SELECT COUNT(*)::int as count FROM users'),
    query('SELECT COUNT(*)::int as count FROM users WHERE is_registered = TRUE'),
    query('SELECT COUNT(*)::int as count FROM users WHERE is_deposited = TRUE'),
    query('SELECT COALESCE(SUM(amount), 0)::float as total FROM deposits'),
    query("SELECT COUNT(*)::int as count FROM users WHERE created_at >= CURRENT_DATE"),
  ]);

  return {
    total_users: totalUsers.rows[0].count,
    registered_users: registeredUsers.rows[0].count,
    deposited_users: depositedUsers.rows[0].count,
    total_deposits: parseFloat(depositSum.rows[0].total),
    new_today: newToday.rows[0].count,
  };
}

/**
 * users — List all users with deposit totals
 */
async function handleUsers() {
  const { rows } = await query(
    `SELECT u.*,
            COALESCE((SELECT SUM(d.amount) FROM deposits d WHERE d.one_win_user_id = u.one_win_user_id), 0)::float AS real_deposit_total
     FROM users u
     ORDER BY u.created_at DESC`,
  );
  return rows;
}

/**
 * search — ILIKE search by various fields
 */
async function handleSearch(req) {
  const term = (req.query.q || '').trim();
  if (!term) return [];

  const { rows } = await query(
    `SELECT u.*,
            COALESCE((SELECT SUM(d.amount) FROM deposits d WHERE d.one_win_user_id = u.one_win_user_id), 0)::float AS real_deposit_total
     FROM users u
     WHERE u.telegram_id::text ILIKE $1
        OR u.one_win_user_id::text ILIKE $1
        OR u.first_name ILIKE $1
        OR u.last_name ILIKE $1
        OR u.username ILIKE $1
     ORDER BY u.created_at DESC
     LIMIT 100`,
    [`%${term}%`],
  );
  return rows;
}

/**
 * deposits — Get deposits for a specific user
 */
async function handleDeposits(req) {
  const userId = req.query.user_id;
  if (!userId) return [];

  const { rows } = await query(
    `SELECT d.*,
            u.first_name, u.last_name, u.username, u.telegram_id
     FROM deposits d
     LEFT JOIN users u ON u.one_win_user_id = d.one_win_user_id
     WHERE d.telegram_id = $1::int OR d.one_win_user_id::text = $2
     ORDER BY d.created_at DESC`,
    [userId, userId],
  );
  return rows;
}

/**
 * codes — List all access codes
 */
async function handleCodes() {
  const { rows } = await query(
    'SELECT * FROM access_codes ORDER BY created_at DESC',
  );
  return rows;
}

/**
 * generate — Generate N access codes
 */
async function handleGenerate(req) {
  let count = parseInt(req.query.count, 10) || 10;
  if (count < 1) count = 1;
  if (count > 100) count = 100;

  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = generateCode();
    codes.push(code);
  }

  const values = codes.map((_, i) => `($${i + 1})`).join(', ');
  await query(
    `INSERT INTO access_codes (code, created_at) VALUES ${values}`,
    codes,
  );

  // Return the generated codes
  const { rows } = await query(
    "SELECT * FROM access_codes WHERE code = ANY($1) ORDER BY created_at DESC",
    [codes],
  );
  return { generated: rows, count };
}

/**
 * cleanup — Delete duplicate telegram_id entries (keep most recent)
 */
async function handleCleanup() {
  // Find duplicate telegram_ids
  const { rows: duplicates } = await query(
    `SELECT telegram_id, COUNT(*) as cnt
     FROM users
     WHERE telegram_id IS NOT NULL
     GROUP BY telegram_id
     HAVING COUNT(*) > 1`,
  );

  let deletedCount = 0;

  for (const dup of duplicates) {
    // Get all rows for this telegram_id ordered by created_at DESC (newest first)
    const { rows } = await query(
      `SELECT id FROM users WHERE telegram_id = $1::int ORDER BY created_at DESC`,
      [dup.telegram_id],
    );

    // Keep the first (newest), delete the rest
    if (rows.length > 1) {
      const idsToDelete = rows.slice(1).map(r => r.id);
      const deleteResult = await query(
        `DELETE FROM users WHERE id = ANY($1::int[])`,
        [idsToDelete],
      );
      deletedCount += deleteResult.rowCount || 0;
    }
  }

  return { duplicates_found: duplicates.length, deleted: deletedCount };
}

/**
 * games — List all games
 */
async function handleGames() {
  const { rows } = await query(
    'SELECT * FROM games ORDER BY sort_order ASC, created_at DESC',
  );
  return rows;
}

// ═══════════════════════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════════════════════
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const password = req.query.password || '';
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const action = (req.query.action || '').toLowerCase().trim();

  try {
    let result;

    switch (action) {
      case 'stats':
        result = await handleStats();
        break;
      case 'users':
        result = await handleUsers();
        break;
      case 'search':
        result = await handleSearch(req);
        break;
      case 'deposits':
        result = await handleDeposits(req);
        break;
      case 'codes':
        result = await handleCodes();
        break;
      case 'generate':
        result = await handleGenerate(req);
        break;
      case 'cleanup':
        result = await handleCleanup();
        break;
      case 'games':
        result = await handleGames();
        break;
      default:
        return res.status(400).json({ error: 'Action non reconnue' });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(`[admin] Error on action "${action}":`, err);
    return res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
  }
};
