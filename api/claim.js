// ═══════════════════════════════════════════════════════
// ROVAS V2 - Claim (Direct to Games)
// The bot already verifies registration + deposit before
// showing the Predictions button. So claim.js just
// redirects to the games page with the user's info.
// ═══════════════════════════════════════════════════════
const crypto = require('crypto');
const { query } = require('../lib/db');
const LINK_SECRET = process.env.LINK_SECRET || process.env.ADMIN_PASSWORD || '';
const SITE_URL = 'https://newrovasbot.vercel.app';

function redirect(res, path) {
    const url = SITE_URL + path + (path.indexOf('?') !== -1 ? '&' : '?') + '_t=' + Date.now();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.redirect(302, url);
}

module.exports = async function handler(req, res) {
    try {
        const token = req.query.token;

        // No token → redirect to games without uid (public view)
        if (!token) {
            return redirect(res, '/jeux/index.html');
        }

        let decoded;
        try {
            decoded = Buffer.from(token, 'base64url').toString('utf8');
        } catch (e) {
            return redirect(res, '/jeux/index.html');
        }

        const parts = decoded.split(':');
        if (parts.length !== 3) {
            return redirect(res, '/jeux/index.html');
        }

        const [telegramId, expiresAt, sig] = parts;

        // Verify token signature
        const expectedSig = crypto.createHmac('sha256', LINK_SECRET)
            .update(`${telegramId}:${expiresAt}`)
            .digest('hex')
            .substring(0, 12);

        if (sig !== expectedSig) {
            console.warn('[CLAIM] Invalid token for user', telegramId);
            return redirect(res, '/jeux/index.html');
        }

        // Token valid → get user info and redirect to games
        let userLang = 'fr';
        try {
            const users = await query('SELECT language FROM users WHERE telegram_id = $1', [parseInt(telegramId)]);
            if (users.length > 0 && users[0].language) userLang = users[0].language;
            console.log('[CLAIM] User', telegramId, 'lang from DB:', users.length > 0 ? users[0].language : 'NOT FOUND');
        } catch (e) {
            console.warn('[CLAIM] DB lookup failed:', e.message);
        }

        const predTarget = `/jeux/index.html?uid=${telegramId}&lang=${userLang}`;
        console.log('[CLAIM] Redirecting user', telegramId, 'lang=' + userLang);
        return redirect(res, predTarget);
    } catch (error) {
        console.error('[CLAIM ERROR]', error);
        return redirect(res, '/jeux/index.html');
    }
};
