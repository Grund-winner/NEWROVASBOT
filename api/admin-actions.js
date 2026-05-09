const { query } = require('../lib/db');

// ═══════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════
const BOT_TOKEN     = process.env.BOT_TOKEN || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'NewROVASadmin22';
const BASE_URL      = process.env.BASE_URL || 'https://api.telegram.org';

// ═══════════════════════════════════════════════════════════════════════
// Telegram API helper (native fetch)
// ═══════════════════════════════════════════════════════════════════════
async function sendTelegramMessage(chatId, text) {
  if (!BOT_TOKEN) {
    console.error('[admin-actions] BOT_TOKEN is missing');
    return;
  }
  try {
    const url = `${BASE_URL}/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: Number(chatId),
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error('[admin-actions] sendMessage error:', err.message);
  }
}

/**
 * Get Telegram user info via getChat API.
 */
async function getTelegramChatInfo(telegramId) {
  if (!BOT_TOKEN) return null;
  try {
    const url = `${BASE_URL}/bot${BOT_TOKEN}/getChat?chat_id=${telegramId}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.ok ? data.result : null;
  } catch {
    return null;
  }
}

/**
 * Sleep utility for rate limiting.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════
// Body parser — supports JSON and multipart/form-data
// ═══════════════════════════════════════════════════════════════════════
function parseBody(req) {
  const raw = req.body || {};

  // If Vercel already parsed it as an object, use directly
  if (typeof raw === 'object' && !Buffer.isBuffer(raw)) {
    // Vercel may send multipart fields as strings; normalize booleans
    const normalized = {};
    for (const [k, v] of Object.entries(raw)) {
      normalized[k] = v;
    }
    return normalized;
  }

  // Fallback: try parsing as JSON string
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  return {};
}

// ═══════════════════════════════════════════════════════════════════════
// Action handlers
// ═══════════════════════════════════════════════════════════════════════

/**
 * broadcast — Send message to all/registered/deposited users
 */
async function handleBroadcast(body) {
  const { target, message } = body;

  if (!message || !message.trim()) {
    return { success: false, error: 'Message is required' };
  }

  const allowedTargets = ['all', 'registered', 'deposited'];
  const tgt = (target || 'all').toLowerCase();
  if (!allowedTargets.includes(tgt)) {
    return { success: false, error: `Invalid target. Allowed: ${allowedTargets.join(', ')}` };
  }

  // Build query based on target
  let sql;
  switch (tgt) {
    case 'registered':
      sql = 'SELECT telegram_id FROM users WHERE is_registered = TRUE';
      break;
    case 'deposited':
      sql = 'SELECT telegram_id FROM users WHERE is_deposited = TRUE';
      break;
    default:
      sql = 'SELECT telegram_id FROM users';
      break;
  }

  const { rows } = await query(sql);
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await sendTelegramMessage(row.telegram_id, message);
      sent++;
    } catch {
      failed++;
    }
    // 40ms delay between sends to respect Telegram rate limits
    await sleep(40);
  }

  return { success: true, sent, failed, target: tgt };
}

/**
 * add_user — Create or update a user (manual admin action)
 */
async function handleAddUser(body) {
  const telegramId = parseInt(body.telegram_id, 10);
  if (!telegramId) {
    return { success: false, error: 'telegram_id is required' };
  }

  // Support multiple field name aliases for one_win_user_id
  const oneWinUserId = body.one_win_user_id || body.id_1win || body.onewin_id || null;

  // Support aliases for booleans
  const isRegistered = body.is_registered === 'true' || body.is_registered === true || body.inscrit === 'true' || body.inscrit === true;
  const isDeposited  = body.is_deposited === 'true' || body.is_deposited === true || body.depose === 'true' || body.depose === true;
  const depositAmount = parseFloat(body.deposit_amount || body.montant) || 0;

  // Lookup Telegram user info
  const chatInfo = await getTelegramChatInfo(telegramId);
  const firstName = body.first_name || (chatInfo && chatInfo.first_name) || '';
  const lastName  = body.last_name  || (chatInfo && chatInfo.last_name) || '';
  const username  = body.username   || (chatInfo && chatInfo.username) || '';

  // Upsert user
  const setClauses = [];
  const setParams = [];
  let paramIdx = 1;

  if (oneWinUserId) {
    setClauses.push(`one_win_user_id = $${paramIdx++}`);
    setParams.push(oneWinUserId);
  }
  if (isRegistered) {
    setClauses.push(`is_registered = TRUE`);
  }
  if (isDeposited) {
    setClauses.push(`is_deposited = TRUE`);
  }
  if (depositAmount > 0) {
    setClauses.push(`deposit_amount = $${paramIdx++}`);
    setParams.push(depositAmount);
    setClauses.push(`deposited_at = COALESCE(deposited_at, NOW())`);
  }
  setClauses.push(`updated_at = NOW()`);

  const setSql = setClauses.join(', ');

  // Check if user exists
  const { rows: existing } = await query(
    'SELECT id FROM users WHERE telegram_id = $1::int',
    [telegramId],
  );

  if (existing.length > 0) {
    // Update existing user
    await query(
      `UPDATE users SET ${setSql} WHERE telegram_id = $${paramIdx++}::int`,
      [...setParams, telegramId],
    );
  } else {
    // Insert new user
    await query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, one_win_user_id, is_registered, is_deposited, deposit_amount, deposited_at, updated_at, created_at)
       VALUES ($1::int, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $9 > 0 THEN NOW() END, NOW(), NOW())`,
      [telegramId, username, firstName, lastName, oneWinUserId, isRegistered, isDeposited, depositAmount > 0 ? depositAmount : 0, depositAmount],
    );
  }

  // Insert deposit record if amount > 0 and one_win_user_id exists
  if (depositAmount > 0 && oneWinUserId) {
    // Check if admin manual adjustment already exists
    const { rows: existingAdj } = await query(
      `SELECT id FROM deposits
       WHERE one_win_user_id = $1 AND transaction_id = 'admin_manual_adjust'
       LIMIT 1`,
      [oneWinUserId],
    );

    if (existingAdj.length === 0) {
      await query(
        `INSERT INTO deposits (one_win_user_id, telegram_id, amount, transaction_id, created_at)
         VALUES ($1, $2::int, $3, 'admin_manual_adjust', NOW())`,
        [oneWinUserId, telegramId, depositAmount],
      );
    }
  }

  // Refresh and return user
  const { rows: [user] } = await query(
    'SELECT * FROM users WHERE telegram_id = $1::int',
    [telegramId],
  );

  return { success: true, user };
}

/**
 * edit_user — Update user fields
 * CRITICAL: When both deposit_amount and is_deposited are provided,
 * do NOT auto-set is_deposited from deposit_amount to avoid
 * "multiple assignments to same column" SQL error.
 */
async function handleEditUser(body) {
  const telegramId = parseInt(body.telegram_id, 10);
  if (!telegramId) {
    return { success: false, error: 'telegram_id is required' };
  }

  // Check user exists
  const { rows: existing } = await query(
    'SELECT * FROM users WHERE telegram_id = $1::int',
    [telegramId],
  );
  if (existing.length === 0) {
    return { success: false, error: 'User not found' };
  }

  const user = existing[0];
  const setClauses = [];
  const setParams = [];
  let paramIdx = 1;
  let hasIsDepositedExplicit = false;
  let hasDepositAmount = false;

  // one_win_user_id
  const oneWinUserId = body.one_win_user_id || body.id_1win || body.onewin_id;
  if (oneWinUserId !== undefined) {
    setClauses.push(`one_win_user_id = $${paramIdx++}`);
    setParams.push(oneWinUserId);
  }

  // is_registered / inscrit
  if (body.is_registered !== undefined || body.inscrit !== undefined) {
    const val = body.is_registered !== undefined ? body.is_registered : body.inscrit;
    setClauses.push(`is_registered = ${val === true || val === 'true'}`);
  }

  // is_deposited / depose
  if (body.is_deposited !== undefined || body.depose !== undefined) {
    const val = body.is_deposited !== undefined ? body.is_deposited : body.depose;
    setClauses.push(`is_deposited = ${val === true || val === 'true'}`);
    hasIsDepositedExplicit = true;
  }

  // deposit_amount / montant
  if (body.deposit_amount !== undefined || body.montant !== undefined) {
    const val = body.deposit_amount !== undefined ? body.deposit_amount : body.montant;
    const amount = parseFloat(val) || 0;
    setClauses.push(`deposit_amount = $${paramIdx++}`);
    setParams.push(amount);
    hasDepositAmount = true;

    // Auto-set is_deposited ONLY if it was NOT explicitly provided
    if (!hasIsDepositedExplicit) {
      if (amount > 0) {
        setClauses.push('is_deposited = TRUE');
      } else {
        setClauses.push('is_deposited = FALSE');
      }
    }
  }

  // Handle manual deposit adjustments in deposits table
  if (hasDepositAmount && user.one_win_user_id) {
    const newAmount = parseFloat(body.deposit_amount !== undefined ? body.deposit_amount : body.montant) || 0;

    // Delete old admin manual adjustments
    await query(
      `DELETE FROM deposits
       WHERE one_win_user_id = $1 AND transaction_id = 'admin_manual_adjust'`,
      [user.one_win_user_id],
    );

    // Get real deposit sum (excluding manual adjustments)
    const { rows: sumRows } = await query(
      `SELECT COALESCE(SUM(amount), 0)::float as total
       FROM deposits
       WHERE one_win_user_id = $1 AND transaction_id != 'admin_manual_adjust'`,
      [user.one_win_user_id],
    );
    const realTotal = parseFloat(sumRows[0].total);

    // Calculate adjustment needed
    const adjustment = newAmount - realTotal;
    if (Math.abs(adjustment) > 0.001) {
      await query(
        `INSERT INTO deposits (one_win_user_id, telegram_id, amount, transaction_id, created_at)
         VALUES ($1, $2::int, $3, 'admin_manual_adjust', NOW())`,
        [user.one_win_user_id, telegramId, adjustment],
      );
    }
  }

  // first_name, last_name, username
  if (body.first_name !== undefined) {
    setClauses.push(`first_name = $${paramIdx++}`);
    setParams.push(body.first_name);
  }
  if (body.last_name !== undefined) {
    setClauses.push(`last_name = $${paramIdx++}`);
    setParams.push(body.last_name);
  }
  if (body.username !== undefined) {
    setClauses.push(`username = $${paramIdx++}`);
    setParams.push(body.username);
  }

  if (setClauses.length === 0) {
    return { success: false, error: 'No fields to update' };
  }

  setClauses.push('updated_at = NOW()');

  // Execute update
  await query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE telegram_id = $${paramIdx++}::int`,
    [...setParams, telegramId],
  );

  // Return updated user
  const { rows: [updatedUser] } = await query(
    'SELECT * FROM users WHERE telegram_id = $1::int',
    [telegramId],
  );

  return { success: true, user: updatedUser };
}

/**
 * delete_user — Delete user + their deposits + bot_sessions
 */
async function handleDeleteUser(body) {
  const telegramId = parseInt(body.telegram_id, 10);
  if (!telegramId) {
    return { success: false, error: 'telegram_id is required' };
  }

  // Get user info for response
  const { rows: existing } = await query(
    'SELECT * FROM users WHERE telegram_id = $1::int',
    [telegramId],
  );
  if (existing.length === 0) {
    return { success: false, error: 'User not found' };
  }
  const user = existing[0];

  // Delete in reverse dependency order
  await query('DELETE FROM deposits WHERE telegram_id = $1::int', [telegramId]);
  await query("DELETE FROM bot_sessions WHERE bot_type = 'ROVAS' AND admin_id = $1::int", [telegramId]);
  const { rowCount } = await query('DELETE FROM users WHERE telegram_id = $1::int', [telegramId]);

  return {
    success: true,
    deleted_user: {
      telegram_id: user.telegram_id,
      one_win_user_id: user.one_win_user_id,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    rows_deleted: rowCount,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════════════════════
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body (JSON or multipart/form-data)
  const body = parseBody(req);

  // Auth check
  const password = body.password || '';
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const action = (body.action || '').toLowerCase().trim();

  try {
    let result;

    switch (action) {
      case 'broadcast':
        result = await handleBroadcast(body);
        break;
      case 'add_user':
        result = await handleAddUser(body);
        break;
      case 'edit_user':
        result = await handleEditUser(body);
        break;
      case 'delete_user':
        result = await handleDeleteUser(body);
        break;
      default:
        return res.status(400).json({ success: false, error: 'Action non reconnue' });
    }

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error(`[admin-actions] Error on action "${action}":`, err);
    return res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
  }
};
