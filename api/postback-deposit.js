// ═══════════════════════════════════════════════════════
// ROVAS V2 - Postback Deposit
// Auto-send VIP message + delete deposit message when deposit >= MIN
// ═══════════════════════════════════════════════════════
const { query } = require('../lib/db');
const fetch = require('node-fetch');
const crypto = require('crypto');

const MIN_DEPOSIT = parseFloat(process.env.MIN_DEPOSIT) || 5;
const NOTIF_BOT_TOKEN = process.env.NOTIF_BOT_TOKEN;
const ADMIN_CHAT_IDS = (process.env.NOTIF_ADMIN_CHAT_ID || '').split(',').filter(id => id.trim() !== '');
const POSTBACK_SECRET = process.env.POSTBACK_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = process.env.BASE_URL || 'https://newrovasbot.vercel.app';
const REG_LINK = process.env.REG_LINK || 'https://one-vv343.com/casino?p=ufjv';
const LINK_SECRET = process.env.ADMIN_PASSWORD || 'rovasadmin2024';

// ─── i18n for VIP message ───
const MSGS = {};
MSGS.fr = {
    access_granted: '🏆 <b>Accès VIP Débloqué !</b>\n\nFélicitations ! Vos prédictions exclusives sont maintenant disponibles.',
    btn_predictions: '⚜️GET SIGNAL⚜️',
    btn_back: '← Retour'
};
MSGS.en = {
    access_granted: '🏆 <b>VIP Access Unlocked!</b>\n\nCongratulations! Your exclusive predictions are now available.',
    btn_predictions: '⚜️GET SIGNAL⚜️',
    btn_back: '← Back'
};
MSGS.hi = {
    access_granted: '🏆 <b>VIP एक्सेस अनलॉक!</b>\n\nबधाई! आपके विशेष प्रेडिक्शन अब उपलब्ध हैं।',
    btn_predictions: '⚜️GET SIGNAL⚜️',
    btn_back: '← वापस'
};
MSGS.uz = {
    access_granted: '🏆 <b>VIP kirish ochilmoqda!</b>\n\nTabriklaymiz! Maxsus taxminlaringiz endi mavjud.',
    btn_predictions: '⚜️GET SIGNAL⚜️',
    btn_back: '← Orqaga'
};
MSGS.es = {
    access_granted: '🏆 <b>¡Acceso VIP Desbloqueado!</b>\n\n¡Felicidades! Sus predicciones exclusivas ahora están disponibles.',
    btn_predictions: '⚜️GET SIGNAL⚜️',
    btn_back: '← Volver'
};
MSGS.az = {
    access_granted: '🏆 <b>VIP giriş açıldı!</b>\n\nTəbrikler! Xüsusi proqnozlarınız artıq mövcuddur.',
    btn_predictions: '⚜️GET SIGNAL⚜️',
    btn_back: '← Geri'
};
MSGS.tr = {
    access_granted: '🏆 <b>VIP Erişimi Açıldı!</b>\n\nTebrikler! Özel tahminleriniz artık kullanılabilir.',
    btn_predictions: '⚜️GET SIGNAL⚜️',
    btn_back: '← Geri'
};
MSGS.ar = {
    access_granted: '🏆 <b>تم فتح الوصول VIP!</b>\n\nتهانينا! التوقعات الحصرية متاحة الآن.',
    btn_predictions: '⚜️GET SIGNAL⚜️',
    btn_back: '← رجوع'
};
MSGS.ru = {
    access_granted: '🏆 <b>VIP доступ открыт!</b>\n\nПоздравляем! Ваши эксклюзивные прогнозы теперь доступны.',
    btn_predictions: '⚜️GET SIGNAL⚜️',
    btn_back: '← Назад'
};
MSGS.pt = {
    access_granted: '🏆 <b>Acesso VIP Desbloqueado!</b>\n\nParabéns! Suas previsões exclusivas agora estão disponíveis.',
    btn_predictions: '⚜️GET SIGNAL⚜️',
    btn_back: '← Voltar'
};

function msg(key, lang) { return (MSGS[lang] && MSGS[lang][key]) || (MSGS.fr && MSGS.fr[key]) || key; }

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

async function tgAPI(method, data) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (e) {
        console.error('[POSTBACK TG ERROR]', e);
        return { ok: false };
    }
}

async function deleteMsg(chatId, msgId) {
    if (!msgId) return;
    try { await tgAPI('deleteMessage', { chat_id: chatId, message_id: msgId }); } catch (e) {}
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

function generateToken(telegramId) {
    const exp = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000;
    const payload = `${telegramId}:${exp}`;
    const sig = crypto.createHmac('sha256', LINK_SECRET).update(payload).digest('hex').substring(0, 12);
    return Buffer.from(`${payload}:${sig}`).toString('base64url');
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

        let telegramId = clickid ? parseInt(clickid) : null;
        let total = amount;
        let userLang = 'fr';
        let lastMsgId = null;
        let wasAlreadyVIP = false;

        if (clickid) {
            const existing = await query('SELECT * FROM users WHERE telegram_id = $1', [clickid]);
            if (existing.length > 0) {
                const user = existing[0];
                total = parseFloat(user.deposit_amount || 0) + amount;
                wasAlreadyVIP = user.is_deposited && total >= MIN_DEPOSIT && user.deposited_at !== null;
                userLang = user.language || 'fr';
                lastMsgId = user.last_message_id;
                const ok = total >= MIN_DEPOSIT;
                await query(
                    'UPDATE users SET is_deposited = $1, deposit_amount = $2, one_win_user_id = $3, is_registered = TRUE, deposited_at = CASE WHEN $1 THEN NOW() ELSE deposited_at END, updated_at = NOW() WHERE telegram_id = $4',
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
                wasAlreadyVIP = existing[0].is_deposited && total >= MIN_DEPOSIT && existing[0].deposited_at !== null;
                userLang = existing[0].language || 'fr';
                lastMsgId = existing[0].last_message_id;
                const ok = total >= MIN_DEPOSIT;
                await query(
                    'UPDATE users SET is_deposited = $1, deposit_amount = $2, is_registered = TRUE, deposited_at = CASE WHEN $1 THEN NOW() ELSE deposited_at END, updated_at = NOW() WHERE one_win_user_id = $3',
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

        // ─── AUTO-MESSAGE: Send VIP message when deposit threshold reached ───
        const justReachedVIP = total >= MIN_DEPOSIT && !wasAlreadyVIP;

        if (telegramId && justReachedVIP) {
            console.log(`[POSTBACK DEP] VIP unlocked for Telegram ${telegramId} (lang=${userLang})`);

            // Delete last message (deposit)
            if (lastMsgId) {
                await deleteMsg(telegramId, lastMsgId);
            }

            // Build VIP message with GET SIGNAL button
            const token = generateToken(telegramId);
            const webAppUrl = `${BASE_URL}/api/claim?token=${token}&lang=${userLang}`;
            const vipText = msg('access_granted', userLang);
            const btns = [
                [{ text: msg('btn_predictions', userLang), web_app: { url: webAppUrl } }],
                [{ text: msg('btn_back', userLang), callback_data: 'back' }]
            ];

            // Try with logo.png photo first
            let msgSent = false;
            const photoRes = await tgAPI('sendPhoto', {
                chat_id: telegramId,
                photo: BASE_URL + '/logo.png',
                caption: vipText,
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: btns }
            });
            if (photoRes.ok && photoRes.result) {
                msgSent = true;
                try {
                    await query('UPDATE users SET last_message_id = $1, updated_at = NOW() WHERE telegram_id = $2',
                        [photoRes.result.message_id, telegramId]);
                } catch (e) {}
                console.log(`[POSTBACK DEP] VIP photo message sent, msg_id=${photoRes.result.message_id}`);
            }

            // Fallback: text message
            if (!msgSent) {
                const textRes = await tgAPI('sendMessage', {
                    chat_id: telegramId,
                    text: vipText,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: btns }
                });
                if (textRes.ok && textRes.result) {
                    try {
                        await query('UPDATE users SET last_message_id = $1, updated_at = NOW() WHERE telegram_id = $2',
                            [textRes.result.message_id, telegramId]);
                    } catch (e) {}
                    console.log(`[POSTBACK DEP] VIP text message sent, msg_id=${textRes.result.message_id}`);
                }
            }
        } else if (telegramId && wasAlreadyVIP) {
            console.log(`[POSTBACK DEP] User ${telegramId} already VIP, skipping auto-message.`);
        }

        // ─── Notification Admin ───
        if (ADMIN_CHAT_IDS.length > 0 && NOTIF_BOT_TOKEN) {
            const notif = '<b>💰 Nouveau dépôt (ROVAS V2)</b>\n\n'
                + '<b>ID 1Win :</b> <code>' + userId1win + '</code>\n'
                + '<b>Telegram ID :</b> <code>' + (telegramId || 'N/A') + '</code>\n'
                + '<b>Montant :</b> $' + amount.toFixed(2) + '\n'
                + '<b>Total :</b> $' + total.toFixed(2) + '\n'
                + '<b>VIP :</b> ' + (total >= MIN_DEPOSIT ? '✅ OUI' : '❌ Non encore') + '\n'
                + '<b>Transaction :</b> <code>' + (transactionId || 'N/A') + '</code>';
            for (const chatId of ADMIN_CHAT_IDS) { await sendNotif(chatId, notif); }
        }

        console.log(`[POSTBACK DEP] OK: ${amount}$ | total=${total}$ | tg=${telegramId || 'N/A'} | 1win=${userId1win}`);
        res.status(200).send('OK');
    } catch (error) {
        console.error('[POSTBACK DEP ERROR]', error);
        res.status(500).send('Error');
    }
};
