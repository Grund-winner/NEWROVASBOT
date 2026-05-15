// ═══════════════════════════════════════════════════════════════════
// ROVAS V2 - Webhook Telegram Bot (Multilingue 10 langues)
// Route : POST /api/webhook
// Un seul message a la fois - editMessageText
// ═══════════════════════════════════════════════════════════════════
const crypto = require('crypto');
const { query } = require('../lib/db');

const BOT_TOKEN = process.env.BOT_TOKEN;
const REG_LINK = process.env.REG_LINK || 'https://one-vv343.com/casino?p=ufjv';
const BASE_URL = process.env.BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://newrovasbot.vercel.app');
const PRODUCTION_URL = 'https://newrovasbot.vercel.app';
const MIN_DEPOSIT = parseFloat(process.env.MIN_DEPOSIT) || 5;
const PROMO = process.env.PROMO_CODE || 'ROVAS';
const CHANNEL = process.env.CHANNEL || '@ROVASOFFICIEL';
const LINK_SECRET = process.env.ADMIN_PASSWORD || 'rovasadmin2024';

// ─── LANGUES ───
const LANGS = {
    fr: { flag: '\uD83C\uDDEB\uD83C\uDDF7', rate: 666.67, symbol: 'FCFA', native: 'Francais' },
    en: { flag: '\uD83C\uDDEC\uD83C\uDDE7', rate: 1, symbol: '$', native: 'English' },
    hi: { flag: '\uD83C\uDDEE\uD83C\uDDF3', rate: 83.5, symbol: '\u20B9', native: 'Hindi' },
    uz: { flag: '\uD83C\uDDFA\uD83C\uDDFF', rate: 12650, symbol: "so'm", native: "O'zbek" },
    es: { flag: '\uD83C\uDDEA\uD83C\uDDF8', rate: 0.92, symbol: '\u20AC', native: 'Espanol' },
    az: { flag: '\uD83C\uDDE6\uD83C\uDDFF', rate: 1.7, symbol: '\u20BC', native: 'Az\u0259rbaycan' },
    tr: { flag: '\uD83C\uDDF9\uD83C\uDDF7', rate: 34, symbol: '\u20BA', native: 'Turkce' },
    ar: { flag: '\uD83C\uDDF8\uD83C\uDDE6', rate: 3.75, symbol: '\u0631.\u0633', native: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' },
    ru: { flag: '\uD83C\uDDF7\uD83C\uDDFA', rate: 91.5, symbol: '\u20BD', native: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439' },
    pt: { flag: '\uD83C\uDDF5\uD83C\uDDF9', rate: 5.5, symbol: 'R$', native: 'Portugues' }
};

function depositStr(lang) {
    const l = LANGS[lang] || LANGS.fr;
    const local = Math.round(MIN_DEPOSIT * l.rate);
    if (lang === 'en') return `<b>$${MIN_DEPOSIT}</b>`;
    return `<b>${MIN_DEPOSIT}$ (${local} ${l.symbol})</b>`;
}

function depositStrPlain(lang) {
    const l = LANGS[lang] || LANGS.fr;
    const local = Math.round(MIN_DEPOSIT * l.rate);
    if (lang === 'en') return `$${MIN_DEPOSIT}`;
    return `${MIN_DEPOSIT}$ (${local} ${l.symbol})`;
}

// ─── TEXTES i18n ───
const T = {};
function t(key, lang) { return (T[lang] && T[lang][key]) || (T.fr && T.fr[key]) || key; }

T.fr = {
    select_language: `\uD83C\uDF0D Choisissez votre langue\nSelect your language`,
    channel_required: `\uD83D\uDCAC Pour continuer, rejoignez notre canal officiel.\n\nC'est la pour rester informe des dernieres predictions et ne rien manquer.`,
    welcome: `<b>\u2728 Bienvenue chez ROVAS\u2728</b>\n\nVotre assistant predictions de confiance pour maximiser vos gains.\n\n<b>\uD83D\uDD39</b> Creez votre compte avec le code <b>${PROMO}</b>\n<b>\uD83D\uDD39</b> Effectuez un depot de ${depositStr('fr')}\n<b>\uD83D\uDD39</b> Accedez aux predictions exclusives`,
    instructions: `<b>\uD83D\uDCD6 Guide rapide</b>\n\nSuivez ces 3 etapes pour commencer :\n\n<b>1.</b> <b>Creez votre compte</b> sur la plateforme avec le code promo <b>${PROMO}</b>\n<b>2.</b> <b>Alimentez votre compte</b> d'un minimum de ${depositStr('fr')}\n<b>3.</b> <b>Accedez aux predictions</b> en temps reel et commencez a gagner`,
    register: `\uD83D\uDD39Pour profiter pleinement du bot, suivez ces 3 etapes : \u2193\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 1\u27A6Appuyez sur le bouton <b>INSCRIPTION</b> pour creer un nouveau compte\n\u25C6 Si vous avez deja un compte, deconnectez-vous puis creez-en un nouveau\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 2\u27A6Utiliser le code promo <b>${PROMO}</b> lors de l'inscription\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 3\u27A6\uD83D\uDCED Une notification de confirmation vous sera envoyee automatiquement apres l'inscription.\u2705\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2`,
    deposit: `\u2742 F\u00e9licitations ! Votre inscription a \u00e9t\u00e9 effectu\u00e9e avec succ\u00e8s \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Cliquez maintenant sur le bouton \u00ab RECHARGER \u00bb\n\u25c6Effectuez un d\u00e9p\u00f4t minimum de ${depositStr('fr')} sur votre compte 1win afin d\u2019activer le bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Une fois le d\u00e9p\u00f4t confirm\u00e9 sur votre compte \u2705\n\u25c6Le bot sera automatiquement activ\u00e9 et vous pourrez acc\u00e9der aux diff\u00e9rents PREDICTORS`,
    deposit_small: `\u2742 F\u00e9licitations ! Votre inscription a \u00e9t\u00e9 effectu\u00e9e avec succ\u00e8s \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Cliquez maintenant sur le bouton \u00ab RECHARGER \u00bb\n\u25c6Effectuez un d\u00e9p\u00f4t minimum de ${depositStr('fr')} sur votre compte 1win afin d\u2019activer le bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Une fois le d\u00e9p\u00f4t confirm\u00e9 sur votre compte \u2705\n\u25c6Le bot sera automatiquement activ\u00e9 et vous pourrez acc\u00e9der aux diff\u00e9rents PREDICTORS`,
    not_registered: `<b>\uD83D\uDD0E Aucune inscription trouvee</b>\n\nVerifiez que vous avez bien utilise le code promo <b>${PROMO}</b> lors de votre inscription.\n\nLaissez quelques minutes puis reessayez.`,
    access_granted: `<b>\uD83C\uDFC6 Acces VIP Debloque !</b>\n\nFeclicitations ! Vos predictions exclusives sont maintenant disponibles.`,
    already_registered: `<b>\uD83D\uDCB0 Lier votre compte</b>\n\nEnvoyez votre ID 1Win dans le chat pour associer votre compte.\n\n\u2139\uFE0F Vous devez etre inscrit avec le code <b>${PROMO}</b>.`,
    already_registered_success: `<b>\u2705 Compte associe avec succes !</b>\n\nVotre ID 1Win est desormais lie a votre profil Telegram.`,
    already_registered_already: `Cet ID est deja associe a un autre compte.`,
    already_registered_notfound: `<b>\u274C ID introuvable</b>\n\nCreez d'abord un compte avec le code promo <b>${PROMO}</b>.`,
    language_changed: `\u2705 Langue mise a jour`,
    register_first: `Veuillez d'abord vous inscrire.`,
    btn_register: `\uD83C\uDAF1 Inscription`,
    btn_instructions: `\uD83D\uDCD6 Guide`,
    btn_already: `\uD83D\uDCB0 Deja inscrit`,
    btn_predictions: `\uD83C\uDFAF Predictions`,
    btn_back: `\u2190 Retour`,
    btn_register_now: `\u27A1\uFE0F Creer mon compte`,
    btn_deposit: `\uD83D\uDCB3 Alimenter`,
    btn_join: `\uD83D\uDCAC Rejoindre le canal`,
    btn_language: `\uD83C\uDF10 Langue`,
    btn_channel: `\u2705 J'ai rejoint`,
    btn_change_language: `\uD83C\uDF10 Modifier la langue`,
    deposit_insufficient_no: `\u2742 F\u00e9licitations ! Votre inscription a \u00e9t\u00e9 effectu\u00e9e avec succ\u00e8s \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Cliquez maintenant sur le bouton \u00ab RECHARGER \u00bb\n\u25c6Effectuez un d\u00e9p\u00f4t minimum de ${depositStr('fr')} sur votre compte 1win afin d\u2019activer le bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Une fois le d\u00e9p\u00f4t confirm\u00e9 sur votre compte \u2705\n\u25c6Le bot sera automatiquement activ\u00e9 et vous pourrez acc\u00e9der aux diff\u00e9rents PREDICTORS`,
    missing: `<b>\uD83D\uDCE1 Il manque <b>{remaining}$</b> ({local})</b>\n\nCompletez votre depot pour debloquer l'acces.`,
    channel_required_alert: `Rejoignez d'abord le canal officiel.`,
    menu_text: `Menu`
};

T.en = {
    select_language: `\uD83C\uDF0D Select your language\nChoisissez votre langue`,
    channel_required: `\uD83D\uDCAC Join our official channel to continue.\n\nStay updated with the latest predictions and never miss an opportunity.`,
    welcome: `<b>\u2728 Welcome to ROVAS\u2728</b>\n\nYour trusted prediction assistant to maximize your winnings.\n\n<b>\uD83D\uDD39</b> Create your account with code <b>${PROMO}</b>\n<b>\uD83D\uDD39</b> Deposit a minimum of ${depositStr('en')}\n<b>\uD83D\uDD39</b> Access exclusive predictions`,
    instructions: `<b>\uD83D\uDCD6 Quick Guide</b>\n\nFollow these 3 steps to get started:\n\n<b>1.</b> <b>Create your account</b> on the platform with promo code <b>${PROMO}</b>\n<b>2.</b> <b>Fund your account</b> with at least ${depositStr('en')}\n<b>3.</b> <b>Access live predictions</b> and start winning`,
    register: `\uD83D\uDD39To fully enjoy the bot, follow these 3 steps: \u2193\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 1\u27A6Click the <b>REGISTER</b> button to create a new account\n\u25C6 If you already have an account, log out and create a new one\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 2\u27A6Use the promo code <b>${PROMO}</b> during registration\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 3\u27A6\uD83D\uDCED A confirmation notification will be sent automatically after registration.\u2705\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2`,
    deposit: `\u2742 Congratulations! Your registration has been completed successfully \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Click now on the \u201cRECHARGE\u201d button\n\u25c6Make a minimum deposit of ${depositStr('en')} on your 1win account to activate the bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Once the deposit is confirmed on your account \u2705\n\u25c6The bot will be automatically activated and you will be able to access the various PREDICTORS`,
    deposit_small: `\u2742 Congratulations! Your registration has been completed successfully \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Click now on the \u201cRECHARGE\u201d button\n\u25c6Make a minimum deposit of ${depositStr('en')} on your 1win account to activate the bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Once the deposit is confirmed on your account \u2705\n\u25c6The bot will be automatically activated and you will be able to access the various PREDICTORS`,
    not_registered: `<b>\uD83D\uDD0E No registration found</b>\n\nMake sure you used promo code <b>${PROMO}</b> when signing up.\n\nWait a few minutes and try again.`,
    access_granted: `<b>\uD83C\uDFC6 VIP Access Unlocked!</b>\n\nCongratulations! Your exclusive predictions are now available.`,
    already_registered: `<b>\uD83D\uDCB0 Link your account</b>\n\nSend your 1Win ID in the chat to link your account.\n\n\u2139\uFE0F You must be registered with code <b>${PROMO}</b>.`,
    already_registered_success: `<b>\u2705 Account linked successfully!</b>\n\nYour 1Win ID is now connected to your Telegram profile.`,
    already_registered_already: `This ID is already linked to another account.`,
    already_registered_notfound: `<b>\u274C ID not found</b>\n\nCreate an account first with promo code <b>${PROMO}</b>.`,
    language_changed: `\u2705 Language updated`,
    register_first: `Please register first.`,
    btn_register: `\uD83C\uDAF1 Register`,
    btn_instructions: `\uD83D\uDCD6 Guide`,
    btn_already: `\uD83D\uDCB0 Already registered`,
    btn_predictions: `\uD83C\uDFAF Predictions`,
    btn_back: `\u2190 Back`,
    btn_register_now: `\u27A1\uFE0F Create account`,
    btn_deposit: `\uD83D\uDCB3 Deposit`,
    btn_join: `\uD83D\uDCAC Join channel`,
    btn_language: `\uD83C\uDF10 Language`,
    btn_channel: `\u2705 I joined`,
    btn_change_language: `\uD83C\uDF10 Change language`,
    deposit_insufficient_no: `\u2742 Congratulations! Your registration has been completed successfully \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Click now on the \u201cRECHARGE\u201d button\n\u25c6Make a minimum deposit of ${depositStr('en')} on your 1win account to activate the bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Once the deposit is confirmed on your account \u2705\n\u25c6The bot will be automatically activated and you will be able to access the various PREDICTORS`,
    missing: `<b>\uD83D\uDCE1 You need <b>{remaining}$</b> more ({local})</b>\n\nComplete your deposit to unlock access.`,
    channel_required_alert: `Join the official channel first.`,
    menu_text: `Menu`
};

T.hi = {
    select_language: `\uD83C\uDF0D \u0905\u092A\u0928\u0940 \u092D\u093E\u0937\u093E \u091A\u0941\u0928\u0947\u0902\nSelect your language`,
    channel_required: `\uD83D\uDCAC \u091C\u093E\u0930\u0940 \u0930\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0939\u092E\u093E\u0930\u0947 \u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u091A\u0948\u0928\u0932 \u0938\u0947 \u091C\u0941\u0921\u093C\u0947\u0902\u0964\n\n\u0924\u093E\u091C\u093C\u093E \u092A\u094D\u0930\u0947\u0921\u093F\u0915\u094D\u0936\u0928 \u0914\u0930 \u0905\u0935\u0938\u0930\u094B\u0902 \u0938\u0947 \u0905\u092A\u0921\u0947\u091F \u0930\u0939\u0947\u0902\u0964`,
    welcome: `<b>\u2728 ROVAS \u092E\u0947\u0902 \u0906\u092A\u0915\u093E \u0938\u094D\u0935\u093E\u0917\u0924 \u0939\u0948\u2728</b>\n\n\u0906\u092A\u0915\u0940 \u0915\u092E\u093E\u0908 \u092C\u0922\u093C\u093E\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0906\u092A\u0915\u093E \u0935\u093F\u0936\u094D\u0935\u0938\u0928\u0940\u092F \u092A\u094D\u0930\u0947\u0921\u093F\u0915\u094D\u0936\u0928 \u0938\u0939\u093E\u092F\u0915\u0964\n\n<b>\uD83D\uDD39</b> \u0915\u094B\u0921 <b>${PROMO}</b> \u0915\u0947 \u0938\u093E\u0925 \u0905\u092A\u0928\u093E \u0916\u093E\u0924\u093E \u092C\u0928\u093E\u090F\u0902\n<b>\uD83D\uDD39</b> \u0928\u094D\u092F\u0942\u0928\u0924\u092E ${depositStr('hi')} \u091C\u092E\u093E \u0915\u0930\u0947\u0902\n<b>\uD83D\uDD39</b> \u0935\u093F\u0936\u0947\u0937 \u092A\u094D\u0930\u0947\u0921\u093F\u0915\u094D\u0936\u0928 \u0924\u0915 \u092A\u0939\u0941\u0901\u091A\u0947\u0902`,
    instructions: `<b>\uD83D\uDCD6 \u0924\u094D\u0935\u0930\u093F\u0924 \u0917\u093E\u0907\u0921</b>\n\n\u0936\u0941\u0930\u0942 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0907\u0928 3 \u091A\u0930\u0923\u094B\u0902 \u0915\u093E \u092A\u093E\u0932\u0928 \u0915\u0930\u0947\u0902:\n\n<b>1.</b> <b>\u092A\u094D\u0930\u092E\u094B \u0915\u094B\u0921 <b>${PROMO}</b> \u0915\u0947 \u0938\u093E\u0925 \u092A\u094D\u0932\u0947\u091F\u092B\u0949\u0930\u094D\u092E \u092A\u0930 \u0905\u092A\u0928\u093E \u0916\u093E\u0924\u093E \u092C\u0928\u093E\u090F\u0902</b>\n<b>2.</b> <b>\u0928\u094D\u092F\u0942\u0928\u0924\u092E ${depositStr('hi')} \u0905\u092A\u0928\u0947 \u0916\u093E\u0924\u0947 \u092E\u0947\u0902 \u091C\u092E\u093E \u0915\u0930\u0947\u0902</b>\n<b>3.</b> <b>\u0932\u093E\u0907\u0935 \u092A\u094D\u0930\u0947\u0921\u093F\u0915\u094D\u0936\u0928 \u0924\u0915 \u092A\u0939\u0941\u0901\u091A\u0947\u0902</b> \u0914\u0930 \u091C\u0940\u0924\u0928\u093E \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902`,
    register: `\uD83D\uDD39\u092C\u0949\u091F \u0915\u093E \u092A\u0942\u0930\u093E \u0932\u093E\u092D \u0909\u0920\u093E\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F, \u0907\u0928 3 \u091A\u0930\u0923\u094B\u0902 \u0915\u093E \u092A\u093E\u0932\u0928 \u0915\u0930\u0947\u0902: \u2193\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 1\u27A6\u0928\u092F\u093E \u0916\u093E\u0924\u093E \u092C\u0928\u093E\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F <b>\u092A\u0902\u091C\u0940\u0915\u0930\u0923</b> \u092C\u091F\u0928 \u0926\u092C\u093E\u090F\u0902\n\u25C6 \u092F\u0926\u093F \u0906\u092A\u0915\u093E \u092A\u0939\u0932\u0947 \u0938\u0947 \u0916\u093E\u0924\u093E \u0939\u0948, \u0932\u0949\u0917 \u0906\u0909\u091F \u0915\u0930\u0947\u0902 \u092B\u093F\u0930 \u0928\u092F\u093E \u092C\u0928\u093E\u090F\u0902\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 2\u27A6\u092A\u0902\u091C\u0940\u0915\u0930\u0923 \u0915\u0947 \u0926\u094C\u0930\u093E\u0928 \u092A\u094D\u0930\u094B\u092E\u094B \u0915\u094B\u0921 <b>${PROMO}</b> \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0947\u0902\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 3\u27A6\uD83D\uDCED \u092A\u0902\u091C\u0940\u0915\u0930\u0923 \u0915\u0947 \u092C\u093E\u0926 \u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u0930\u0942\u092A \u0938\u0947 \u092A\u0941\u0937\u094D\u091F\u093F \u0905\u0927\u093F\u0938\u0942\u091A\u0928\u093E \u092D\u0947\u091C\u0940 \u091C\u093E\u090F\u0917\u0940\u0964\u2705\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2`,
    deposit: `\u2742 \u092c\u0927\u093e\u0908! \u0906\u092a\u0915\u093e \u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0938\u092b\u0932\u0924\u093e\u092a\u0942\u0930\u094d\u0935\u0915 \u092a\u0942\u0930\u093e \u0939\u094b \u0917\u092f\u093e \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u0905\u092c \u201c\u0930\u093f\u091a\u093e\u0930\u094d\u091c\u201d \u092c\u091f\u0928 \u092a\u0930 \u0915\u094d\u0932\u093f\u0915 \u0915\u0930\u0947\u0902\n\u25c6\u092c\u0949\u091f \u0915\u094b \u0938\u0915\u094d\u0930\u093f\u092f \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0905\u092a\u0928\u0947 1win \u0916\u093e\u0924\u0947 \u092a\u0930 \u0928\u094d\u092f\u0942\u0928\u0924\u092e ${depositStr('hi')} \u091c\u092e\u093e \u0915\u0930\u0947\u0902\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6\u090f\u0915 \u092c\u093e\u0930 \u091c\u092e\u093e \u0906\u092a\u0915\u0947 \u0916\u093e\u0924\u0947 \u092a\u0930 \u092a\u0941\u0937\u094d\u091f\u093f \u0939\u094b \u091c\u093e\u0928\u0947 \u092a\u0930 \u2705\n\u25c6\u092c\u0949\u091f \u0938\u094d\u0935\u091a\u093e\u0932\u093f\u0924 \u0930\u0942\u092a \u0938\u0947 \u0938\u0915\u094d\u0930\u093f\u092f \u0939\u094b \u091c\u093e\u090f\u0917\u093e \u0914\u0930 \u0906\u092a \u0935\u093f\u092d\u093f\u0928\u094d\u0928 PREDICTORS \u0924\u0915 \u092a\u0939\u0941\u0901\u091a \u0938\u0915\u0947\u0902\u0917\u0947`,
    deposit_small: `\u2742 \u092c\u0927\u093e\u0908! \u0906\u092a\u0915\u093e \u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0938\u092b\u0932\u0924\u093e\u092a\u0942\u0930\u094d\u0935\u0915 \u092a\u0942\u0930\u093e \u0939\u094b \u0917\u092f\u093e \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u0905\u092c \u201c\u0930\u093f\u091a\u093e\u0930\u094d\u091c\u201d \u092c\u091f\u0928 \u092a\u0930 \u0915\u094d\u0932\u093f\u0915 \u0915\u0930\u0947\u0902\n\u25c6\u092c\u0949\u091f \u0915\u094b \u0938\u0915\u094d\u0930\u093f\u092f \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0905\u092a\u0928\u0947 1win \u0916\u093e\u0924\u0947 \u092a\u0930 \u0928\u094d\u092f\u0942\u0928\u0924\u092e ${depositStr('hi')} \u091c\u092e\u093e \u0915\u0930\u0947\u0902\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6\u090f\u0915 \u092c\u093e\u0930 \u091c\u092e\u093e \u0906\u092a\u0915\u0947 \u0916\u093e\u0924\u0947 \u092a\u0930 \u092a\u0941\u0937\u094d\u091f\u093f \u0939\u094b \u091c\u093e\u0928\u0947 \u092a\u0930 \u2705\n\u25c6\u092c\u0949\u091f \u0938\u094d\u0935\u091a\u093e\u0932\u093f\u0924 \u0930\u0942\u092a \u0938\u0947 \u0938\u0915\u094d\u0930\u093f\u092f \u0939\u094b \u091c\u093e\u090f\u0917\u093e \u0914\u0930 \u0906\u092a \u0935\u093f\u092d\u093f\u0928\u094d\u0928 PREDICTORS \u0924\u0915 \u092a\u0939\u0941\u0901\u091a \u0938\u0915\u0947\u0902\u0917\u0947`,
    not_registered: `<b>\uD83D\uDD0E \u0915\u094B\u0908 \u092A\u0902\u091C\u0940\u0915\u0930\u0923 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u093E</b>\n\n\u0938\u0941\u0928\u093F\u0936\u094D\u091A\u093F\u0924 \u0915\u0930\u0947\u0902 \u0915\u093F \u0906\u092A\u0928\u0947 \u092A\u0902\u091C\u0940\u0915\u0930\u0923 \u0915\u0947 \u0938\u092E\u092F \u092A\u094D\u0930\u092E\u094B \u0915\u094B\u0921 <b>${PROMO}</b> \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u093F\u092F\u093E \u0939\u0948\u0964\n\n\u0915\u0941\u091B \u092E\u093F\u0928\u091F \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u0947\u0902 \u0914\u0930 \u092A\u0941\u0928\u0903 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u0930\u0947\u0902\u0964`,
    access_granted: `<b>\uD83C\uDFC6 VIP \u090F\u0915\u094D\u0938\u0947\u0938 \u0905\u0928\u0932\u0949\u0915!</b>\n\n\u092C\u0927\u093E\u0908 \u0939\u094B! \u0906\u092A\u0915\u0947 \u0935\u093F\u0936\u0947\u0937 \u092A\u094D\u0930\u0947\u0921\u093F\u0915\u094D\u0936\u0928 \u0905\u092C \u0909\u092A\u0932\u092C\u094D\u0927 \u0939\u0948\u0902\u0964`,
    already_registered: `<b>\uD83D\uDCB0 \u0905\u092A\u0928\u093E \u0916\u093E\u0924\u093E \u0932\u093F\u0902\u0915 \u0915\u0930\u0947\u0902</b>\n\n\u0916\u093E\u0924\u093E \u0932\u093F\u0902\u0915 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u091A\u0948\u091F \u092E\u0947\u0902 \u0905\u092A\u0928\u093E 1Win ID \u092D\u0947\u091C\u0947\u0902\u0964\n\n\u2139\uFE0F \u0906\u092A\u0915\u094B \u0915\u094B\u0921 <b>${PROMO}</b> \u0938\u0947 \u092A\u0902\u091C\u0940\u0915\u0943\u0924 \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F\u0964`,
    already_registered_success: `<b>\u2705 \u0916\u093E\u0924\u093E \u0938\u092B\u0932\u0924\u093E\u092A\u0942\u0930\u094D\u0935\u0915 \u0932\u093F\u0902\u0915 \u0939\u094B \u0917\u092F\u093E!</b>\n\n\u0906\u092A\u0915\u093E 1Win ID \u0905\u092C \u0906\u092A\u0915\u0947 Telegram \u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932 \u0938\u0947 \u091C\u0941\u0921\u093C \u0917\u092F\u093E \u0939\u0948\u0964`,
    already_registered_already: `\u092F\u0939 ID \u092A\u0939\u0932\u0947 \u0938\u0947 \u0915\u093F\u0938\u0940 \u0926\u0942\u0938\u0930\u0947 \u0916\u093E\u0924\u0947 \u0938\u0947 \u0932\u093F\u0902\u0915 \u0939\u0948\u0964`,
    already_registered_notfound: `<b>\u274C ID \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u093E</b>\n\n\u092A\u0939\u0932\u0947 \u092A\u094D\u0930\u092E\u094B \u0915\u094B\u0921 <b>${PROMO}</b> \u0938\u0947 \u090F\u0915 \u0916\u093E\u0924\u093E \u092C\u0928\u093E\u090F\u0902\u0964`,
    language_changed: `\u2705 \u092D\u093E\u0937\u093E \u0905\u092A\u0921\u0947\u091F \u0915\u0940 \u0917\u0908`,
    register_first: `\u0915\u0943\u092A\u092F\u093E \u092A\u0939\u0932\u0947 \u092A\u0902\u091C\u0940\u0915\u0930\u0923 \u0915\u0930\u0947\u0902\u0964`,
    btn_register: `\uD83C\uDAF1 \u092A\u0902\u091C\u0940\u0915\u0930\u0923`,
    btn_instructions: `\uD83D\uDCD6 \u0917\u093E\u0907\u0921`,
    btn_already: `\uD83D\uDCB0 \u092A\u0939\u0932\u0947 \u0938\u0947 \u092A\u0902\u091C\u0940\u0915\u0943\u0924`,
    btn_predictions: `\uD83C\uDFAF \u092A\u094D\u0930\u0947\u0921\u093F\u0915\u094D\u0936\u0928`,
    btn_back: `\u2190 \u0935\u093E\u092A\u0938`,
    btn_register_now: `\u27A1\uFE0F \u0916\u093E\u0924\u093E \u092C\u0928\u093E\u090F\u0902`,
    btn_deposit: `\uD83D\uDCB3 \u091C\u092E\u093E \u0915\u0930\u0947\u0902`,
    btn_join: `\uD83D\uDCAC \u091A\u0948\u0928\u0932 \u0938\u0947 \u091C\u0941\u0921\u093C\u0947\u0902`,
    btn_language: `\uD83C\uDF0D \u092D\u093E\u0937\u093E`,
    btn_channel: `\u2705 \u091C\u0941\u0921\u093C \u0917\u092F\u093E`,
    btn_change_language: `\uD83C\uDF0D \u092D\u093E\u0937\u093E \u092C\u0926\u0932\u0947\u0902`,
    deposit_insufficient_no: `\u2742 \u092c\u0927\u093e\u0908! \u0906\u092a\u0915\u093e \u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0938\u092b\u0932\u0924\u093e\u092a\u0942\u0930\u094d\u0935\u0915 \u092a\u0942\u0930\u093e \u0939\u094b \u0917\u092f\u093e \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u0905\u092c \u201c\u0930\u093f\u091a\u093e\u0930\u094d\u091c\u201d \u092c\u091f\u0928 \u092a\u0930 \u0915\u094d\u0932\u093f\u0915 \u0915\u0930\u0947\u0902\n\u25c6\u092c\u0949\u091f \u0915\u094b \u0938\u0915\u094d\u0930\u093f\u092f \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0905\u092a\u0928\u0947 1win \u0916\u093e\u0924\u0947 \u092a\u0930 \u0928\u094d\u092f\u0942\u0928\u0924\u092e ${depositStr('hi')} \u091c\u092e\u093e \u0915\u0930\u0947\u0902\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6\u090f\u0915 \u092c\u093e\u0930 \u091c\u092e\u093e \u0906\u092a\u0915\u0947 \u0916\u093e\u0924\u0947 \u092a\u0930 \u092a\u0941\u0937\u094d\u091f\u093f \u0939\u094b \u091c\u093e\u0928\u0947 \u092a\u0930 \u2705\n\u25c6\u092c\u0949\u091f \u0938\u094d\u0935\u091a\u093e\u0932\u093f\u0924 \u0930\u0942\u092a \u0938\u0947 \u0938\u0915\u094d\u0930\u093f\u092f \u0939\u094b \u091c\u093e\u090f\u0917\u093e \u0914\u0930 \u0906\u092a \u0935\u093f\u092d\u093f\u0928\u094d\u0928 PREDICTORS \u0924\u0915 \u092a\u0939\u0941\u0901\u091a \u0938\u0915\u0947\u0902\u0917\u0947`,
    missing: `<b>\uD83D\uDCE1 \u0906\u092A\u0915\u094B <b>{remaining}$</b> ({local}) \u0914\u0930 \u091A\u093E\u0939\u093F\u090F</b>\n\n\u0905\u092A\u0928\u093E \u091C\u092E\u093E \u092A\u0942\u0930\u093E \u0915\u0930\u0947\u0902\u0964`,
    channel_required_alert: `\u092A\u0939\u0932\u0947 \u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u091A\u0948\u0928\u0932 \u0938\u0947 \u091C\u0941\u0921\u093C\u0947\u0902\u0964`,
    menu_text: `Menu`
};

T.uz = {
    select_language: `\uD83C\uDF0D Tilni tanlang\nPlease select your language`,
    channel_required: `\uD83D\uDCAC Davom etish uchun rasmiy kanalimizga qo'shiling.\n\nSo'nggi taxminlar va imkoniyatlardan xabardor bo'ling.`,
    welcome: `<b>\u2728 ROVAS ga xush kelibsiz\u2728</b>\n\nYutuqlaringizni maksimal darajada oshirish uchun ishonchli taxmin yordamchingiz.\n\n<b>\uD83D\uDD39</b> <b>${PROMO}</b> kodi bilan hisob yarating\n<b>\uD83D\uDD39</b> Kamida ${depositStr('uz')} to'ldiring\n<b>\uD83D\uDD39</b> Maxsus taxminlarga kirishingiz`,
    instructions: `<b>\uD83D\uDCD6 Tezkor yo'riqnoma</b>\n\nBoshlash uchun ushbu 3 qadamni bajaring:\n\n<b>1.</b> <b>Promo kodi <b>${PROMO}</b> bilan platformada hisob yarating</b>\n<b>2.</b> <b>Hisobingizni kamida ${depositStr('uz')} miqdorda to'ldiring</b>\n<b>3.</b> <b>Jonli taxminlarga kirishingiz</b> va yutishni boshlang`,
    register: `\uD83D\uDD39Botdan to'liq foydalanish uchun, quyidagi 3 qadamni bajaring: \u2193\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 1\u27A6Yangi hisob yaratish uchun <b>RO'YXATDAN O'TISH</b> tugmasini bosing\n\u25C6 Agar hisobingiz bo'lsa, chiqib qayta kirib yangi hisob yarating\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 2\u27A6Ro'yxatdan o'tishda promo kod <b>${PROMO}</b> dan foydalaning\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 3\u27A6\uD83D\uDCED Ro'yxatdan o'tgandan so'ng tasdiqlash xabarnomasi avtomatik yuboriladi.\u2705\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2`,
    deposit: `\u2742 Tabriklaymiz! Sizning ro'yxatingiz muvaffaqiyatli yakunlandi \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Endi \u201cTO'LDIRISH\u201d tugmasini bosing\n\u25c6Botni faollashtirish uchun 1win hisobingizga kamida ${depositStr('uz')} to'ldiring\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Hisobingizda to'lov tasdiqlangach \u2705\n\u25c6Bot avtomatik faollashadi va siz turli PREDICTORLARGA kirishingiz mumkin bo'ladi`,
    deposit_small: `\u2742 Tabriklaymiz! Sizning ro'yxatingiz muvaffaqiyatli yakunlandi \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Endi \u201cTO'LDIRISH\u201d tugmasini bosing\n\u25c6Botni faollashtirish uchun 1win hisobingizga kamida ${depositStr('uz')} to'ldiring\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Hisobingizda to'lov tasdiqlangach \u2705\n\u25c6Bot avtomatik faollashadi va siz turli PREDICTORLARGA kirishingiz mumkin bo'ladi`,
    not_registered: `<b>\uD83D\uDD0E Ro'yxat topilmadi</b>\n\nRo'yxatdan o'tayotganda promo kod <b>${PROMO}</b> ishlatganingizga ishonch hosil qiling.\n\nBir necha daqiqa kutib, qayta urinib ko'ring.`,
    access_granted: `<b>\uD83C\uDFC6 VIP kirish ochilmoqda!</b>\n\nTabriklaymiz! Maxsus taxminlaringiz endi mavjud.`,
    already_registered: `<b>\uD83D\uDCB0 Hisobni bog'lash</b>\n\nHisob bog'lash uchun chatga 1Win ID ingizni yuboring.\n\n\u2139\uFE0F Siz <b>${PROMO}</b> kodi bilan ro'yxatdan o'tgan bo'lishingiz kerak.`,
    already_registered_success: `<b>\u2705 Hisob muvaffaqiyatli bog'landi!</b>\n\n1Win ID ingiz endi Telegram profilingizga ulandi.`,
    already_registered_already: `Bu ID allaqachon boshqa hisobga bog'langan.`,
    already_registered_notfound: `<b>\u274C ID topilmadi</b>\n\nAvval promo kodi <b>${PROMO}</b> bilan hisob yarating.`,
    language_changed: `\u2705 Til yangilandi`,
    register_first: `Iltimos, avval ro'yxatdan o'ting.`,
    btn_register: `\uD83C\uDAF1 Ro'yxatdan o'tish`,
    btn_instructions: `\uD83D\uDCD6 Yo'riqnoma`,
    btn_already: `\uD83D\uDCB0 Avval ro'yxatdan`,
    btn_predictions: `\uD83C\uDFAF Taxminlar`,
    btn_back: `\u2190 Orqaga`,
    btn_register_now: `\u27A1\uFE0F Hisob yaratish`,
    btn_deposit: `\uD83D\uDCB3 To'ldirish`,
    btn_join: `\uD83D\uDCAC Kanalga qo'shilish`,
    btn_language: `\uD83C\uDF0D Til`,
    btn_channel: `\u2705 Qo'shildim`,
    btn_change_language: `\uD83C\uDF0D Tilni o'zgartirish`,
    deposit_insufficient_no: `\u2742 Tabriklaymiz! Sizning ro'yxatingiz muvaffaqiyatli yakunlandi \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Endi \u201cTO'LDIRISH\u201d tugmasini bosing\n\u25c6Botni faollashtirish uchun 1win hisobingizga kamida ${depositStr('uz')} to'ldiring\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Hisobingizda to'lov tasdiqlangach \u2705\n\u25c6Bot avtomatik faollashadi va siz turli PREDICTORLARGA kirishingiz mumkin bo'ladi`,
    missing: `<b>\uD83D\uDCE1 Sizga yana <b>{remaining}$</b> ({local}) kerak</b>\n\nTo'lovingizni to'ldiring.`,
    channel_required_alert: `Avval rasmiy kanalga qo'shiling.`,
    menu_text: `Menu`
};

T.es = {
    select_language: `\uD83C\uDF0D Seleccione su idioma\nPlease select your language`,
    channel_required: `\uD83D\uDCAC Unase a nuestro canal oficial para continuar.\n\nMantengase actualizado con las ultimas predicciones y no pierda ninguna oportunidad.`,
    welcome: `<b>\u2728 Bienvenido a ROVAS\u2728</b>\n\nSu asistente de predicciones de confianza para maximizar sus ganancias.\n\n<b>\uD83D\uDD39</b> Cree su cuenta con el codigo <b>${PROMO}</b>\n<b>\uD83D\uDD39</b> Deposite un minimo de ${depositStr('es')}\n<b>\uD83D\uDD39</b> Acceda a predicciones exclusivas`,
    instructions: `<b>\uD83D\uDCD6 Guia rapida</b>\n\nSiga estos 3 pasos para comenzar:\n\n<b>1.</b> <b>Cree su cuenta</b> en la plataforma con el codigo promo <b>${PROMO}</b>\n<b>2.</b> <b>Fonde su cuenta</b> con al menos ${depositStr('es')}\n<b>3.</b> <b>Acceda a predicciones en vivo</b> y comience a ganar`,
    register: `\uD83D\uDD39Para disfrutar plenamente del bot, siga estos 3 pasos: \u2193\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 1\u27A6Presione el boton <b>REGISTRO</b> para crear una nueva cuenta\n\u25C6 Si ya tiene una cuenta, cierre sesion y cree una nueva\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 2\u27A6Use el codigo promocional <b>${PROMO}</b> durante el registro\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 3\u27A6\uD83D\uDCED Una notificacion de confirmacion se enviara automaticamente despues del registro.\u2705\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2`,
    deposit: `\u2742 Felicidades! Su registro se ha completado con exito \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Haga clic ahora en el boton \u201cRECARGAR\u201d\n\u25c6Realice un deposito minimo de ${depositStr('es')} en su cuenta 1win para activar el bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Una vez confirmado el deposito en su cuenta \u2705\n\u25c6El bot se activara automaticamente y podra acceder a los diferentes PREDICTORS`,
    deposit_small: `\u2742 Felicidades! Su registro se ha completado con exito \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Haga clic ahora en el boton \u201cRECARGAR\u201d\n\u25c6Realice un deposito minimo de ${depositStr('es')} en su cuenta 1win para activar el bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Una vez confirmado el deposito en su cuenta \u2705\n\u25c6El bot se activara automaticamente y podra acceder a los diferentes PREDICTORS`,
    not_registered: `<b>\uD83D\uDD0E Ningun registro encontrado</b>\n\nVerifique que haya usado el codigo promo <b>${PROMO}</b> al registrarse.\n\nEspere unos minutos e intente de nuevo.`,
    access_granted: `<b>\uD83C\uDFC6 Acceso VIP Desbloqueado!</b>\n\nFelicidades! Sus predicciones exclusivas ahora estan disponibles.`,
    already_registered: `<b>\uD83D\uDCB0 Vincular su cuenta</b>\n\nEnvie su ID de 1Win en el chat para vincular su cuenta.\n\n\u2139\uFE0F Debe estar registrado con el codigo <b>${PROMO}</b>.`,
    already_registered_success: `<b>\u2705 Cuenta vinculada con exito!</b>\n\nSu ID de 1Win ahora esta conectado a su perfil de Telegram.`,
    already_registered_already: `Este ID ya esta vinculado a otra cuenta.`,
    already_registered_notfound: `<b>\u274C ID no encontrado</b>\n\nCree primero una cuenta con el codigo promo <b>${PROMO}</b>.`,
    language_changed: `\u2705 Idioma actualizado`,
    register_first: `Por favor registrese primero.`,
    btn_register: `\uD83C\uDAF1 Registro`,
    btn_instructions: `\uD83D\uDCD6 Guia`,
    btn_already: `\uD83D\uDCB0 Ya registrado`,
    btn_predictions: `\uD83C\uDFAF Predicciones`,
    btn_back: `\u2190 Volver`,
    btn_register_now: `\u27A1\uFE0F Crear cuenta`,
    btn_deposit: `\uD83D\uDCB3 Depositar`,
    btn_join: `\uD83D\uDCAC Unirse al canal`,
    btn_language: `\uD83C\uDF0D Idioma`,
    btn_channel: `\u2705 Me uni`,
    btn_change_language: `\uD83C\uDF0D Cambiar idioma`,
    deposit_insufficient_no: `\u2742 Felicidades! Su registro se ha completado con exito \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Haga clic ahora en el boton \u201cRECARGAR\u201d\n\u25c6Realice un deposito minimo de ${depositStr('es')} en su cuenta 1win para activar el bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Una vez confirmado el deposito en su cuenta \u2705\n\u25c6El bot se activara automaticamente y podra acceder a los diferentes PREDICTORS`,
    missing: `<b>\uD83D\uDCE1 Le falta <b>{remaining}$</b> ({local})</b>\n\nComplete su deposito para desbloquear el acceso.`,
    channel_required_alert: `Unase primero al canal oficial.`,
    menu_text: `Menu`
};

T.az = {
    select_language: `\uD83C\uDF0D Dilinizi secin\nPlease select your language`,
    channel_required: `\uD83D\uDCAC Davam etmek ucun resmi kanalimiza qosulun.\n\nSon proqnozlar ve imkanlar haqqinda melumat alin.`,
    welcome: `<b>\u2728 ROVAS-a xos geldiniz\u2728</b>\n\nQazanclarinizi maksimum seviyyeye cixartmaq ucun etibarli proqnoz komekciniz.\n\n<b>\uD83D\uDD39</b> <b>${PROMO}</b> kodu ila hesab yaradin\n<b>\uD83D\uDD39</b> Minimum ${depositStr('az')} daxil edin\n<b>\uD83D\uDD39</b> Xsususi proqnozlara catin`,
    instructions: `<b>\uD83D\uDCD6 Tez me'lumat</b>\n\nBaslamaq ucun bu 3 addimi izleyin:\n\n<b>1.</b> <b>Promo kod <b>${PROMO}</b> ila platformada hesab yaradin</b>\n<b>2.</b> <b>Hesabinizi minimum ${depositStr('az')} miqdarinda daxil edin</b>\n<b>3.</b> <b>Canli proqnozlara catin</b> ve qazanmaga baslayin`,
    register: `\uD83D\uDD39Botdan tam istifade etmek ucun, bu 3 addimi izleyin: \u2193\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 1\u27A6Yeni hesab yaratmaq ucun <b>QEYDIYYAT</b> duymesine basin\n\u25C6 Hesabiniz varsa, cixis edib yeni hesab yaradin\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 2\u27A6Qeydiyyat zamani promo kod <b>${PROMO}</b> istifade edin\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 3\u27A6\uD83D\uDCED Qeydiyyatdan sonra tesdiq bildirisi avtomatik gonderilecek.\u2705\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2`,
    deposit: `\u2742 T\u0259brikler! Qeydiyyat\u0131n\u0131z u\u011furla tamamland\u0131 \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u0130ndi \u201cDOLDUR\u201d d\u00fcym\u0259sin\u0259 bas\u0131n\n\u25c6Botu aktivl\u0259\u015fdirm\u0259k \u00fc\u00e7\u00fcn 1win hesab\u0131n\u0131za minimum ${depositStr('az')} daxil edin\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Hesab\u0131n\u0131zda \u00f6d\u0259ni\u015f t\u0259sdiql\u0259ndikd\u0259n sonra \u2705\n\u25c6Bot avtomatik olaraq aktivl\u0259\u015f\u0259c\u0259k v\u0259 siz m\u00fcxt\u0259lif PREDICTORLARA \u00e7atacaqs\u0131n\u0131z`,
    deposit_small: `\u2742 T\u0259brikler! Qeydiyyat\u0131n\u0131z u\u011furla tamamland\u0131 \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u0130ndi \u201cDOLDUR\u201d d\u00fcym\u0259sin\u0259 bas\u0131n\n\u25c6Botu aktivl\u0259\u015fdirm\u0259k \u00fc\u00e7\u00fcn 1win hesab\u0131n\u0131za minimum ${depositStr('az')} daxil edin\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Hesab\u0131n\u0131zda \u00f6d\u0259ni\u015f t\u0259sdiql\u0259ndikd\u0259n sonra \u2705\n\u25c6Bot avtomatik olaraq aktivl\u0259\u015f\u0259c\u0259k v\u0259 siz m\u00fcxt\u0259lif PREDICTORLARA \u00e7atacaqs\u0131n\u0131z`,
    not_registered: `<b>\uD83D\uDD0E Hece bir qeydiyyat tapilmadi</b>\n\nQeydiyyat zamani promo kod <b>${PROMO}</b> istifade etdiyinize emin olun.\n\nBir nece deqiqe gozleyin ve yeniden sinayin.`,
    access_granted: `<b>\uD83C\uDFC6 VIP giris acilib!</b>\n\nTebrikler! Xsususi proqnozlariniz indi movcuddur.`,
    already_registered: `<b>\uD83D\uDCB0 Hesabi baglamaq</b>\n\nHesab baglamaq ucun chat-a 1Win ID-nizi gonderin.\n\n\u2139\uFE0F Siz <b>${PROMO}</b> kodu ila qeydiyyatdan kecmisiniz lazimdir.`,
    already_registered_success: `<b>\u2705 Hesab ugurla baglandi!</b>\n\n1Win ID-niz indi Telegram profilinize baglanib.`,
    already_registered_already: `Bu ID artiq basqa hesaba baglanib.`,
    already_registered_notfound: `<b>\u274C ID tapilmadi</b>\n\nEvvelce promo kod <b>${PROMO}</b> ila hesab yaradin.`,
    language_changed: `\u2705 Dil yenilendi`,
    register_first: `Lutfen, evvelce qeydiyyatdan kecin.`,
    btn_register: `\uD83C\uDAF1 Qeydiyyat`,
    btn_instructions: `\uD83D\uDCD6 Me'lumat`,
    btn_already: `\uD83D\uDCB0 Artiq qeydiyyatda`,
    btn_predictions: `\uD83C\uDFAF Proqnozlar`,
    btn_back: `\u2190 Geri`,
    btn_register_now: `\u27A1\uFE0F Hesab yaratmaq`,
    btn_deposit: `\uD83D\uDCB3 Doldurmaq`,
    btn_join: `\uD83D\uDCAC Kanala qosulmaq`,
    btn_language: `\uD83C\uDF0D Dil`,
    btn_channel: `\u2705 Qosuldum`,
    btn_change_language: `\uD83C\uDF0D Dili deyisdirmek`,
    deposit_insufficient_no: `\u2742 T\u0259brikler! Qeydiyyat\u0131n\u0131z u\u011furla tamamland\u0131 \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u0130ndi \u201cDOLDUR\u201d d\u00fcym\u0259sin\u0259 bas\u0131n\n\u25c6Botu aktivl\u0259\u015fdirm\u0259k \u00fc\u00e7\u00fcn 1win hesab\u0131n\u0131za minimum ${depositStr('az')} daxil edin\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Hesab\u0131n\u0131zda \u00f6d\u0259ni\u015f t\u0259sdiql\u0259ndikd\u0259n sonra \u2705\n\u25c6Bot avtomatik olaraq aktivl\u0259\u015f\u0259c\u0259k v\u0259 siz m\u00fcxt\u0259lif PREDICTORLARA \u00e7atacaqs\u0131n\u0131z`,
    missing: `<b>\uD83D\uDCE1 Size heniz <b>{remaining}$</b> ({local}) lazimdir</b>\n\nOdenisinizi doldurun.`,
    channel_required_alert: `Evvelce resmi kanala qosulun.`,
    menu_text: `Menu`
};

T.tr = {
    select_language: `\uD83C\uDF0D Lutfen dilinizi secin\nPlease select your language`,
    channel_required: `\uD83D\uDCAC Devam etmek icin resmi kanalimiza katilin.\n\nSon tahminler ve firsatlardan haberdar olun.`,
    welcome: `<b>\u2728 ROVAS'a hos geldiniz\u2728</b>\n\nKazanclarinizi maksimize etmek icin guvenilir tahmin asistaniniz.\n\n<b>\uD83D\uDD39</b> <b>${PROMO}</b> koduyla hesabinizi olusturun\n<b>\uD83D\uDD39</b> Minimum ${depositStr('tr')} yatirin\n<b>\uD83D\uDD39</b> Ozel tahminlere erisin`,
    instructions: `<b>\uD83D\uDCD6 Hizli Rehber</b>\n\nBaslamak icin bu 3 adimi izleyin:\n\n<b>1.</b> <b>Promo kod <b>${PROMO}</b> ile platformada hesabinizi olusturun</b>\n<b>2.</b> <b>Hesabinizi en az ${depositStr('tr')} yatirarak finanse edin</b>\n<b>3.</b> <b>Canli tahminlere erisin</b> ve kazanmaya baslayin`,
    register: `\uD83D\uDD39Bottan tam olarak yararlanmak icin su 3 adimi izleyin: \u2193\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 1\u27A6Yeni hesap olusturmak icin <b>KAYIT</b> butonuna tiklayin\n\u25C6 Zaten hesabiniz varsa, cikis yapip yeni bir hesap olusturun\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 2\u27A6Kayit sirasinda promo kod <b>${PROMO}</b> kullanin\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 3\u27A6\uD83D\uDCED Kayittan sonra onay bildirimi otomatik olarak gonderilecektir.\u2705\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2`,
    deposit: `\u2742 Tebrikler! Kayd\u0131n\u0131z ba\u015far\u0131yla tamamland\u0131 \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u015eimdi \u201cYATIR\u201d butonuna t\u0131klay\u0131n\n\u25c6Botu aktif etmek i\u00e7in 1win hesab\u0131n\u0131za minimum ${depositStr('tr')} yat\u0131r\u0131n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Hesab\u0131n\u0131zda \u00f6deme onayland\u0131ktan sonra \u2705\n\u25c6Bot otomatik olarak aktif olacak ve \u00e7e\u015fitli PREDICTORLARA eri\u015febileceksiniz`,
    deposit_small: `\u2742 Tebrikler! Kayd\u0131n\u0131z ba\u015far\u0131yla tamamland\u0131 \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u015eimdi \u201cYATIR\u201d butonuna t\u0131klay\u0131n\n\u25c6Botu aktif etmek i\u00e7in 1win hesab\u0131n\u0131za minimum ${depositStr('tr')} yat\u0131r\u0131n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Hesab\u0131n\u0131zda \u00f6deme onayland\u0131ktan sonra \u2705\n\u25c6Bot otomatik olarak aktif olacak ve \u00e7e\u015fitli PREDICTORLARA eri\u015febileceksiniz`,
    not_registered: `<b>\uD83D\uDD0E Kayit bulunamadi</b>\n\nKayit sirasinda promo kod <b>${PROMO}</b> kullandiginizdan emin olun.\n\nBir kac dakika bekleyip tekrar deneyin.`,
    access_granted: `<b>\uD83C\uDFC6 VIP Erisim Acildi!</b>\n\nTebrikler! Ozel tahminleriniz simdi kullanilabilir.`,
    already_registered: `<b>\uD83D\uDCB0 Hesabinizi Baglayin</b>\n\nHesabinizi baglamak icin 1Win ID'nizi sohbete gonderin.\n\n\u2139\uFE0F <b>${PROMO}</b> koduyla kayit olmus olmaniz gerekiyor.`,
    already_registered_success: `<b>\u2705 Hesap basariyla baglandi!</b>\n\n1Win ID'niz artik Telegram profilinize baglandi.`,
    already_registered_already: `Bu ID zaten baska bir hesaba bagli.`,
    already_registered_notfound: `<b>\u274C ID bulunamadi</b>\n\nOnce promo kod <b>${PROMO}</b> ile bir hesap olusturun.`,
    language_changed: `\u2705 Dil guncellendi`,
    register_first: `Lutfen once kayit olun.`,
    btn_register: `\uD83C\uDAF1 Kayit`,
    btn_instructions: `\uD83D\uDCD6 Rehber`,
    btn_already: `\uD83D\uDCB0 Zaten kayitli`,
    btn_predictions: `\uD83C\uDFAF Tahminler`,
    btn_back: `\u2190 Geri`,
    btn_register_now: `\u27A1\uFE0F Hesap olustur`,
    btn_deposit: `\uD83D\uDCB3 Yatir`,
    btn_join: `\uD83D\uDCAC Kanala katil`,
    btn_language: `\uD83C\uDF0D Dil`,
    btn_channel: `\u2705 Katildim`,
    btn_change_language: `\uD83C\uDF0D Dili degistir`,
    deposit_insufficient_no: `\u2742 Tebrikler! Kayd\u0131n\u0131z ba\u015far\u0131yla tamamland\u0131 \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u015eimdi \u201cYATIR\u201d butonuna t\u0131klay\u0131n\n\u25c6Botu aktif etmek i\u00e7in 1win hesab\u0131n\u0131za minimum ${depositStr('tr')} yat\u0131r\u0131n\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Hesab\u0131n\u0131zda \u00f6deme onayland\u0131ktan sonra \u2705\n\u25c6Bot otomatik olarak aktif olacak ve \u00e7e\u015fitli PREDICTORLARA eri\u015febileceksiniz`,
    missing: `<b>\uD83D\uDCE1 Size heniz <b>{remaining}$</b> ({local}) eksik</b>\n\nYatiriminizi tamamlayin.`,
    channel_required_alert: `Once resmi kanala katilin.`,
    menu_text: `Menu`
};

T.ar = {
    select_language: `\uD83C\uDF0D \u0627\u062E\u062A\u0631 \u0644\u063A\u062A\u0643\nPlease select your language`,
    channel_required: `\uD83D\uDCAC \u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0642\u0646\u0627\u062A\u0646\u0627 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629.\n\n\u0627\u0628\u0642\u064E \u0645\u0637\u0644\u0639\u0627\u064B \u0628\u0623\u062D\u062F\u062B \u0627\u0644\u062A\u0648\u0642\u0639\u0627\u062A \u0648\u0644\u0627 \u062A\u0641\u0648\u0651\u062A \u0623\u064A \u0641\u0631\u0635\u0629.`,
    welcome: `<b>\u2728 \u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A ROVAS\u2728</b>\n\n\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u062A\u0648\u0642\u0639\u0627\u062A \u0627\u0644\u0645\u0648\u062B\u0648\u0642 \u0628\u0647 \u0644\u062A\u0639\u0638\u064A\u0645 \u0623\u0631\u0628\u0627\u062D\u0643.\n\n<b>\uD83D\uDD39</b> \u0623\u0646\u0634\u0626 \u062D\u0633\u0627\u0628\u0643 \u0628\u0627\u0644\u0631\u0645\u0632 <b>${PROMO}</b>\n<b>\uD83D\uDD39</b> \u0623\u0648\u062F\u0639 \u062D\u062F \u0623\u062F\u0646\u0649 ${depositStr('ar')}\n<b>\uD83D\uDD39</b> \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u062A\u0648\u0642\u0639\u0627\u062A \u0627\u0644\u062D\u0635\u0631\u064A\u0629`,
    instructions: `<b>\uD83D\uDCD6 \u062F\u0644\u064A\u0644 \u0633\u0631\u064A\u0639</b>\n\n\u0627\u062A\u0628\u0639 \u0647\u0630\u0647 \u0627\u0644\u062E\u0637\u0648\u0627\u062A \u0627\u0644\u062B\u0644\u0627\u062B \u0644\u0644\u0628\u062F\u0621:\n\n<b>1.</b> <b>\u0623\u0646\u0634\u0626 \u062D\u0633\u0627\u0628\u0643</b> \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0635\u0629 \u0628\u0631\u0645\u0632 \u0627\u0644\u062A\u0631\u0648\u064A\u062C\u0629 <b>${PROMO}</b>\n<b>2.</b> <b>\u0634\u062D\u0646 \u062D\u0633\u0627\u0628\u0643</b> \u0628\u0645\u0628\u0644\u063A ${depositStr('ar')}\n<b>3.</b> <b>\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u062A\u0648\u0642\u0639\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629</b> \u0648\u0627\u0628\u062F\u0623 \u0627\u0644\u0631\u0628\u062D`,
    register: `\uD83D\uDD39\u0644\u0644\u0627\u0633\u062A\u0645\u062A\u0627\u0639 \u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0627\u0644\u0628\u0648\u062A\u060C \u0627\u062A\u0628\u0639 \u0647\u0630\u0647 \u0627\u0644\u062E\u0637\u0648\u0627\u062A \u0627\u0644\u062B\u0644\u0627\u062B: \u2193\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 1\u27A6\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0632\u0631 <b>\u0627\u0644\u062A\u0633\u062C\u064A\u0644</b> \u0644\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628 \u062C\u062F\u064A\u062F\n\u25C6 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0644\u062F\u064A\u0643 \u062D\u0633\u0627\u0628 \u0628\u0627\u0644\u0641\u0639\u0644\u060C \u0642\u0645 \u0628\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u062B\u0645 \u0623\u0646\u0634\u0626 \u062D\u0633\u0627\u0628\u064B \u062C\u062F\u064A\u062F\u064B\u0627\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 2\u27A6\u0627\u0633\u062A\u062E\u062F\u0645 \u0631\u0645\u0632 \u0627\u0644\u062A\u0631\u0648\u064A\u062C\u0629 <b>${PROMO}</b> \u0639\u0646\u062F \u0627\u0644\u062A\u0633\u062C\u064A\u0644\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 3\u27A6\uD83D\uDCED \u0633\u064A\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0625\u0634\u0639\u0627\u0631 \u062A\u0623\u0643\u064A\u062F \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627 \u0628\u0639\u062F \u0627\u0644\u062A\u0633\u062C\u064A\u0644.\u2705\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2`,
    deposit: `\u2742 \u0645\u0628\u0627\u0631\u0643! \u062a\u0645 \u062a\u0633\u062c\u064a\u0644\u0643 \u0628\u0646\u062c\u0627\u062d \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u0627\u0636\u063a\u0637 \u0627\u0644\u0622\u0646 \u0639\u0644\u0649 \u0632\u0631 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0634\u062d\u0646\n\u25c6\u0642\u0645 \u0628\u0625\u064a\u062f\u0627\u0639 \u062d\u062f \u0623\u062f\u0646\u0649 ${depositStr('ar')} \u0641\u064a \u062d\u0633\u0627\u0628\u0643 1win \u0644\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0648\u062a\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6\u0628\u0645\u062c\u0631\u062f \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0625\u064a\u062f\u0627\u0639 \u0641\u064a \u062d\u0633\u0627\u0628\u0643 \u2705\n\u25c6\u0633\u064a\u062a\u0645 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0648\u062a \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627 \u0648\u0633\u062a\u062a\u0645\u0643\u0646 \u0645\u0646 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 PREDICTORS \u0627\u0644\u0645\u062e\u062a\u0644\u0641\u0629`,
    deposit_small: `\u2742 \u0645\u0628\u0627\u0631\u0643! \u062a\u0645 \u062a\u0633\u062c\u064a\u0644\u0643 \u0628\u0646\u062c\u0627\u062d \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u0627\u0636\u063a\u0637 \u0627\u0644\u0622\u0646 \u0639\u0644\u0649 \u0632\u0631 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0634\u062d\u0646\n\u25c6\u0642\u0645 \u0628\u0625\u064a\u062f\u0627\u0639 \u062d\u062f \u0623\u062f\u0646\u0649 ${depositStr('ar')} \u0641\u064a \u062d\u0633\u0627\u0628\u0643 1win \u0644\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0648\u062a\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6\u0628\u0645\u062c\u0631\u062f \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0625\u064a\u062f\u0627\u0639 \u0641\u064a \u062d\u0633\u0627\u0628\u0643 \u2705\n\u25c6\u0633\u064a\u062a\u0645 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0648\u062a \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627 \u0648\u0633\u062a\u062a\u0645\u0643\u0646 \u0645\u0646 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 PREDICTORS \u0627\u0644\u0645\u062e\u062a\u0644\u0641\u0629`,
    not_registered: `<b>\uD83D\uDD0E \u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u064A \u062A\u0633\u062C\u064A\u0644</b>\n\n\u062A\u0623\u0643\u062F \u0645\u0646 \u0623\u0646\u0643 \u0627\u0633\u062A\u062E\u062F\u0645\u062A \u0631\u0645\u0632 \u0627\u0644\u062A\u0631\u0648\u064A\u062C\u0629 <b>${PROMO}</b> \u0639\u0646\u062F \u0627\u0644\u062A\u0633\u062C\u064A\u0644.\n\n\u0627\u0646\u062A\u0638\u0631 \u0628\u0639\u0636 \u0627\u0644\u062F\u0642\u0627\u0626\u0642 \u062B\u0645 \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.`,
    access_granted: `<b>\uD83C\uDFC6 \u062A\u0645 \u0641\u062A\u062D \u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0645\u0645\u064A\u0632!</b>\n\n\u0645\u0628\u0631\u0648\u0643! \u062A\u0648\u0642\u0639\u0627\u062A\u0643 \u0627\u0644\u062D\u0635\u0631\u064A\u0629 \u0645\u062A\u0627\u062D\u0629 \u0627\u0644\u0622\u0646.`,
    already_registered: `<b>\uD83D\uDCB0 \u0631\u0628\u0637 \u062D\u0633\u0627\u0628\u0643</b>\n\n\u0623\u0631\u0633\u0644 \u0645\u0639\u0631\u0641 1Win \u062E\u0627\u0635\u0629 \u0641\u064A \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0644\u0631\u0628\u0637 \u062D\u0633\u0627\u0628\u0643.\n\n\u2139\uFE0F \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0645\u0633\u062C\u0644\u0627\u064B \u0628\u0627\u0644\u0631\u0645\u0632 <b>${PROMO}</b>.`,
    already_registered_success: `<b>\u2705 \u062A\u0645 \u0631\u0628\u0637 \u0627\u0644\u062D\u0633\u0627\u0628 \u0628\u0646\u062C\u0627\u062D!</b>\n\n\u0645\u0639\u0631\u0641 1Win \u062E\u0627\u0635\u0629 \u0645\u062A\u0635\u0644 \u0627\u0644\u0622\u0646 \u0628\u0645\u0644\u0641\u0643 \u0639\u0644\u0649 Telegram.`,
    already_registered_already: `\u0647\u0630\u0627 \u0627\u0644\u0645\u0639\u0631\u0641 \u0645\u0631\u0628\u0648\u0637 \u0628\u062D\u0633\u0627\u0628 \u0622\u062E\u0631 \u0628\u0627\u0644\u0641\u0639\u0644.`,
    already_registered_notfound: `<b>\u274C \u0627\u0644\u0645\u0639\u0631\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F</b>\n\n\u0623\u0646\u0634\u0626 \u062D\u0633\u0627\u0628\u0627\u064B \u0623\u0648\u0644\u0627\u064B \u0628\u0631\u0645\u0632 \u0627\u0644\u062A\u0631\u0648\u064A\u062C\u0629 <b>${PROMO}</b>.`,
    language_changed: `\u2705 \u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0644\u063A\u0629`,
    register_first: `\u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0623\u0648\u0644\u0627\u064B.`,
    btn_register: `\uD83C\uDAF1 \u062A\u0633\u062C\u064A\u0644`,
    btn_instructions: `\uD83D\uDCD6 \u062F\u0644\u064A\u0644`,
    btn_already: `\uD83D\uDCB0 \u0645\u0633\u062C\u0644 \u0645\u0633\u0628\u0642\u0627\u064B`,
    btn_predictions: `\uD83C\uDFAF \u0627\u0644\u062A\u0648\u0642\u0639\u0627\u062A`,
    btn_back: `\u2190 \u0631\u062C\u0648\u0639`,
    btn_register_now: `\u27A1\uFE0F \u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628`,
    btn_deposit: `\uD83D\uDCB3 \u0625\u064A\u062F\u0627\u0639`,
    btn_join: `\uD83D\uDCAC \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645 \u0644\u0644\u0642\u0646\u0627\u0629`,
    btn_language: `\uD83C\uDF0D \u0627\u0644\u0644\u063A\u0629`,
    btn_channel: `\u2705 \u0627\u0646\u0636\u0645\u064A\u062A`,
    btn_change_language: `\uD83C\uDF0D \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0644\u063A\u0629`,
    deposit_insufficient_no: `\u2742 \u0645\u0628\u0627\u0631\u0643! \u062a\u0645 \u062a\u0633\u062c\u064a\u0644\u0643 \u0628\u0646\u062c\u0627\u062d \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u0627\u0636\u063a\u0637 \u0627\u0644\u0622\u0646 \u0639\u0644\u0649 \u0632\u0631 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0634\u062d\u0646\n\u25c6\u0642\u0645 \u0628\u0625\u064a\u062f\u0627\u0639 \u062d\u062f \u0623\u062f\u0646\u0649 ${depositStr('ar')} \u0641\u064a \u062d\u0633\u0627\u0628\u0643 1win \u0644\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0648\u062a\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6\u0628\u0645\u062c\u0631\u062f \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0625\u064a\u062f\u0627\u0639 \u0641\u064a \u062d\u0633\u0627\u0628\u0643 \u2705\n\u25c6\u0633\u064a\u062a\u0645 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0648\u062a \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627 \u0648\u0633\u062a\u062a\u0645\u0643\u0646 \u0645\u0646 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 PREDICTORS \u0627\u0644\u0645\u062e\u062a\u0644\u0641\u0629`,
    missing: `<b>\uD83D\uDCE1 \u064A\u0646\u0642\u0635\u0643 <b>{remaining}$</b> ({local})</b>\n\n\u0623\u0643\u0645\u0644 \u0625\u064A\u062F\u0627\u0639\u0643 \u0644\u0641\u062A\u062D \u0627\u0644\u0648\u0635\u0648\u0644.`,
    channel_required_alert: `\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0627\u0644\u0642\u0646\u0627\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0623\u0648\u0644\u0627\u064B.`,
    menu_text: `Menu`
};

T.ru = {
    select_language: `\uD83C\uDF0D \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044F\u0437\u044B\u043A\nPlease select your language`,
    channel_required: `\uD83D\uDCAC \u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u0435\u0441\u044C \u043A \u043D\u0430\u0448\u0435\u043C\u0443 \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u043C\u0443 \u043A\u0430\u043D\u0430\u043B\u0443.\n\n\u0411\u0443\u0434\u044C\u0442\u0435 \u0432 \u043A\u0443\u0440\u0441\u0435 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0445 \u043F\u0440\u043E\u0433\u043D\u043E\u0437\u043E\u0432 \u0438 \u043D\u0435 \u043F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u043D\u0438 \u043E\u0434\u043D\u0443 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u044C.`,
    welcome: `<b>\u2728 \u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C \u0432 ROVAS\u2728</b>\n\n\u0412\u0430\u0448 \u043D\u0430\u0434\u0451\u0436\u043D\u044B\u0439 \u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A \u043F\u043E \u043F\u0440\u043E\u0433\u043D\u043E\u0437\u0430\u043C \u0434\u043B\u044F \u043C\u0430\u043A\u0441\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u0438 \u0432\u0430\u0448\u0438\u0445 \u0432\u044B\u0438\u0433\u0440\u044B\u0448\u0435\u0439.\n\n<b>\uD83D\uDD39</b> \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u0441 \u043A\u043E\u0434\u043E\u043C <b>${PROMO}</b>\n<b>\uD83D\uDD39</b> \u0412\u043D\u0435\u0441\u0438\u0442\u0435 \u043C\u0438\u043D\u0438\u043C\u0443\u043C ${depositStr('ru')}\n<b>\uD83D\uDD39</b> \u041F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u044D\u043A\u0441\u043A\u043B\u044E\u0437\u0438\u0432\u043D\u044B\u043C \u043F\u0440\u043E\u0433\u043D\u043E\u0437\u0430\u043C`,
    instructions: `<b>\uD83D\uDCD6 \u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E</b>\n\n\u0412\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u044D\u0442\u0438 3 \u0448\u0430\u0433\u0430 \u0434\u043B\u044F \u043D\u0430\u0447\u0430\u043B\u0430:\n\n<b>1.</b> <b>\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0430\u043A\u043A\u0430\u0443\u043D\u0442</b> \u043D\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435 \u0441 \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434\u043E\u043C <b>${PROMO}</b>\n<b>2.</b> <b>\u041F\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0430\u043A\u043A\u0430\u0443\u043D\u0442</b> \u043D\u0430 \u043C\u0438\u043D\u0438\u043C\u0443\u043C ${depositStr('ru')}\n<b>3.</b> <b>\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u043F\u0440\u043E\u0433\u043D\u043E\u0437\u0430\u043C</b> \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0438 \u043D\u0430\u0447\u043D\u0438\u0442\u0435 \u0432\u044B\u0438\u0433\u0440\u044B\u0432\u0430\u0442\u044C`,
    register: `\uD83D\uDD39\u0427\u0442\u043E\u0431\u044B \u0432 \u043F\u043E\u043B\u043D\u043E\u0439 \u043C\u0435\u0440\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u0431\u043E\u0442\u043E\u043C, \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u044D\u0442\u0438 3 \u0448\u0430\u0433\u0430: \u2193\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 1\u27A6\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043A\u043D\u043E\u043F\u043A\u0443 <b>\u0420\u0415\u0413\u0418\u0421\u0422\u0420\u0410\u0426\u0418\u042F</b>, \u0447\u0442\u043E\u0431\u044B \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\n\u25C6 \u0415\u0441\u043B\u0438 \u0443 \u0432\u0430\u0441 \u0443\u0436\u0435 \u0435\u0441\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442, \u0432\u044B\u0439\u0434\u0438\u0442\u0435 \u0438\u0437 \u043D\u0435\u0433\u043E \u0438 \u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043D\u043E\u0432\u044B\u0439\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 2\u27A6\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434 <b>${PROMO}</b> \u043F\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 3\u27A6\uD83D\uDCED \u041F\u043E\u0441\u043B\u0435 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435 \u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0438 \u0431\u0443\u0434\u0435\u0442 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438.\u2705\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2`,
    deposit: `\u2742 \u041f\u043e\u0437\u0434\u0440\u0430\u0432\u043b\u044f\u0435\u043c! \u0412\u0430\u0448\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u0443\u0441\u043f\u0435\u0448\u043d\u043e \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430 \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u0441\u0435\u0439\u0447\u0430\u0441 \u043d\u0430 \u043a\u043d\u043e\u043f\u043a\u0443 \u041f\u041e\u041f\u041e\u041b\u041d\u0418\u0422\u042c\n\u25c6\u0412\u043d\u0435\u0441\u0438\u0442\u0435 \u043c\u0438\u043d\u0438\u043c\u0443\u043c ${depositStr('ru')} \u043d\u0430 \u0441\u0432\u043e\u0439 \u0441\u0447\u0451\u0442 1win, \u0447\u0442\u043e\u0431\u044b \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0431\u043e\u0442\u0430\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6\u041f\u043e\u0441\u043b\u0435 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f \u043f\u043e\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u044f \u043d\u0430 \u0432\u0430\u0448\u0435\u043c \u0441\u0447\u0451\u0442\u0435 \u2705\n\u25c6\u0411\u043e\u0442 \u0431\u0443\u0434\u0435\u0442 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d \u0438 \u0432\u044b \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u0435 \u0434\u043e\u0441\u0442\u0443\u043f \u043a \u0440\u0430\u0437\u043b\u0438\u0447\u043d\u044b\u043c PREDICTORS`,
    deposit_small: `\u2742 \u041f\u043e\u0437\u0434\u0440\u0430\u0432\u043b\u044f\u0435\u043c! \u0412\u0430\u0448\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u0443\u0441\u043f\u0435\u0448\u043d\u043e \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430 \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u0441\u0435\u0439\u0447\u0430\u0441 \u043d\u0430 \u043a\u043d\u043e\u043f\u043a\u0443 \u041f\u041e\u041f\u041e\u041b\u041d\u0418\u0422\u042c\n\u25c6\u0412\u043d\u0435\u0441\u0438\u0442\u0435 \u043c\u0438\u043d\u0438\u043c\u0443\u043c ${depositStr('ru')} \u043d\u0430 \u0441\u0432\u043e\u0439 \u0441\u0447\u0451\u0442 1win, \u0447\u0442\u043e\u0431\u044b \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0431\u043e\u0442\u0430\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6\u041f\u043e\u0441\u043b\u0435 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f \u043f\u043e\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u044f \u043d\u0430 \u0432\u0430\u0448\u0435\u043c \u0441\u0447\u0451\u0442\u0435 \u2705\n\u25c6\u0411\u043e\u0442 \u0431\u0443\u0434\u0435\u0442 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d \u0438 \u0432\u044b \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u0435 \u0434\u043e\u0441\u0442\u0443\u043f \u043a \u0440\u0430\u0437\u043b\u0438\u0447\u043d\u044b\u043c PREDICTORS`,
    not_registered: `<b>\uD83D\uDD0E \u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430</b>\n\n\u0423\u0431\u0435\u0434\u0438\u0442\u0435\u0441\u044C, \u0447\u0442\u043E \u0432\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043B\u0438 \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434 <b>${PROMO}</b> \u043F\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438.\n\n\u041F\u043E\u0434\u043E\u0436\u0434\u0438\u0442\u0435 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043C\u0438\u043D\u0443\u0442 \u0438 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0441\u043D\u043E\u0432\u0430.`,
    access_granted: `<b>\uD83C\uDFC6 VIP \u0414\u043E\u0441\u0442\u0443\u043F \u0420\u0430\u0437\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D!</b>\n\n\u041F\u043E\u0437\u0434\u0440\u0430\u0432\u043B\u044F\u0435\u043C! \u0412\u0430\u0448\u0438 \u044D\u043A\u0441\u043A\u043B\u044E\u0437\u0438\u0432\u043D\u044B\u0435 \u043F\u0440\u043E\u0433\u043D\u043E\u0437\u044B \u0442\u0435\u043F\u0435\u0440\u044C \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B.`,
    already_registered: `<b>\uD83D\uDCB0 \u041F\u0440\u0438\u0432\u044F\u0437\u0430\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442</b>\n\n\u041E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0432\u0430\u0448 ID 1Win \u0432 \u0447\u0430\u0442 \u0434\u043B\u044F \u043F\u0440\u0438\u0432\u044F\u0437\u043A\u0438 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430.\n\n\u2139\uFE0F \u0412\u044B \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u0441 \u043A\u043E\u0434\u043E\u043C <b>${PROMO}</b>.`,
    already_registered_success: `<b>\u2705 \u0410\u043A\u043A\u0430\u0443\u043D\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D!</b>\n\n\u0412\u0430\u0448 ID 1Win \u0442\u0435\u043F\u0435\u0440\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D \u043A \u0432\u0430\u0448\u0435\u043C\u0443 \u043F\u0440\u043E\u0444\u0438\u043B\u044E Telegram.`,
    already_registered_already: `\u042D\u0442\u043E\u0442 ID \u0443\u0436\u0435 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D \u043A \u0434\u0440\u0443\u0433\u043E\u043C\u0443 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0443.`,
    already_registered_notfound: `<b>\u274C ID \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D</b>\n\n\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u0441 \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434\u043E\u043C <b>${PROMO}</b>.`,
    language_changed: `\u2705 \u042F\u0437\u044B\u043A \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D`,
    register_first: `\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u0439\u0442\u0435\u0441\u044C.`,
    btn_register: `\uD83C\uDAF1 \u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F`,
    btn_instructions: `\uD83D\uDCD6 \u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E`,
    btn_already: `\uD83D\uDCB0 \u0423\u0436\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D`,
    btn_predictions: `\uD83C\uDFAF \u041F\u0440\u043E\u0433\u043D\u043E\u0437\u044B`,
    btn_back: `\u2190 \u041D\u0430\u0437\u0430\u0434`,
    btn_register_now: `\u27A1\uFE0F \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442`,
    btn_deposit: `\uD83D\uDCB3 \u041F\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u044C`,
    btn_join: `\uD83D\uDCAC \u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u044C\u0441\u044F`,
    btn_language: `\uD83C\uDF0D \u042F\u0437\u044B\u043A`,
    btn_channel: `\u2705 \u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u043B\u0441\u044F`,
    btn_change_language: `\uD83C\uDF0D \u0421\u043C\u0435\u043D\u0438\u0442\u044C \u044F\u0437\u044B\u043A`,
    deposit_insufficient_no: `\u2742 \u041f\u043e\u0437\u0434\u0440\u0430\u0432\u043b\u044f\u0435\u043c! \u0412\u0430\u0448\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u0443\u0441\u043f\u0435\u0448\u043d\u043e \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430 \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u0441\u0435\u0439\u0447\u0430\u0441 \u043d\u0430 \u043a\u043d\u043e\u043f\u043a\u0443 \u041f\u041e\u041f\u041e\u041b\u041d\u0418\u0422\u042c\n\u25c6\u0412\u043d\u0435\u0441\u0438\u0442\u0435 \u043c\u0438\u043d\u0438\u043c\u0443\u043c ${depositStr('ru')} \u043d\u0430 \u0441\u0432\u043e\u0439 \u0441\u0447\u0451\u0442 1win, \u0447\u0442\u043e\u0431\u044b \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0431\u043e\u0442\u0430\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6\u041f\u043e\u0441\u043b\u0435 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f \u043f\u043e\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u044f \u043d\u0430 \u0432\u0430\u0448\u0435\u043c \u0441\u0447\u0451\u0442\u0435 \u2705\n\u25c6\u0411\u043e\u0442 \u0431\u0443\u0434\u0435\u0442 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d \u0438 \u0432\u044b \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u0435 \u0434\u043e\u0441\u0442\u0443\u043f \u043a \u0440\u0430\u0437\u043b\u0438\u0447\u043d\u044b\u043c PREDICTORS`,
    missing: `<b>\uD83D\uDCE1 \u0412\u0430\u043C \u043D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 <b>{remaining}$</b> ({local})</b>\n\n\u041F\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0434\u0435\u043F\u043E\u0437\u0438\u0442 \u0434\u043B\u044F \u0440\u0430\u0437\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u0430.`,
    channel_required_alert: `\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u0435\u0441\u044C \u043A \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u043C\u0443 \u043A\u0430\u043D\u0430\u043B\u0443.`,
    menu_text: `Menu`
};

T.pt = {
    select_language: `\uD83C\uDF0D Selecione seu idioma\nPlease select your language`,
    channel_required: `\uD83D\uDCAC Junte-se ao nosso canal oficial para continuar.\n\nMantenha-se atualizado com as ultimas previsoes e nao perca nenhuma oportunidade.`,
    welcome: `<b>\u2728 Bem-vindo ao ROVAS\u2728</b>\n\nSeu assistente de previsoes de confianca para maximizar seus ganhos.\n\n<b>\uD83D\uDD39</b> Crie sua conta com o codigo <b>${PROMO}</b>\n<b>\uD83D\uDD39</b> Deposite um minimo de ${depositStr('pt')}\n<b>\uD83D\uDD39</b> Acesse previsoes exclusivas`,
    instructions: `<b>\uD83D\uDCD6 Guia rapido</b>\n\nSiga estes 3 passos para comecar:\n\n<b>1.</b> <b>Crie sua conta</b> na plataforma com o codigo promocional <b>${PROMO}</b>\n<b>2.</b> <b>Financie sua conta</b> com pelo menos ${depositStr('pt')}\n<b>3.</b> <b>Acesse previsoes ao vivo</b> e comece a ganhar`,
    register: `\uD83D\uDD39Para aproveitar totalmente o bot, siga estes 3 passos: \u2193\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 1\u27A6Clique no botao <b>REGISTRO</b> para criar uma nova conta\n\u25C6 Se voce ja tem uma conta, faca logout e crie uma nova\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 2\u27A6Use o codigo promocional <b>${PROMO}</b> durante o registro\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2\n\u25C9 3\u27A6\uD83D\uDCED Uma notificacao de confirmacao sera enviada automaticamente apos o registro.\u2705\n\u27E3\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u27E2`,
    deposit: `\u2742 Parabens! Seu registro foi concluido com sucesso \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Clique agora no botao \u201cRECARREGAR\u201d\n\u25c6Faca um deposito minimo de ${depositStr('pt')} na sua conta 1win para ativar o bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Uma vez que o deposito for confirmado na sua conta \u2705\n\u25c6O bot sera ativado automaticamente e voce podera acessar os diferentes PREDICTORS`,
    deposit_small: `\u2742 Parabens! Seu registro foi concluido com sucesso \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Clique agora no botao \u201cRECARREGAR\u201d\n\u25c6Faca um deposito minimo de ${depositStr('pt')} na sua conta 1win para ativar o bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Uma vez que o deposito for confirmado na sua conta \u2705\n\u25c6O bot sera ativado automaticamente e voce podera acessar os diferentes PREDICTORS`,
    not_registered: `<b>\uD83D\uDD0E Nenhum registro encontrado</b>\n\nVerifique se voce usou o codigo promocional <b>${PROMO}</b> ao se registrar.\n\nAguarde alguns minutos e tente novamente.`,
    access_granted: `<b>\uD83C\uDFC6 Acesso VIP Desbloqueado!</b>\n\nParabens! Suas previsoes exclusivas agora estao disponiveis.`,
    already_registered: `<b>\uD83D\uDCB0 Vincular sua conta</b>\n\nEnvie seu ID 1Win no chat para vincular sua conta.\n\n\u2139\uFE0F Voce deve estar registrado com o codigo <b>${PROMO}</b>.`,
    already_registered_success: `<b>\u2705 Conta vinculada com sucesso!</b>\n\nSeu ID 1Win agora esta conectado ao seu perfil do Telegram.`,
    already_registered_already: `Este ID ja esta vinculado a outra conta.`,
    already_registered_notfound: `<b>\u274C ID nao encontrado</b>\n\nCrie primeiro uma conta com o codigo promocional <b>${PROMO}</b>.`,
    language_changed: `\u2705 Idioma atualizado`,
    register_first: `Por favor, registre-se primeiro.`,
    btn_register: `\uD83C\uDAF1 Registro`,
    btn_instructions: `\uD83D\uDCD6 Guia`,
    btn_already: `\uD83D\uDCB0 Ja registrado`,
    btn_predictions: `\uD83C\uDFAF Previsoes`,
    btn_back: `\u2190 Voltar`,
    btn_register_now: `\u27A1\uFE0F Criar conta`,
    btn_deposit: `\uD83D\uDCB3 Depositar`,
    btn_join: `\uD83D\uDCAC Entrar no canal`,
    btn_language: `\uD83C\uDF0D Idioma`,
    btn_channel: `\u2705 Entrei`,
    btn_change_language: `\uD83C\uDF0D Mudar idioma`,
    deposit_insufficient_no: `\u2742 Parabens! Seu registro foi concluido com sucesso \ud83c\udf89\ud83c\udf1f\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 1\u27a6Clique agora no botao \u201cRECARREGAR\u201d\n\u25c6Faca um deposito minimo de ${depositStr('pt')} na sua conta 1win para ativar o bot\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\u25c9 2\u27a6Uma vez que o deposito for confirmado na sua conta \u2705\n\u25c6O bot sera ativado automaticamente e voce podera acessar os diferentes PREDICTORS`,
    missing: `<b>\uD83D\uDCE1 Voce precisa de mais <b>{remaining}$</b> ({local})</b>\n\nComplete seu deposito para desbloquear o acesso.`,
    channel_required_alert: `Junte-se ao canal oficial primeiro.`,
    menu_text: `Menu`
};


// ═══════════════════════════════════════════════════════
// HELPERS - Un seul message a la fois
// ═══════════════════════════════════════════════════════

// ─── Channel photo: Telegram downloads from URL, file_id cached for speed ───
let _channelPhotoFileId = null;

async function sendPhotoMsg(chatId, userId, caption, btns, skipDelete) {
    // Delete previous message if any (skip if caller already deleted)
    if (!skipDelete) {
        const user = userId ? await getUser(userId) : null;
        if (user && user.last_message_id) {
            await deleteMsg(chatId, user.last_message_id);
        }
    }
    // Use cached file_id (fast, no re-upload)
    if (_channelPhotoFileId) {
        try {
            const res = await tgAPI('sendPhoto', {
                chat_id: chatId, photo: _channelPhotoFileId,
                caption, parse_mode: 'HTML',
                reply_markup: { inline_keyboard: btns }
            });
            if (res.ok) {
                if (userId) await saveLastMsg(userId, res.result.message_id);
                return res;
            }
        } catch (e) { console.log('[PHOTO] file_id expired, using URL'); }
    }
    // Telegram downloads image from URL
    try {
        const res = await tgAPI('sendPhoto', {
            chat_id: chatId,
            photo: PRODUCTION_URL + '/joinch.png',
            caption, parse_mode: 'HTML',
            reply_markup: { inline_keyboard: btns }
        });
        if (res.ok && res.result && res.result.photo) {
            const photos = res.result.photo;
            _channelPhotoFileId = photos[photos.length - 1].file_id;
            console.log('[PHOTO] Cached file_id:', _channelPhotoFileId.substring(0, 30) + '...');
            if (userId) await saveLastMsg(userId, res.result.message_id);
        }
        return res;
    } catch (e) {
        console.error('[PHOTO URL ERROR]', e.message);
        return { ok: false };
    }
}

// ─── MEDIA MAPPING (file_id stored on Telegram) ───
const MEDIA = {
    vip:             { type: 'photo', file_id: 'AgACAgQAAxkDAAMfagABzG1EzdBgT_-K3L5i1MUUWkkRAAKzD2sb5G4JUEjo0jbkifEFAQADAgADeQADOwQ' },
    instructions:    { type: 'photo', file_id: 'AgACAgQAAxkDAAMgagABzG4qBPJMU_zJOVJBKRkC-R5aAAK0D2sb5G4JUB6slju_dmf2AQADAgADdwADOwQ' },
    defautmenu:      { type: 'photo', file_id: 'AgACAgQAAxkDAAMeagABzGyec9iPdkvyaMsySImsQ-LOAAKyD2sb5G4JUP4WqEnvJLrqAQADAgADeQADOwQ' },
    fr_inscription:  { type: 'video', file_id: 'BAACAgQAAxkDAAMhagABzHAAAZsFzp-4sYx3WmIgwfQKdAACNxoAAuRuCVAbslZHd_gXETsE' },
    other_inscription:{ type: 'video', file_id: 'BAACAgQAAxkDAAMiagABzHBwDrbTwo-vWuaqL78Mi-Y5AAI4GgAC5G4JUHB-EFNV1RtoOwQ' },
    fr_depot:        { type: 'video', file_id: 'BAACAgQAAxkDAAMjagABzHIhTv4-L-1bvBHJa6ry4NuVAAI5GgAC5G4JULTkYixGi5ipOwQ' },
    other_depot:     { type: 'video', file_id: 'BAACAgQAAxkDAAMkagABzHMEmg_NNeAf2677A9LH01uIAAI6GgAC5G4JULSpq4igUkYCOwQ' }
};

function getMedia(mediaKey, lang) {
    if (!mediaKey) return null;
    if (mediaKey === 'vip') return MEDIA.vip;
    if (mediaKey === 'instructions') return MEDIA.instructions;
    if (mediaKey === 'register') return lang === 'fr' ? MEDIA.fr_inscription : MEDIA.other_inscription;
    if (mediaKey === 'deposit') return lang === 'fr' ? MEDIA.fr_depot : MEDIA.other_depot;
    if (mediaKey === 'default') return MEDIA.defautmenu;
    return null;
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
        console.error('tgAPI error:', e);
        return { ok: false };
    }
}

async function deleteMsg(chatId, msgId) {
    if (!msgId) return;
    try { await tgAPI('deleteMessage', { chat_id: chatId, message_id: msgId }); } catch (e) {}
}

// Edit message in place (for callback queries) - UN SEUL MESSAGE
async function editMsg(chatId, msgId, text, btns) {
    try {
        const res = await tgAPI('editMessageText', {
            chat_id: chatId, message_id: msgId,
            text, parse_mode: 'HTML',
            reply_markup: { inline_keyboard: btns }
        });
        if (res.ok) return res;
        console.log('[EDIT FAILED]', res.description);
    } catch (e) {
        console.log('[EDIT ERROR]', e.message);
    }
    // Fallback: delete and send new
    await deleteMsg(chatId, msgId);
    return await tgAPI('sendMessage', {
        chat_id: chatId, text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: btns }
    });
}

// Send new message (delete previous) - UN SEUL MESSAGE
// mediaKey: null | 'default' | 'vip' | 'instructions' | 'register' | 'deposit'
async function sendNew(chatId, userId, text, btns, mediaKey) {
    const user = userId ? await getUser(userId) : null;
    const lang = user ? (user.language || 'fr') : 'fr';
    if (user && user.last_message_id) {
        await deleteMsg(chatId, user.last_message_id);
    }
    const media = getMedia(mediaKey, lang);
    let res;
    if (media && media.type === 'photo') {
        res = await tgAPI('sendPhoto', {
            chat_id: chatId, photo: media.file_id,
            caption: text, parse_mode: 'HTML',
            reply_markup: { inline_keyboard: btns }
        });
    } else if (media && media.type === 'video') {
        res = await tgAPI('sendVideo', {
            chat_id: chatId, video: media.file_id,
            caption: text, parse_mode: 'HTML',
            reply_markup: { inline_keyboard: btns }
        });
    } else {
        res = await tgAPI('sendMessage', {
            chat_id: chatId, text,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: btns }
        });
    }
    if (res.ok && userId) {
        try {
            await query('UPDATE users SET last_message_id = $1, updated_at = NOW() WHERE telegram_id = $2',
                [res.result.message_id, userId]);
        } catch (e) {}
    }
    return res;
}

// ═══════════════════════════════════════════════════════
// DATABASE
// ═══════════════════════════════════════════════════════

async function getUser(tid) {
    const r = await query('SELECT * FROM users WHERE telegram_id = $1', [tid]);
    return r[0] || null;
}

function hasValidDeposit(user) {
    return (parseFloat(user.deposit_amount) || 0) >= MIN_DEPOSIT;
}

async function createUser(tid, username, fn, ln, referredBy) {
    const r = await query(
        'INSERT INTO users (telegram_id, username, first_name, last_name, language, created_at, updated_at, referred_by) VALUES ($1, $2, $3, $4, \'fr\', NOW(), NOW(), $5) RETURNING *',
        [tid, username, fn, ln, referredBy || null]
    );
    return r[0] || null;
}

// ─── Save last message ID ───
async function saveLastMsg(userId, msgId) {
    try {
        await query('UPDATE users SET last_message_id = $1, updated_at = NOW() WHERE telegram_id = $2', [msgId, userId]);
    } catch (e) {}
}

// Referral link: https://t.me/bot?start=ref123456789
function referralLink(tid) {
    return `https://t.me/${process.env.BOT_USERNAME || 'I1wingamepredictor_bot'}?start=ref${tid}`;
}

function generateToken(telegramId) {
    const exp = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000;
    const payload = `${telegramId}:${exp}`;
    const sig = crypto.createHmac('sha256', LINK_SECRET).update(payload).digest('hex').substring(0, 12);
    return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

function regLink(tid) { return `${REG_LINK}&sub1=${tid}`; }
function depLink(tid) { return `${REG_LINK}&sub1=${tid}`; }

// ─── Sessions ───
async function ensureSessionsTable() {
    await query(`CREATE TABLE IF NOT EXISTS bot_sessions (
        bot_type TEXT NOT NULL,
        admin_id BIGINT NOT NULL,
        action TEXT,
        step INTEGER DEFAULT 0,
        temp_data TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (bot_type, admin_id)
    )`);
    // Auto-migration: colonnes manquantes
    try { await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by BIGINT'); } catch(e) {}
}
async function setTempState(tid, action) {
    await query(`INSERT INTO bot_sessions (bot_type, admin_id, action, step, temp_data, updated_at) VALUES ('main', $1, $2, 1, '{}', NOW()) ON CONFLICT (bot_type, admin_id) DO UPDATE SET action = $2, step = 1, temp_data = '{}', updated_at = NOW()`, [tid, action]);
}
async function getTempState(tid) {
    const r = await query("SELECT * FROM bot_sessions WHERE bot_type = 'main' AND admin_id = $1", [tid]);
    return r[0] || null;
}
async function clearTempState(tid) {
    await query("DELETE FROM bot_sessions WHERE bot_type = 'main' AND admin_id = $1", [tid]);
}

// ─── Channel verification ───
async function isChannelMember(userId) {
    try {
        const res = await tgAPI('getChatMember', { chat_id: CHANNEL, user_id: userId });
        if (res.ok && res.result) {
            return ['member', 'administrator', 'creator'].includes(res.result.status);
        }
        return false;
    } catch (e) {
        console.error('[CHANNEL CHECK ERROR]', e);
        return false;
    }
}

// ═══════════════════════════════════════════════════════
// BUTTON BUILDERS
// ═══════════════════════════════════════════════════════

function langButtons() {
    const keys = Object.keys(LANGS);
    const btns = [];
    for (let i = 0; i < keys.length; i += 2) {
        const row = [];
        row.push({ text: LANGS[keys[i]].flag + ' ' + LANGS[keys[i]].native, callback_data: 'lang_' + keys[i] });
        if (keys[i + 1]) {
            row.push({ text: LANGS[keys[i + 1]].flag + ' ' + LANGS[keys[i + 1]].native, callback_data: 'lang_' + keys[i + 1] });
        }
        btns.push(row);
    }
    return btns;
}

// Count referral only after channel verification
async function countReferralIfNeeded(userId) {
    try {
        const user = await getUser(userId);
        if (!user || !user.referred_by) return;
        const existingRef = await query('SELECT id FROM referrals WHERE referred_id = $1', [userId]);
        if (existingRef.length === 0) {
            await query('INSERT INTO referrals (referrer_id, referred_id, referred_username, created_at) VALUES ($1, $2, $3, NOW())',
                [user.referred_by, userId, user.username || null]);
            console.log('[REFERRAL] User', userId, 'channel verified - referral from', user.referred_by, 'now counted');
        }
    } catch(e) { console.error('[REFERRAL COUNT ERROR]', e); }
}

function menuButtons(lang) {
    return [
        [{ text: t('btn_instructions', lang), callback_data: 'instructions' }],
        [{ text: t('btn_register', lang), callback_data: 'register' }, { text: t('btn_already', lang), callback_data: 'already_registered' }],
        [{ text: t('btn_change_language', lang), callback_data: 'change_language' }],
        [{ text: t('btn_predictions', lang), callback_data: 'predictions' }]
    ];
}

// Menu simplifie sans Guide
function simpleMenuButtons(lang) {
    return [
        [{ text: t('btn_register', lang), callback_data: 'register' }, { text: t('btn_already', lang), callback_data: 'already_registered' }],
        [{ text: t('btn_change_language', lang), callback_data: 'change_language' }],
        [{ text: t('btn_predictions', lang), callback_data: 'predictions' }]
    ];
}

function backButton(lang) {
    return [{ text: t('btn_back', lang), callback_data: 'back' }];
}

function channelButtons(lang) {
    return [
        [{ text: t('btn_join', lang), url: `https://t.me/${CHANNEL.replace('@', '')}` }],
        [{ text: t('btn_channel', lang), callback_data: 'check_channel' }]
    ];
}

function vipButtons(userId, lang) {
    const token = generateToken(userId);
    const webAppUrl = `${BASE_URL}/api/claim?token=${token}`;
    return [
        [{ text: t('btn_predictions', lang), web_app: { url: webAppUrl } }],
        [{ text: t('btn_back', lang), callback_data: 'back' }]
    ];
}

// ═══════════════════════════════════════════════════════
// SHOW FUNCTIONS
// ═══════════════════════════════════════════════════════

async function showLanguageSelection(chatId, userId, msgId) {
    if (msgId) await deleteMsg(chatId, msgId);
    console.log('[LANG] Showing language selection to', chatId, 'userId:', userId);
    await sendNew(chatId, userId, t('select_language', 'fr'), langButtons());
}

async function showChannelRequired(chatId, userId, lang, msgId) {
    if (msgId) await deleteMsg(chatId, msgId);
    const caption = t('channel_required', lang);
    const btns = channelButtons(lang);
    // Envoi avec photo joinch.png
    try {
        const result = await sendPhotoMsg(chatId, userId, caption, btns, true);
        if (result && result.ok) return;
        console.log('[CHANNEL] Photo send failed, falling back to text');
    } catch (e) {
        console.error('[CHANNEL PHOTO ERROR]', e.message);
    }
    // Fallback: text-only
    try {
        await sendNew(chatId, userId, caption, btns);
    } catch (e) {
        console.error('[CHANNEL TEXT FALLBACK ERROR]', e.message);
    }
}

async function showMainMenu(chatId, userId, lang, msgId) {
    const caption = t('menu_text', lang);
    const btns = simpleMenuButtons(lang);
    // Supprimer le message precedent
    if (msgId) await deleteMsg(chatId, msgId);
    // Envoyer le menu avec la meme photo que le canal (joinch.png)
    try {
        const result = await sendPhotoMsg(chatId, userId, caption, btns, true);
        if (result && result.ok) return;
        console.log('[MENU] Photo send failed, falling back to text');
    } catch (e) {
        console.error('[MENU PHOTO ERROR]', e.message);
    }
    // Fallback: texte uniquement
    try {
        await sendNew(chatId, userId, caption, btns);
    } catch (e) {
        console.error('[MENU TEXT FALLBACK ERROR]', e.message);
    }
}

async function sendVIPMessage(chatId, userId, lang, msgId) {
    if (msgId) await deleteMsg(chatId, msgId);
    try {
        await sendNew(chatId, userId, t('access_granted', lang), vipButtons(userId, lang));
    } catch (e) {
        console.error('[VIP MSG ERROR]', e.message);
        // Ultimate fallback: send simple message
        await tgAPI('sendMessage', {
            chat_id: chatId,
            text: t('access_granted', lang),
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: vipButtons(userId, lang) }
        });
    }
}

// ═══════════════════════════════════════════════════════
// HANDLE TEXT (1Win ID input)
// ═══════════════════════════════════════════════════════

async function handleText(chatId, from, text) {
    let session = null;
    try { session = await getTempState(from.id); } catch (e) { console.log('[HANDLE_TEXT] getTempState error:', e.message); }
    
    if (!session || session.action !== 'already_registered') return;
    
    const winId = text.trim();
    
    // Clear temp state immediately
    try { await clearTempState(from.id); } catch (e) {}
    
    const user = await getUser(from.id);
    const lang = user ? (user.language || 'fr') : 'fr';
    
    // Check if this 1Win ID exists in DB
    let found = [];
    try { found = await query('SELECT * FROM users WHERE one_win_user_id = $1', [winId]); } catch (e) {
        console.log('[HANDLE_TEXT] DB error:', e.message);
        await tgAPI('sendMessage', { chat_id: chatId, text: 'Erreur serveur. Reessayez.', parse_mode: 'HTML' });
        return;
    }
    
    if (found.length === 0) {
        // ID not found - tell user to register with ROVAS promo code
        await tgAPI('sendMessage', {
            chat_id: chatId,
            text: t('already_registered_notfound', lang),
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: t('btn_register_now', lang), url: regLink(from.id) }],
                    [{ text: t('btn_back', lang), callback_data: 'back' }]
                ]
            }
        });
        return;
    }
    
    const u = found[0];
    
    // TAKEOVER: If this 1Win ID is already linked to ANOTHER Telegram user, clear their association
    if (u.telegram_id && String(u.telegram_id) !== String(from.id)) {
        console.log('[TAKEOVER] User', from.id, 'taking over 1Win ID', winId, 'from user', u.telegram_id);
        try {
            await query(`UPDATE users SET one_win_user_id = NULL, is_registered = FALSE, is_deposited = FALSE, deposit_amount = 0, registered_at = NULL, deposited_at = NULL, updated_at = NOW() WHERE telegram_id = $1`, [u.telegram_id]);
        } catch (e) { console.log('[TAKEOVER] Error clearing old user:', e.message); }
    }
    
    // Link the 1Win ID to the CURRENT Telegram user
    try {
        const botUser = await getUser(from.id);
        await query(`UPDATE users SET one_win_user_id = $1, is_registered = TRUE, is_deposited = $2, deposit_amount = $3,
            registered_at = CASE WHEN registered_at IS NULL THEN $4 ELSE registered_at END,
            deposited_at = CASE WHEN $2 AND deposited_at IS NULL THEN $5 ELSE deposited_at END,
            referred_by = CASE WHEN referred_by IS NULL THEN $6 ELSE referred_by END,
            updated_at = NOW() WHERE telegram_id = $7`,
            [winId, !!u.is_deposited, u.deposit_amount || 0, u.registered_at, u.deposited_at,
             u.referred_by || (botUser ? botUser.referred_by : null), from.id]);
    } catch (e) {
        console.log('[HANDLE_TEXT] Error linking ID:', e.message);
        await tgAPI('sendMessage', { chat_id: chatId, text: 'Erreur serveur. Reessayez.', parse_mode: 'HTML' });
        return;
    }
    
    // Delete orphan row if it had no telegram_id
    if (!u.telegram_id) {
        try { await query('DELETE FROM users WHERE one_win_user_id = $1 AND telegram_id IS NULL', [winId]); } catch (e) {}
    }
    
    const updated = await getUser(from.id);
    
    // Show result based on deposit status
    if (updated.is_registered && hasValidDeposit(updated)) {
        // VIP access - all good
        await tgAPI('sendMessage', {
            chat_id: chatId,
            text: t('already_registered_success', lang),
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: vipButtons(from.id, lang) }
        });
    } else if (updated.is_registered) {
        // Registered but need deposit
        const dep = parseFloat(updated.deposit_amount) || 0;
        let msg;
        if (dep > 0 && dep < MIN_DEPOSIT) {
            const remaining = (MIN_DEPOSIT - dep).toFixed(2);
            const l = LANGS[lang] || LANGS.fr;
            const local = Math.ceil(parseFloat(remaining) * l.rate);
            msg = t('already_registered_success', lang) + '\n\n' +
                t('deposit_small', lang).replace('{amount}', dep.toFixed(2)) + '\n\n' +
                t('missing', lang).replace('{remaining}', remaining).replace('{local}', local + ' ' + l.symbol);
        } else {
            msg = t('already_registered_success', lang) + '\n\n' + t('deposit', lang);
        }
        await tgAPI('sendMessage', {
            chat_id: chatId, text: msg, parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: t('btn_deposit', lang), url: depLink(from.id) }],
                    [{ text: t('btn_back', lang), callback_data: 'back' }]
                ]
            }
        });
    } else {
        await tgAPI('sendMessage', {
            chat_id: chatId,
            text: t('register', lang),
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: t('btn_register_now', lang), url: regLink(from.id) }],
                    [{ text: t('btn_back', lang), callback_data: 'back' }]
                ]
            }
        });
    }
}

// ═══════════════════════════════════════════════════════
// MAIN UPDATE HANDLER
// ═══════════════════════════════════════════════════════

async function handleUpdate(update) {
    try {
        await ensureSessionsTable();
        console.log('[UPDATE] Received update:', JSON.stringify(update).substring(0, 200));

        // ─── /START ───
        if (update.message && update.message.text && update.message.text.startsWith('/start')) {
            const chatId = update.message.chat.id;
            const from = update.message.from;
            console.log('[START] User', from.id, from.username, 'started');
            // Delete user's /start message to keep single message
            await deleteMsg(chatId, update.message.message_id);

            // Extract referral from /start ref123456789
            let referredBy = null;
            const startParts = update.message.text.split(' ');
            if (startParts[1] && startParts[1].startsWith('ref')) {
                const refId = parseInt(startParts[1].substring(3));
                if (refId && refId !== from.id) {
                    referredBy = refId;
                }
            }

            let user = await getUser(from.id);
            let isNewUser = false;
            if (!user) {
                user = await createUser(from.id, from.username, from.first_name, from.last_name, referredBy);
                isNewUser = true;
            }

            // Store referral info on user but DON'T count referral yet
            // Referral is only counted after channel verification
            if (isNewUser && referredBy) {
                const referrer = await getUser(referredBy);
                if (referrer) {
                    // Save referred_by on user record, will count after channel check
                    await query('UPDATE users SET referred_by = $1 WHERE telegram_id = $2', [referredBy, from.id]);
                    console.log('[REFERRAL] User', from.id, 'started via referral from', referredBy, '- pending channel verification');
                }
            }

            // TOUJOURS montrer la selection de langue en premier (nouveau ou existant)
            console.log('[START] Showing language selection for', from.id);
            await showLanguageSelection(chatId, from.id, null);
            return;
        }

        // ─── TEXT INPUT (1Win ID) ───
        if (update.message && update.message.text && !update.message.text.startsWith('/start')) {
            // Delete user's text message to keep chat clean
            await deleteMsg(update.message.chat.id, update.message.message_id);
            return await handleText(update.message.chat.id, update.message.from, update.message.text);
        }

        // ─── CALLBACK QUERIES ───
        if (update.callback_query) {
            const q = update.callback_query;
            const chatId = q.message.chat.id;
            const userId = q.from.id;
            const data = q.data;
            const msgId = q.message.message_id;

            let user = await getUser(userId);
            if (!user) user = await createUser(userId, q.from.username, q.from.first_name, q.from.last_name);
            const lang = user.language || 'fr';

            // ─── LANGUAGE SELECTION ───
            if (data.startsWith('lang_')) {
                const newLang = data.replace('lang_', '');
                if (LANGS[newLang]) {
                    await query('UPDATE users SET language = $1, updated_at = NOW() WHERE telegram_id = $2', [newLang, userId]);
                    user.language = newLang;
                    await tgAPI('answerCallbackQuery', { callback_query_id: q.id, text: t('language_changed', newLang) });
                    const member = await isChannelMember(userId);
                    if (!member) {
                        await showChannelRequired(chatId, userId, newLang, msgId);
                    } else {
                        await countReferralIfNeeded(userId);
                        await showMainMenu(chatId, userId, newLang, msgId);
                    }
                }
                return;
            }

            // ─── CHECK CHANNEL ───
            if (data === 'check_channel') {
                const member = await isChannelMember(userId);
                if (member) {
                    await tgAPI('answerCallbackQuery', { callback_query_id: q.id });
                    await countReferralIfNeeded(userId);
                    if (user.is_registered && hasValidDeposit(user)) {
                        await sendVIPMessage(chatId, userId, lang, msgId);
                    } else {
                        await showMainMenu(chatId, userId, lang, msgId);
                    }
                } else {
                    await tgAPI('answerCallbackQuery', {
                        callback_query_id: q.id,
                        show_alert: true,
                        text: t('channel_required_alert', lang)
                    });
                }
                return;
            }

            // ─── CHANGE LANGUAGE ───
            if (data === 'change_language') {
                await tgAPI('answerCallbackQuery', { callback_query_id: q.id });
                await showLanguageSelection(chatId, userId, lang, msgId);
                return;
            }

            // ─── INSTRUCTIONS ───
            if (data === 'instructions') {
                await tgAPI('answerCallbackQuery', { callback_query_id: q.id });
                await deleteMsg(chatId, msgId);
                await sendNew(chatId, userId, t('instructions', lang), [backButton(lang)], 'instructions');
                return;
            }

            // ─── REGISTER ───
            if (data === 'register') {
                await tgAPI('answerCallbackQuery', { callback_query_id: q.id });
                await deleteMsg(chatId, msgId);
                await sendNew(chatId, userId, t('register', lang),
                    [[{ text: t('btn_register_now', lang), url: regLink(userId) }], [{ text: t('btn_back', lang), callback_data: 'back' }]]);
                return;
            }

            // ─── DEJA INSCRIT (Already registered) ───
            if (data === 'already_registered') {
                try {
                    await tgAPI('answerCallbackQuery', { callback_query_id: q.id });
                } catch (e) {}
                // Save temp state so handleText knows to process next text input
                try { await setTempState(userId, 'already_registered'); } catch (e) {}
                // Delete current message
                try { await deleteMsg(chatId, msgId); } catch (e) {}
                // Send message asking for 1Win ID
                const askText = t('already_registered', lang);
                const askBtns = [{ text: t('btn_back', lang), callback_data: 'back' }];
                let sent = false;
                try {
                    const res = await tgAPI('sendMessage', {
                        chat_id: chatId, text: askText, parse_mode: 'HTML',
                        reply_markup: { inline_keyboard: [askBtns] }
                    });
                    if (res && res.ok) {
                        sent = true;
                        await saveLastMsg(userId, res.result.message_id);
                    }
                } catch (e) {}
                return;
            }

            // ─── PREDICTIONS ───
            if (data === 'predictions') {
                if (!user.is_registered) {
                    await tgAPI('answerCallbackQuery', {
                        callback_query_id: q.id,
                        show_alert: true,
                        text: t('register_first', lang)
                    });
                } else if (!hasValidDeposit(user)) {
                    await tgAPI('answerCallbackQuery', { callback_query_id: q.id });
                    const dep = parseFloat(user.deposit_amount) || 0;
                    let msg;
                    if (dep > 0 && dep < MIN_DEPOSIT) {
                        const remaining = (MIN_DEPOSIT - dep).toFixed(2);
                        const l = LANGS[lang] || LANGS.fr;
                        const local = Math.round(parseFloat(remaining) * l.rate);
                        msg = t('deposit_small', lang).replace('{amount}', dep.toFixed(2)) + '\n\n'
                            + t('missing', lang).replace('{remaining}', remaining).replace('{local}', local + ' ' + l.symbol);
                    } else {
                        msg = t('deposit_insufficient_no', lang);
                    }
                    await deleteMsg(chatId, msgId);
                    await sendNew(chatId, userId, msg,
                        [[{ text: t('btn_deposit', lang), url: depLink(userId) }], backButton(lang)]);
                } else {
                    await tgAPI('answerCallbackQuery', { callback_query_id: q.id });
                    await sendVIPMessage(chatId, userId, lang, msgId);
                }
                return;
            }

            // ─── RETOUR AU MENU ───
            if (data === 'back') {
                try {
                    await tgAPI('answerCallbackQuery', { callback_query_id: q.id });
                } catch (e) {}
                try { await clearTempState(userId); } catch (e) {}
                // Supprimer le message actuel
                try { await deleteMsg(chatId, msgId); } catch (e) {}
                // Envoyer le menu avec la meme photo que le canal (joinch.png)
                const menuCaption = t('menu_text', lang);
                const menuBtns = simpleMenuButtons(lang);
                let menuSent = false;
                try {
                    const res = await sendPhotoMsg(chatId, userId, menuCaption, menuBtns, true);
                    if (res && res.ok) menuSent = true;
                } catch (e) {}
                // Si la photo a echoue, envoyer en texte
                if (!menuSent) {
                    try {
                        const res = await tgAPI('sendMessage', {
                            chat_id: chatId,
                            text: menuCaption,
                            parse_mode: 'HTML',
                            reply_markup: { inline_keyboard: menuBtns }
                        });
                        if (res && res.ok && userId) await saveLastMsg(userId, res.result.message_id);
                    } catch (e) {}
                }
                return;
            }

            await tgAPI('answerCallbackQuery', { callback_query_id: q.id });
        }
    } catch (error) {
        console.error('handleUpdate error:', error.message || error);
        // If photo failed, try to recover by sending text-only
        // (main recovery is already in showChannelRequired)
    }
}

// ═══════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════

module.exports = async function handler(req, res) {
    if (req.method === 'GET') {
        // Auto-register webhook on GET request
        if ('setup' in req.query) {
            try {
                const webhookUrl = req.query.url ? `${req.query.url}/api/webhook` : `${BASE_URL}/api/webhook`;
                const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: webhookUrl })
                });
                const info = await r.json();
                return res.status(200).json({
                    status: 'Webhook registered',
                    url: webhookUrl,
                    token: BOT_TOKEN ? BOT_TOKEN.substring(0, 8) + '...' : 'MISSING',
                    telegram_response: info
                });
            } catch (e) {
                return res.status(500).json({ error: e.message });
            }
        }
        // Diagnostic endpoint
        if ('diag' in req.query) {
            try {
                const info = {
                    commit: require('child_process').execSync('git log --oneline -1').toString().trim().split(' ')[0],
                    node: process.version,
                    channel_photo_file_id: _channelPhotoFileId ? _channelPhotoFileId.substring(0, 30) + '...' : 'not cached yet',
                    env_token: BOT_TOKEN ? BOT_TOKEN.substring(0, 8) + '...' : 'MISSING',
                    base_url: BASE_URL,
                    image_accessible: false,
                    db_ok: false
                };
                try {
                    const imgCheck = await fetch(BASE_URL + '/identite_visuel.png', { method: 'HEAD' });
                    info.image_accessible = imgCheck.ok;
                    info.image_size = imgCheck.headers.get('content-length');
                } catch(e) { info.image_error = e.message; }
                try { await query('SELECT 1 as ok'); info.db_ok = true; } catch(e) { info.db_error = e.message; }
                // Check webhook info
                try {
                    const whInfo = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
                    info.webhook = await whInfo.json();
                } catch(e) { info.webhook_error = e.message; }
                return res.status(200).json(info);
            } catch (e) {
                return res.status(200).json({ error: e.message, stack: e.stack });
            }
        }
        return res.status(200).send('ROVAS V2 International est en ligne !');
    }
    if (req.method === 'POST') {
        try { await handleUpdate(req.body); return res.status(200).send('OK'); }
        catch (e) { console.error('Webhook error:', e); return res.status(500).send('Error'); }
    }
    res.status(405).send('Method not allowed');
};
