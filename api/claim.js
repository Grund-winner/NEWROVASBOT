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
const VALID_LANGS = ['fr','en','hi','uz','es','az','tr','ar','ru','pt'];

module.exports = async function handler(req, res) {
    try {
        const token = req.query.token;

        // No token → redirect to games without uid (public view)
        if (!token) {
            return serveRedirect(res, '/jeux/index.html', 'fr');
        }

        let decoded;
        try {
            decoded = Buffer.from(token, 'base64url').toString('utf8');
        } catch (e) {
            return serveRedirect(res, '/jeux/index.html', 'fr');
        }

        const parts = decoded.split(':');
        if (parts.length !== 3) {
            return serveRedirect(res, '/jeux/index.html', 'fr');
        }

        const [telegramId, expiresAt, sig] = parts;

        // Verify token signature
        const expectedSig = crypto.createHmac('sha256', LINK_SECRET)
            .update(`${telegramId}:${expiresAt}`)
            .digest('hex')
            .substring(0, 12);

        if (sig !== expectedSig) {
            console.warn('[CLAIM] Invalid token for user', telegramId);
            return serveRedirect(res, '/jeux/index.html', 'fr');
        }

        // Determine language: priority = URL param > DB > fallback 'fr'
        let userLang = 'fr';

        // 1) Read lang from URL params (passed by vipButtons)
        const urlLang = (req.query.lang || '').toLowerCase();
        if (urlLang && VALID_LANGS.indexOf(urlLang) !== -1) {
            userLang = urlLang;
            console.log('[CLAIM] User', telegramId, 'lang from URL param:', userLang);
        } else {
            // 2) Fallback: read from DB
            try {
                const users = await query('SELECT language FROM users WHERE telegram_id = $1', [parseInt(telegramId)]);
                if (users.length > 0 && users[0].language) {
                    const dbLang = users[0].language.toLowerCase();
                    if (VALID_LANGS.indexOf(dbLang) !== -1) {
                        userLang = dbLang;
                    }
                }
                console.log('[CLAIM] User', telegramId, 'lang from DB:', users.length > 0 ? users[0].language : 'NOT FOUND', '→ using:', userLang);
            } catch (e) {
                console.warn('[CLAIM] DB lookup failed:', e.message);
            }
        }

        const predTarget = `/jeux/index.html?uid=${telegramId}&lang=${userLang}`;
        console.log('[CLAIM] Redirecting user', telegramId, 'lang=' + userLang);
        return serveRedirect(res, predTarget, userLang);
    } catch (error) {
        console.error('[CLAIM ERROR]', error);
        return serveRedirect(res, '/jeux/index.html', 'fr');
    }
};

// Serve an HTML page that stores language in storage BEFORE navigating
// This avoids WebView caching issues with 302 redirects
function serveRedirect(res, targetPath, lang) {
    const fullUrl = SITE_URL + targetPath + '&_t=' + Date.now();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
</head><body><script>
try{sessionStorage.setItem('rovas_lang','${lang}');localStorage.setItem('rovas_lang','${lang}');}catch(e){}
window.location.replace('${fullUrl}');
</script></body></html>`;
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
}
