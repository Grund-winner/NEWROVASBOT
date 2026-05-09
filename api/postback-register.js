const { query } = require('../lib/db');

// ═══════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const BASE_URL  = process.env.BASE_URL || 'https://api.telegram.org';

// ═══════════════════════════════════════════════════════════════════════
// Telegram API helper (native fetch)
// ═══════════════════════════════════════════════════════════════════════
async function sendTelegramMessage(chatId, text) {
  if (!BOT_TOKEN) {
    console.error('[postback-register] BOT_TOKEN is missing, cannot send message');
    return;
  }
  try {
    const url = `${BASE_URL}/bot${BOT_TOKEN}/sendMessage`;
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
      console.error(`[postback-register] Telegram API ${res.status}:`, errBody);
    }
  } catch (err) {
    console.error('[postback-register] sendTelegramMessage error:', err.message);
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
    const { clickid, user_id } = params;

    if (!clickid && !user_id) {
      console.warn('[postback-register] Missing clickid and user_id');
      return res.status(200).json({ success: true, message: 'Missing parameters' });
    }

    let user = null;

    // ── Strategy 1: lookup by telegram_id via clickid ────────────────
    if (clickid) {
      const { rows } = await query(
        'SELECT * FROM users WHERE telegram_id = $1::int',
        [clickid],
      );
      user = rows[0] || null;
    }

    // ── Strategy 2: lookup by one_win_user_id via user_id ────────────
    if (!user && user_id) {
      const { rows } = await query(
        'SELECT * FROM users WHERE one_win_user_id = $1',
        [user_id],
      );
      user = rows[0] || null;
    }

    if (user) {
      const oneWinId = user_id || clickid;

      // Only update if not already registered (avoid overwriting newer data)
      if (!user.is_registered) {
        await query(
          `UPDATE users
           SET one_win_user_id = COALESCE(one_win_user_id, $2),
               is_registered = TRUE,
               registered_at = COALESCE(registered_at, NOW()),
               updated_at = NOW()
           WHERE telegram_id = $1::int`,
          [user.telegram_id, oneWinId],
        );

        // Send congratulation message to user
        const congratsText =
          '🎉 <b>Félicitations !</b>\n\n'
          + 'Votre compte 1Win a été lié avec succès à ROVAS !\n\n'
          + '✅ Inscription confirmée\n'
          + '💰 Prochaine étape : effectuez votre dépôt pour débloquer l\'accès VIP aux prédictions.\n\n'
          + 'Merci de faire confiance à <b>ROVAS</b> ! 🚀';

        await sendTelegramMessage(user.telegram_id, congratsText);
        console.log(`[postback-register] User ${user.telegram_id} registered with 1Win ID ${oneWinId}`);
      } else {
        console.log(`[postback-register] User ${user.telegram_id} already registered, skipping`);
      }
    } else {
      console.warn(`[postback-register] No user found for clickid=${clickid} user_id=${user_id}`);
    }

    // Always return 200 to avoid postback retry from 1Win
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[postback-register] Error:', err);
    // Always return 200 to prevent postback retry
    return res.status(200).json({ success: true, error: 'Internal error handled' });
  }
};
