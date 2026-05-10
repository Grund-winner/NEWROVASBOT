// Last updated: 1778157824
// ═══════════════════════════════════════════════════════
// ROVAS V2 - Postback Deposit
// ═══════════════════════════════════════════════════════
const { query } = require('../lib/db');
const fetch = require('node-fetch');

const MIN_DEPOSIT = parseFloat(process.env.MIN_DEPOSIT) || 5;
const NOTIF_BOT_TOKEN = process.env.NOTIF_BOT_TOKEN;
const ADMIN_CHAT_IDS = (process.env.NOTIF_ADMIN_CHAT_ID || '').split(',').filter(id => id.trim() !== '');
const POSTBACK_SECRET = process.env.POSTBACK_SECRET;

function verifyPostback(req) {
    if (!POSTBACK_SECRET) {
        console.warn('[POSTBACK AUTH] POSTBACK_SECRET not set - postback auth disabled');
        return true;
    }
    const sig = req.query.sig || req.headers['x-postback-sig'] || '';
    if (sig === POSTBACK_SECRET) return true;
    console.warn('[POSTBACK AUTH] Invalid static token, rejected.');
    return false;
}

async function sendNotif(chatId, text) {
    try {
        await fetch(`https://api.telegram.org/bot${NOTIF_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
        });
    } catch (e) { console.error('[NOTIF ERROR]', e.message); }
}

module.exports = async function handler(req, res) {
    try {
        if (!verifyPostback(req)) {
            console.warn('[POSTBACK DEP] Invalid signature, rejected.');
            return res.status(403).send('Forbidden');
        }

        const clickid = req.query.clickid || null;
        const userId1win = req.query.user_id;
        const amount = parseFloat(req.query.amount) || 0;
        const transactionId = req.query.transactionid || null;

        if (!userId1win) return res.status(400).send('Missing user_id');
        console.log(`[POSTBACK DEP] clickid=${clickid}, user_id=${userId1win}, amount=${amount}, txn=${transactionId}`);

        // ─── Vérifier si la transaction a déjà été traitée ───
        if (transactionId) {
            const dup = await query('SELECT id FROM deposits WHERE transaction_id = $1', [transactionId]);
            if (dup.length > 0) {
                console.log(`[POSTBACK DEP] Transaction ${transactionId} déjà traitée, ignorée.`);
                return res.status(200).send('OK');
            }
        }

        let telegramId = clickid || null;
        let total = amount;

        if (clickid) {
            const existing = await query('SELECT * FROM users WHERE telegram_id = $1', [clickid]);
            if (existing.length > 0) {
                const user = existing[0];
                total = parseFloat(user.deposit_amount || 0) + amount;
                const ok = total >= MIN_DEPOSIT;
                await query(
                    'UPDATE users SET is_deposited = $1, deposit_amount = $2, one_win_user_id = $3, is_registered = TRUE, deposited_at = NOW(), updated_at = NOW() WHERE telegram_id = $4',
                    [ok, total, userId1win, clickid]
                );
            } else {
                const ok = amount >= MIN_DEPOSIT;
                await query(
                    'INSERT INTO users (telegram_id, one_win_user_id, is_registered, is_deposited, deposit_amount, deposited_at, created_at, updated_at) VALUES ($1, $2, TRUE, $3, $4, CASE WHEN $3 THEN NOW() ELSE NULL END, NOW(), NOW())',
                    [clickid, userId1win, ok, amount]
                );
            }
        } else {
            const existing = await query('SELECT * FROM users WHERE one_win_user_id = $1', [userId1win]);
            if (existing.length > 0) {
                telegramId = existing[0].telegram_id;
                total = parseFloat(existing[0].deposit_amount || 0) + amount;
                const ok = total >= MIN_DEPOSIT;
                await query(
                    'UPDATE users SET is_deposited = $1, deposit_amount = $2, is_registered = TRUE, deposited_at = NOW(), updated_at = NOW() WHERE one_win_user_id = $3',
                    [ok, total, userId1win]
                );
            } else {
                const ok = amount >= MIN_DEPOSIT;
                await query(
                    'INSERT INTO users (one_win_user_id, is_registered, is_deposited, deposit_amount, deposited_at, created_at, updated_at) VALUES ($1, TRUE, $2, $3, CASE WHEN $2 THEN NOW() ELSE NULL END, NOW(), NOW())',
                    [userId1win, ok, amount]
                );
            }
        }

        // ─── Enregistrer la transaction ───
        await query(
            'INSERT INTO deposits (telegram_id, one_win_user_id, amount, transaction_id, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [telegramId, userId1win, amount, transactionId]
        );

        // ─── Notification Admin ───
        if (ADMIN_CHAT_IDS.length > 0 && NOTIF_BOT_TOKEN) {
            const notif = '<b>💰 Nouveau dépôt (ROVAS V2)</b>\n\n'
                + '<b>ID 1Win :</b> <code>' + userId1win + '</code>\n'
                + '<b>Telegram ID :</b> <code>' + (telegramId || 'N/A') + '</code>\n'
                + '<b>Montant :</b> $' + amount.toFixed(2) + '\n'
                + '<b>Total :</b> $' + total.toFixed(2) + '\n'
                + '<b>Transaction :</b> <code>' + (transactionId || 'N/A') + '</code>';
            for (const chatId of ADMIN_CHAT_IDS) { await sendNotif(chatId, notif); }
        }

        console.log(`[POSTBACK DEP] OK: ${amount}$ | tg=${telegramId || 'N/A'} | 1win=${userId1win}`);
        res.status(200).send('OK');
    } catch (error) {
        console.error('[POSTBACK DEP ERROR]', error);
        res.status(500).send('Error');
    }
};
