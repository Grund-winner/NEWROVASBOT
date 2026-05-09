const { query } = require('../lib/db');

// ═══════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════
const BOT_TOKEN          = process.env.BOT_TOKEN || '';
const NOTIF_BOT_TOKEN    = process.env.NOTIF_BOT_TOKEN || '';
const NOTIF_ADMIN_CHAT_ID = process.env.NOTIF_ADMIN_CHAT_ID || '';
const BASE_URL           = process.env.BASE_URL || 'https://api.telegram.org';

// ═══════════════════════════════════════════════════════════════════════
// Telegram API helpers (native fetch)
// ═══════════════════════════════════════════════════════════════════════
async function sendTelegramMessage(chatId, text, token) {
  const botToken = token || BOT_TOKEN;
  if (!botToken) {
    console.error('[postback-deposit] Bot token is missing, cannot send message');
    return;
  }
  try {
    const url = `${BASE_URL}/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: Number(chatId),
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[postback-deposit] Telegram API ${res.status}:`, errBody);
    }
  } catch (err) {
    console.error('[postback-deposit] sendTelegramMessage error:', err.message);
  }
}

/**
 * Send notification to all admin chat IDs (comma-separated).
 */
async function notifyAdmins(text) {
  if (!NOTIF_BOT_TOKEN || !NOTIF_ADMIN_CHAT_ID) {
    console.warn('[postback-deposit] NOTIF_BOT_TOKEN or NOTIF_ADMIN_CHAT_ID not configured');
    return;
  }
  const chatIds = NOTIF_ADMIN_CHAT_ID.split(',').map(id => id.trim()).filter(Boolean);
  for (const chatId of chatIds) {
    await sendTelegramMessage(chatId, text, NOTIF_BOT_TOKEN);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════════════════════
module.exports = async (req, res) => {
  // Allow both GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(200).json({ success: true });
  }

  try {
    // Parse params from query string or body
    const params = req.method === 'GET' ? req.query : (req.body || {});
    const { clickid, user_id, amount, transactionid } = params;

    if (!clickid && !user_id) {
      console.warn('[postback-deposit] Missing clickid and user_id');
      return res.status(200).json({ success: true, message: 'Missing parameters' });
    }

    // Validate amount
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      console.warn(`[postback-deposit] Invalid amount: ${amount}`);
      return res.status(200).json({ success: true, message: 'Invalid amount' });
    }

    const telegramId = clickid || null;
    const oneWinUserId = user_id || null;

    // ── Check for duplicate transaction ──────────────────────────────
    if (transactionid) {
      const { rows: existing } = await query(
        'SELECT 1 FROM deposits WHERE transaction_id = $1 LIMIT 1',
        [transactionid],
      );
      if (existing.length > 0) {
        console.log(`[postback-deposit] Duplicate transaction ${transactionid}, skipping`);
        return res.status(200).json({ success: true, message: 'Duplicate transaction' });
      }
    }

    // ── Find user by telegram_id or one_win_user_id ──────────────────
    let user = null;
    if (telegramId) {
      const { rows } = await query(
        'SELECT * FROM users WHERE telegram_id = $1::int',
        [telegramId],
      );
      user = rows[0] || null;
    }
    if (!user && oneWinUserId) {
      const { rows } = await query(
        'SELECT * FROM users WHERE one_win_user_id = $1',
        [oneWinUserId],
      );
      user = rows[0] || null;
    }

    // ── Insert deposit record ────────────────────────────────────────
    await query(
      `INSERT INTO deposits (one_win_user_id, telegram_id, amount, transaction_id, created_at)
       VALUES ($1, $2::int, $3, $4, NOW())`,
      [oneWinUserId, telegramId, depositAmount, transactionid || null],
    );

    // ── Calculate total deposits for this 1Win user ──────────────────
    const effectiveOneWinId = oneWinUserId || (user ? user.one_win_user_id : null);
    let totalAmount = depositAmount;

    if (effectiveOneWinId) {
      const { rows: sumRows } = await query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE one_win_user_id = $1',
        [effectiveOneWinId],
      );
      totalAmount = parseFloat(sumRows[0].total);
    }

    // ── Update user deposit status ───────────────────────────────────
    if (user) {
      const effectiveTid = telegramId || user.telegram_id;
      await query(
        `UPDATE users
         SET is_deposited = TRUE,
             deposit_amount = $2,
             deposited_at = COALESCE(deposited_at, NOW()),
             updated_at = NOW()
         WHERE telegram_id = $1::int`,
        [effectiveTid, totalAmount],
      );

      // ── Send congratulation to user ──────────────────────────────
      const userCongratsText =
        '💰 <b>Dépôt détecté !</b>\n\n'
        + `Montant : <b>${depositAmount}$</b>\n`
        + `Total cumulé : <b>${totalAmount}$</b>\n\n`
        + '🎉 Votre dépôt a été confirmé avec succès !\n'
        + 'Accédez maintenant aux prédictions VIP ROVAS ! 🚀';

      await sendTelegramMessage(effectiveTid, userCongratsText, BOT_TOKEN);
    }

    // ── Send notification to admins ──────────────────────────────────
    const adminNotifText =
      '📊 <b>Nouveau dépôt ROVAS</b>\n\n'
      + `👤 Telegram ID : <code>${telegramId || 'N/A'}</code>\n`
      + `🎰 1Win ID : <code>${oneWinUserId || 'N/A'}</code>\n`
      + `💵 Montant : <b>${depositAmount}$</b>\n`
      + `💰 Total cumulé : <b>${totalAmount}$</b>\n`
      + `🔗 Transaction : <code>${transactionid || 'N/A'}</code>\n`
      + `🕐 ${new Date().toISOString()}`;

    await notifyAdmins(adminNotifText);

    console.log(
      `[postback-deposit] Deposit recorded: tid=${telegramId} owid=${oneWinUserId} ` +
      `amount=${depositAmount} total=${totalAmount} txid=${transactionid}`,
    );

    // Always return 200
    return res.status(200).json({ success: true, total: totalAmount });
  } catch (err) {
    console.error('[postback-deposit] Error:', err);
    // Always return 200 to prevent postback retry
    return res.status(200).json({ success: true, error: 'Internal error handled' });
  }
};
