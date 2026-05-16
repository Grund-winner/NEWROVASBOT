// ═══════════════════════════════════════════════════════
// ROVAS V2 - Postback Registration
// Auto-send deposit message + delete inscription message
// ═══════════════════════════════════════════════════════
const { query } = require('../lib/db');
const fetch = require('node-fetch');

const POSTBACK_SECRET = process.env.POSTBACK_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = process.env.BASE_URL || 'https://newrovasbot.vercel.app';
const REG_LINK = process.env.REG_LINK || 'https://one-vv343.com/casino?p=ufjv';
const PROMO = process.env.PROMO_CODE || 'ROVAS';
const MIN_DEPOSIT = parseFloat(process.env.MIN_DEPOSIT) || 5;

// ─── LANGUES ───
const LANGS = {
    fr: { flag: '🇫🇷', rate: 666.67, symbol: 'FCFA' },
    en: { flag: '🇬🇧', rate: 1, symbol: '$' },
    hi: { flag: '🇮🇳', rate: 83.5, symbol: '₹' },
    uz: { flag: '🇺🇿', rate: 12650, symbol: "so'm" },
    es: { flag: '🇪🇸', rate: 0.92, symbol: '€' },
    az: { flag: '🇦🇿', rate: 1.7, symbol: '₼' },
    tr: { flag: '🇹🇷', rate: 34, symbol: '₺' },
    ar: { flag: '🇸🇦', rate: 3.75, symbol: 'ر.س' },
    ru: { flag: '🇷🇺', rate: 91.5, symbol: '₽' },
    pt: { flag: '🇧🇷', rate: 5.5, symbol: 'R$' }
};

function depositStr(lang) {
    const l = LANGS[lang] || LANGS.fr;
    const local = Math.round(MIN_DEPOSIT * l.rate);
    if (lang === 'en') return `<b>$${MIN_DEPOSIT}</b>`;
    return `<b>${MIN_DEPOSIT}$ (${local} ${l.symbol})</b>`;
}

// ─── i18n for postback messages ───
const MSGS = {};
MSGS.fr = {
    deposit: `❂ Félicitations ! Votre inscription a été effectuée avec succès 🎉🌟\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 1▸Cliquez maintenant sur le bouton « RECHARGER »\n ◆Effectuez un dépôt minimum de DEPAMT sur votre compte 1win afin d'activer le bot\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 2▸Une fois le dépôt confirmé sur votre compte ✅\n ◆Le bot sera automatiquement activé et vous pourrez accéder aux différents PREDICTORS`,
    btn_deposit: '💳 Dépôt',
    btn_back: '← Retour'
};
MSGS.en = {
    deposit: `❂ Congratulations! Your registration has been completed successfully 🎉🌟\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 1▸Click now on the "RECHARGE" button\n ◆Make a minimum deposit of DEPAMT on your 1win account to activate the bot\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 2▸Once the deposit is confirmed on your account ✅\n ◆The bot will be automatically activated and you will be able to access the various PREDICTORS`,
    btn_deposit: '💳 Deposit',
    btn_back: '← Back'
};
MSGS.hi = {
    deposit: `❂ बधाई! आपका पंजीकरण सफलतापूर्वक पूरा हो गया 🎉🌟\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 1▸अब "रिचार्ज" बटन पर क्लिक करें\n ◆बॉट को सक्रिय करने के लिए अपने 1win खाते पर न्यूनतम DEPAMT जमा करें\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 2▸खाते पर जमा confirmed होने के बाद ✅\n ◆बॉट स्वचालित रूप से सक्रिय हो जाएगा`,
    btn_deposit: '💳 जमा',
    btn_back: '← वापस'
};
MSGS.uz = {
    deposit: `❂ Tabriklaymiz! Sizning ro'yxatingiz muvaffaqiyatli yakunlandi 🎉🌟\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 1▸Endi "TO'LDIRISH" tugmasini bosing\n ◆Botni faollashtirish uchun 1win hisobingizga kamida DEPAMT to'ldiring\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 2▸Hisobingizda to'lov tasdiqlangach ✅\n ◆Bot avtomatik faollashadi`,
    btn_deposit: '💳 To\'ldirish',
    btn_back: '← Orqaga'
};
MSGS.es = {
    deposit: `❂ ¡Felicidades! Su registro se ha completado con éxito 🎉🌟\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 1▸Haga clic ahora en el botón "RECARGAR"\n ◆Realice un depósito mínimo de DEPAMT en su cuenta 1win para activar el bot\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 2▸Una vez confirmado el depósito en su cuenta ✅\n ◆El bot se activará automáticamente`,
    btn_deposit: '💳 Depositar',
    btn_back: '← Volver'
};
MSGS.az = {
    deposit: `❂ Təbrikler! Qeydiyyatınız uğurla tamamlandı 🎉🌟\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 1▸İndi "DOLDUR" düyməsinə basın\n ◆Botu aktivləşdirmək üçün 1win hesabınıza minimum DEPAMT daxil edin\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 2▸Hesabınızda ödəniş təsdiqləndikdən sonra ✅\n ◆Bot avtomatik aktivləşəcək`,
    btn_deposit: '💳 Depozit',
    btn_back: '← Geri'
};
MSGS.tr = {
    deposit: `❂ Tebrikler! Kaydınız başarıyla tamamlandı 🎉🌟\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 1▸Şimdi "YÜKLE" düğmesine tıklayın\n ◆Botu etkinleştirmek için 1win hesabınıza minimum DEPAMT yatırın\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 2▸Hesabınızda ödeme onaylandıktan sonra ✅\n ◆Bot otomatik olarak etkinleşecektir`,
    btn_deposit: '💳 Yatır',
    btn_back: '← Geri'
};
MSGS.ar = {
    deposit: `❂ تهانينا! اكتمل تسجيلك بنجاح 🎉🌟\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 1▸انقر الآن على زر "إعادة الشحن"\n ◆قم بإيداع حد أدنى DEPAMT في حسابك على 1win لتفعيل البوت\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 2▸بمجرد تأكيد الإيداع في حسابك ✅\n ◆سيتم تفعيل البوت تلقائياً`,
    btn_deposit: '💳 إيداع',
    btn_back: '← رجوع'
};
MSGS.ru = {
    deposit: `❂ Поздравляем! Ваша регистрация успешно завершена 🎉🌟\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 1▸Нажмите кнопку "ПОПОЛНИТЬ"\n ◆Внесите минимальный депозит DEPAMT на ваш счет 1win для активации бота\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 2▸После подтверждения депозита на вашем счете ✅\n ◆Бот будет автоматически активирован`,
    btn_deposit: '💳 Пополнить',
    btn_back: '← Назад'
};
MSGS.pt = {
    deposit: `❂ Parabéns! Seu registro foi concluído com sucesso 🎉🌟\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 1▸Clique agora no botão "RECARGAR"\n ◆Faça um depósito mínimo de DEPAMT na sua conta 1win para ativar o bot\n━━━━━━━━━━━━━━━━━━━━━━━\n◉ 2▸Uma vez confirmado o depósito na sua conta ✅\n ◆O bot será automaticamente ativado`,
    btn_deposit: '💳 Depositar',
    btn_back: '← Voltar'
};

function msg(key, lang) { return (MSGS[lang] && MSGS[lang][key]) || (MSGS.fr && MSGS.fr[key]) || key; }

function verifyPostback(req) {
    if (!POSTBACK_SECRET) return true;
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

module.exports = async function handler(req, res) {
    try {
        if (!verifyPostback(req)) {
            console.warn('[POSTBACK REG] Invalid signature, rejected.');
            return res.status(403).send('Forbidden');
        }

        const clickid = req.query.clickid || null;
        const userId1win = req.query.user_id;
        const hash = req.query.hash;
        const country = req.query.country;

        if (!userId1win) return res.status(400).send('Missing user_id');
        console.log(`[POSTBACK REG] clickid=${clickid}, user_id=${userId1win}, hash=${hash}`);

        let telegramId = clickid ? parseInt(clickid) : null;
        let userLang = 'fr';
        let lastMsgId = null;
        let wasAlreadyRegistered = false;

        if (clickid) {
            const existing = await query('SELECT * FROM users WHERE telegram_id = $1', [clickid]);
            if (existing.length > 0) {
                wasAlreadyRegistered = existing[0].is_registered;
                userLang = existing[0].language || 'fr';
                lastMsgId = existing[0].last_message_id;
                // If different 1win account OR first postback ever → treat as new registration
                if (!existing[0].one_win_user_id || existing[0].one_win_user_id !== userId1win) {
                    wasAlreadyRegistered = false;
                }
                await query(
                    'UPDATE users SET is_registered = TRUE, one_win_user_id = $1, registered_at = NOW(), updated_at = NOW() WHERE telegram_id = $2',
                    [userId1win, clickid]
                );
            } else {
                await query(
                    'INSERT INTO users (telegram_id, one_win_user_id, is_registered, created_at, updated_at) VALUES ($1, $2, TRUE, NOW(), NOW())',
                    [clickid, userId1win]
                );
            }
        } else {
            const existing = await query('SELECT * FROM users WHERE one_win_user_id = $1', [userId1win]);
            if (existing.length === 0) {
                await query(
                    'INSERT INTO users (one_win_user_id, is_registered, created_at, updated_at) VALUES ($1, TRUE, NOW(), NOW())',
                    [userId1win]
                );
            } else {
                wasAlreadyRegistered = existing[0].is_registered;
                telegramId = existing[0].telegram_id;
                userLang = existing[0].language || 'fr';
                lastMsgId = existing[0].last_message_id;
                await query(
                    'UPDATE users SET is_registered = TRUE, registered_at = NOW(), updated_at = NOW() WHERE one_win_user_id = $1',
                    [userId1win]
                );
            }
        }

        // ─── AUTO-MESSAGE: Send deposit instruction to Telegram ───
        if (telegramId && !wasAlreadyRegistered) {
            console.log(`[POSTBACK REG] Sending deposit message to Telegram ${telegramId} (lang=${userLang})`);

            // Delete last message (inscription)
            if (lastMsgId) {
                await deleteMsg(telegramId, lastMsgId);
            }

            // Build deposit message
            const depText = msg('deposit', userLang).replace(/DEPAMT/g, depositStr(userLang));
            const depUrl = `${REG_LINK}&sub1=${telegramId}`;
            const btns = [
                [{ text: msg('btn_deposit', userLang), url: depUrl }],
                [{ text: msg('btn_back', userLang), callback_data: 'back' }]
            ];

            const tgRes = await tgAPI('sendMessage', {
                chat_id: telegramId,
                text: depText,
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: btns }
            });

            // Save new last_message_id
            if (tgRes.ok && tgRes.result) {
                try {
                    await query('UPDATE users SET last_message_id = $1, updated_at = NOW() WHERE telegram_id = $2',
                        [tgRes.result.message_id, telegramId]);
                } catch (e) {}
                console.log(`[POSTBACK REG] Deposit message sent, msg_id=${tgRes.result.message_id}`);
            } else {
                console.error('[POSTBACK REG] Failed to send deposit message:', JSON.stringify(tgRes).substring(0, 200));
            }
        } else if (wasAlreadyRegistered) {
            console.log(`[POSTBACK REG] User ${telegramId || userId1win} already registered, skipping auto-message.`);
        } else {
            console.log(`[POSTBACK REG] No telegram_id found for user ${userId1win}, skipping auto-message.`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('[POSTBACK REG ERROR]', error);
        res.status(500).send('Error');
    }
};
