// ═══════════════════════════════════════════════════════
// ROVAS V2 - Claim (Direct to Games)
// The bot already verifies registration + deposit before
// showing the Predictions button. So claim.js just
// redirects to the games page with the user's info.
// ═══════════════════════════════════════════════════════
const crypto = require('crypto');
const { query } = require('../lib/db');
const LINK_SECRET = process.env.LINK_SECRET || process.env.ADMIN_PASSWORD || '';

function htmlRedirect(url) {
    // Cache-bust to prevent Telegram in-app browser from serving cached pages
    const bust = '_t=' + Date.now();
    const sep = url.indexOf('?') !== -1 ? '&' : '?';
    const finalUrl = url + sep + bust;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<script>window.location.replace("${finalUrl}");</script>
<meta http-equiv="refresh" content="0;url=${finalUrl}">
</head><body><p>Redirection...</p><script>window.location.replace("${finalUrl}");</script></body></html>`;
}

module.exports = async function handler(req, res) {
    try {
        const token = req.query.token;

        // No token → redirect to games without uid (public view)
        if (!token) {
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.status(200).send(htmlRedirect('/jeux/index.html'));
        }

        let decoded;
        try {
            decoded = Buffer.from(token, 'base64url').toString('utf8');
        } catch (e) {
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.status(200).send(htmlRedirect('/jeux/index.html'));
        }

        const parts = decoded.split(':');
        if (parts.length !== 3) {
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.status(200).send(htmlRedirect('/jeux/index.html'));
        }

        const [telegramId, expiresAt, sig] = parts;

        // Verify token signature
        const expectedSig = crypto.createHmac('sha256', LINK_SECRET)
            .update(`${telegramId}:${expiresAt}`)
            .digest('hex')
            .substring(0, 12);

        if (sig !== expectedSig) {
            console.warn('[CLAIM] Invalid token for user', telegramId);
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.status(200).send(htmlRedirect('/jeux/index.html'));
        }

        // Token valid → get user info and redirect to games
        let userLang = 'fr';
        try {
            const users = await query('SELECT language FROM users WHERE telegram_id = $1', [parseInt(telegramId)]);
            if (users.length > 0 && users[0].language) userLang = users[0].language;
        } catch (e) {
            console.warn('[CLAIM] DB lookup failed:', e.message);
        }

        const predTarget = `/jeux/index.html?uid=${telegramId}&lang=${userLang}`;
        console.log('[CLAIM] Redirecting user', telegramId, 'lang=' + userLang, 'to games');
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(200).send(htmlRedirect(predTarget));
    } catch (error) {
        console.error('[CLAIM ERROR]', error);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(200).send(htmlRedirect('/jeux/index.html'));
    }
};
