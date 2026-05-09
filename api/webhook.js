const { query } = require('../lib/db');
const https = require('https');

// ═══════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════
const BOT_TOKEN    = process.env.BOT_TOKEN   || '';
const REG_LINK     = process.env.REG_LINK    || '';
const PREDICTION_URL = process.env.PREDICTION_URL || '';
const MIN_DEPOSIT  = parseFloat(process.env.MIN_DEPOSIT) || 5;

// ═══════════════════════════════════════════════════════════════════════
// Telegram Bot API helpers
// ═══════════════════════════════════════════════════════════════════════
function tgRequest(method, body) {
  return new Promise((resolve, reject) => {
    if (!BOT_TOKEN) return reject(new Error('BOT_TOKEN is missing'));
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve({ ok: false, description: 'Response parse error' }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('TG request timeout')); });
    req.write(payload);
    req.end();
  });
}

async function tgSendMessage(chatId, text, replyMarkup) {
  return tgRequest('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup || undefined,
    disable_web_page_preview: true,
  });
}

async function tgEditMessage(chatId, messageId, text, replyMarkup) {
  return tgRequest('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup || undefined,
    disable_web_page_preview: true,
  });
}

async function tgAnswerCallback(callbackQueryId, text) {
  return tgRequest('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: text || '',
    show_alert: false,
  });
}

async function tgDeleteMessage(chatId, messageId) {
  return tgRequest('deleteMessage', { chat_id: chatId, message_id: messageId }).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════════════
// i18n — 10-language translations
// ═══════════════════════════════════════════════════════════════════════
const i18n = {
  fr: {
    welcome:
      '🃏 <b>Bienvenue sur ROVAS</b> — votre compagnon de prédictions intelligent !\n\n'
      + 'ROVAS vous donne accès à des prédictions analysées pour les jeux de casino. '
      + 'Suivez les étapes, inscrivez-vous, effectuez votre dépôt et débloquez des prédictions exclusives.\n\n'
      + 'Prêt à maximiser vos gains ? C\'est parti ! 🚀',
    menu_register:     '🎰 Créer mon compte 1Win',
    menu_instructions: '📖 Comment fonctionne ROVAS ?',
    menu_status:       '📊 Mon statut',
    menu_language:     '🌐 Changer de langue',
    menu_predictions:  '⭐ Accéder aux prédictions',
    instructions_text:
      'Voici comment démarrer avec ROVAS :\n\n'
      + '1️⃣ <b>Créez votre compte 1Win</b>\n'
      + 'Cliquez sur le bouton d\'inscription ci-dessous et finalisez votre inscription sur 1Win.\n\n'
      + '2️⃣ <b>Effectuez un dépôt</b>\n'
      + 'Approvisionnez votre compte d\'au moins <b>{MIN_DEPOSIT}$</b> pour activer l\'accès VIP.\n\n'
      + '3️⃣ <b>Accédez aux prédictions</b>\n'
      + 'Une fois votre dépôt confirmé, vous débloquerez les prédictions exclusives pour booster vos chances.\n\n'
      + '💡 <i>Plus vous jouez, plus vous gagnez !</i>',
    instructions_back: '🔙 Retour au menu',
    status_registered:     '✅ Votre compte 1Win est lié',
    status_not_registered: '❌ Aucun compte 1Win lié pour le moment',
    status_deposited:      '💰 Dépôt confirmé : <b>{AMOUNT}$</b>',
    status_no_deposit:     '⚠️ Aucun dépôt détecté pour le moment',
    status_vip:            '🎉 Vous avez un accès VIP ! Utilisez le bouton ci-dessous pour consulter les prédictions.',
    status_not_vip:        '🔒 Effectuez un dépôt d\'au moins <b>{MIN_DEPOSIT}$</b> pour débloquer l\'accès aux prédictions.',
    status_send_id:        '📝 Pour lier votre compte, envoyez votre <b>ID 1Win</b> (un numéro de 5 à 15 chiffres) dans cette conversation.',
    lang_select:           '🌐 Choisissez votre langue préférée :',
    lang_changed:          '✅ Langue mise à jour avec succès !',
    id_saved:              '✅ Votre ID 1Win (<code>{ID}</code>) a été enregistré avec succès !\n\nVotre compte est maintenant lié.',
    id_already_registered: 'ℹ️ Vous avez déjà un compte 1Win lié.',
    id_invalid:            '⚠️ L\'identifiant saisi ne semble pas être un ID 1Win valide. Veuillez entrer un numéro de 5 à 15 chiffres.',
  },

  en: {
    welcome:
      '🃏 <b>Welcome to ROVAS</b> — your smart prediction companion!\n\n'
      + 'ROVAS provides carefully analyzed predictions for casino games. '
      + 'Follow the steps, register, make a deposit and unlock exclusive predictions.\n\n'
      + 'Ready to level up your game? Let\'s go! 🚀',
    menu_register:     '🎰 Create my 1Win account',
    menu_instructions: '📖 How does ROVAS work?',
    menu_status:       '📊 My status',
    menu_language:     '🌐 Change language',
    menu_predictions:  '⭐ Access predictions',
    instructions_text:
      'Here\'s how to get started with ROVAS:\n\n'
      + '1️⃣ <b>Create your 1Win account</b>\n'
      + 'Click the registration button below and complete your signup on 1Win.\n\n'
      + '2️⃣ <b>Make a deposit</b>\n'
      + 'Fund your account with at least <b>{MIN_DEPOSIT}$</b> to activate VIP access.\n\n'
      + '3️⃣ <b>Access predictions</b>\n'
      + 'Once your deposit is confirmed, you\'ll unlock exclusive predictions to boost your odds.\n\n'
      + '💡 <i>The more you play, the more you win!</i>',
    instructions_back: '🔙 Back to menu',
    status_registered:     '✅ Your 1Win account is linked',
    status_not_registered: '❌ No 1Win account linked yet',
    status_deposited:      '💰 Deposit confirmed: <b>{AMOUNT}$</b>',
    status_no_deposit:     '⚠️ No deposit detected yet',
    status_vip:            '🎉 You have VIP access! Use the button below to view predictions.',
    status_not_vip:        '🔒 Deposit at least <b>{MIN_DEPOSIT}$</b> to unlock prediction access.',
    status_send_id:        '📝 To link your account, send your <b>1Win ID</b> (a 5-15 digit number) in this chat.',
    lang_select:           '🌐 Choose your preferred language:',
    lang_changed:          '✅ Language updated successfully!',
    id_saved:              '✅ Your 1Win ID (<code>{ID}</code>) has been saved successfully!\n\nYour account is now linked.',
    id_already_registered: 'ℹ️ You already have a 1Win account linked.',
    id_invalid:            '⚠️ That doesn\'t look like a valid 1Win ID. Please enter a 5-15 digit number.',
  },

  hi: {
    welcome:
      '🃏 <b>ROVAS में आपका स्वागत है</b> — आपका स्मार्ट प्रेडिक्शन साथी!\n\n'
      + 'ROVAS कैसीनो गेम्स के लिए सावधानी से विश्लेषित प्रेडिक्शन प्रदान करता है। '
      + 'चरणों का पालन करें, रजिस्टर करें, डिपॉजिट करें और एक्सक्लूसिव प्रेडिक्शन अनलॉक करें।\n\n'
      + 'अपने गेम को बेहतर बनाने के लिए तैयार हैं? चलिए शुरू करते हैं! 🚀',
    menu_register:     '🎰 मेरा 1Win अकाउंट बनाएं',
    menu_instructions: '📖 ROVAS कैसे काम करता है?',
    menu_status:       '📊 मेरा स्टेटस',
    menu_language:     '🌐 भाषा बदलें',
    menu_predictions:  '⭐ प्रेडिक्शन देखें',
    instructions_text:
      'ROVAS से शुरू करने का तरीका:\n\n'
      + '1️⃣ <b>अपना 1Win अकाउंट बनाएं</b>\n'
      + 'नीचे दिए गए रजिस्ट्रेशन बटन पर क्लिक करें और 1Win पर साइनअप पूरा करें।\n\n'
      + '2️⃣ <b>डिपॉजिट करें</b>\n'
      + 'VIP एक्सेस सक्रिय करने के लिए कम से कम <b>{MIN_DEPOSIT}$</b> डिपॉजिट करें।\n\n'
      + '3️⃣ <b>प्रेडिक्शन एक्सेस करें</b>\n'
      + 'डिपॉजिट कन्फर्म होने पर एक्सक्लूसिव प्रेडिक्शन अनलॉक हो जाएंगे।\n\n'
      + '💡 <i>जितना अधिक खेलेंगे, उतना अधिक जीतेंगे!</i>',
    instructions_back: '🔙 मेनू पर वापस',
    status_registered:     '✅ आपका 1Win अकाउंट लिंक हो गया',
    status_not_registered: '❌ अभी तक कोई 1Win अकाउंट लिंक नहीं',
    status_deposited:      '💰 डिपॉजिट कन्फर्म: <b>{AMOUNT}$</b>',
    status_no_deposit:     '⚠️ अभी तक कोई डिपॉजिट नहीं',
    status_vip:            '🎉 आपको VIP एक्सेस मिल गया! प्रेडिक्शन देखने के लिए नीचे दिया गया बटन दबाएं।',
    status_not_vip:        '🔒 प्रेडिक्शन एक्सेस अनलॉक करने के लिए कम से कम <b>{MIN_DEPOSIT}$</b> डिपॉजिट करें।',
    status_send_id:        '📝 अकाउंट लिंक करने के लिए अपना <b>1Win ID</b> (5-15 अंकों का नंबर) इस चैट में भेजें।',
    lang_select:           '🌐 अपनी पसंदीदा भाषा चुनें:',
    lang_changed:          '✅ भाषा सफलतापूर्वक अपडेट हो गई!',
    id_saved:              '✅ आपका 1Win ID (<code>{ID}</code>) सफलतापूर्वक सेव हो गया!\n\nअब आपका अकाउंट लिंक हो गया है।',
    id_already_registered: 'ℹ️ आपका 1Win अकाउंट पहले से लिंक है।',
    id_invalid:            '⚠️ यह एक valid 1Win ID नहीं लगता। कृपया 5-15 अंकों का नंबर दर्ज करें।',
  },

  uz: {
    welcome:
      '🃏 <b>ROVAS ga xush kelibsiz</b> — aqlli prognoz yordamchingiz!\n\n'
      + 'ROVAS kazino o\'yinlari uchun diqqat bilan tahlil qilingan prognozlar taqdim etadi. '
      + 'Qadamlarni bajaring, ro\'yxatdan o\'ting, depozit qiling va eksklyuziv prognozlarni oching.\n\n'
      + 'O\'yiningizni yuqori darajaga ko\'tarishga tayyormisiz? Boshlaylik! 🚀',
    menu_register:     '🎰 1Win hisobimni yarating',
    menu_instructions: '📖 ROVAS qanday ishlaydi?',
    menu_status:       '📊 Mening holatim',
    menu_language:     '🌐 Tilni o\'zgartirish',
    menu_predictions:  '⭐ Prognozlarni ko\'rish',
    instructions_text:
      'ROVAS bilan qanday boshlash kerak:\n\n'
      + '1️⃣ <b>1Win hisobingizni yarating</b>\n'
      + 'Quyidagi ro\'yxatdan o\'tish tugmasini bosing va 1Win\'da ro\'yxatdan o\'ting.\n\n'
      + '2️⃣ <b>Depozit qiling</b>\n'
      + 'VIP ruxsatni faollashtirish uchun kamida <b>{MIN_DEPOSIT}$</b> depozit qiling.\n\n'
      + '3️⃣ <b>Prognozlarga kiring</b>\n'
      + 'Depozitingiz tasdiqlangach, eksklyuziv prognozlar ochiladi.\n\n'
      + '💡 <i>Ko\'p o\'ynasangiz, ko\'p yutasiz!</i>',
    instructions_back: '🔙 Menyuga qaytish',
    status_registered:     '✅ 1Win hisobingiz bog\'langan',
    status_not_registered: '❌ Hali 1Win hisobi bog\'lanmagan',
    status_deposited:      '💰 Depozit tasdiqlangan: <b>{AMOUNT}$</b>',
    status_no_deposit:     '⚠️ Hali depozit topilmadi',
    status_vip:            '🎉 Sizda VIP ruxsat bor! Prognozlarni ko\'rish uchun quyidagi tugmani bosing.',
    status_not_vip:        '🔒 Prognoz ruxsatini ochish uchun kamida <b>{MIN_DEPOSIT}$</b> depozit qiling.',
    status_send_id:        '📝 Hisobni bog\'lash uchun o\'z <b>1Win ID</b>\'ingizni (5-15 raqam) shu chatga yuboring.',
    lang_select:           '🌐 Tilni tanlang:',
    lang_changed:          '✅ Til muvaffaqiyatli yangilandi!',
    id_saved:              '✅ Sizning 1Win ID\'ingiz (<code>{ID}</code>) muvaffaqiyatli saqlandi!\n\nHisobingiz endi bog\'langan.',
    id_already_registered: 'ℹ️ Sizning 1Win hisobingiz allaqachon bog\'langan.',
    id_invalid:            '⚠️ Bu yaroqli 1Win ID emasdek ko\'rinadi. Iltimos, 5-15 raqamli son kiriting.',
  },

  es: {
    welcome:
      '🃏 <b>Bienvenido a ROVAS</b> — tu asistente inteligente de predicciones!\n\n'
      + 'ROVAS te ofrece predicciones analizadas con detalle para juegos de casino. '
      + 'Sigue los pasos, regístrate, realiza tu depósito y accede a predicciones exclusivas.\n\n'
      + '¿Listo para llevar tus jugadas al siguiente nivel? ¡Vamos! 🚀',
    menu_register:     '🎰 Crear mi cuenta en 1Win',
    menu_instructions: '📖 ¿Cómo funciona ROVAS?',
    menu_status:       '📊 Mi estado',
    menu_language:     '🌐 Cambiar idioma',
    menu_predictions:  '⭐ Acceder a predicciones',
    instructions_text:
      'Así se comienza con ROVAS:\n\n'
      + '1️⃣ <b>Crea tu cuenta en 1Win</b>\n'
      + 'Pulsa el botón de registro y completa tu inscripción en 1Win.\n\n'
      + '2️⃣ <b>Realiza un depósito</b>\n'
      + 'Aporta al menos <b>{MIN_DEPOSIT}$</b> para activar el acceso VIP.\n\n'
      + '3️⃣ <b>Accede a las predicciones</b>\n'
      + 'Una vez confirmado tu depósito, desbloquearás predicciones exclusivas.\n\n'
      + '💡 <i>¡Cuanto más juegues, más ganarás!</i>',
    instructions_back: '🔙 Volver al menú',
    status_registered:     '✅ Tu cuenta de 1Win está vinculada',
    status_not_registered: '❌ Sin cuenta de 1Win vinculada aún',
    status_deposited:      '💰 Depósito confirmado: <b>{AMOUNT}$</b>',
    status_no_deposit:     '⚠️ Sin depósito detectado aún',
    status_vip:            '🎉 ¡Tienes acceso VIP! Pulsa el botón de abajo para ver las predicciones.',
    status_not_vip:        '🔒 Deposita al menos <b>{MIN_DEPOSIT}$</b> para desbloquear las predicciones.',
    status_send_id:        '📝 Para vincular tu cuenta, envía tu <b>ID de 1Win</b> (un número de 5 a 15 dígitos) en este chat.',
    lang_select:           '🌐 Elige tu idioma preferido:',
    lang_changed:          '✅ ¡Idioma actualizado correctamente!',
    id_saved:              '✅ Tu ID de 1Win (<code>{ID}</code>) se ha guardado correctamente.\n\nTu cuenta está ahora vinculada.',
    id_already_registered: 'ℹ️ Ya tienes una cuenta de 1Win vinculada.',
    id_invalid:            '⚠️ Eso no parece un ID de 1Win válido. Por favor, introduce un número de 5 a 15 dígitos.',
  },

  az: {
    welcome:
      '🃏 <b>ROVAS-a xoş gəldiniz</b> — ağıllı proqnoz köməkçiniz!\n\n'
      + 'ROVAS kazino oyunları üçün diqqətlə analiz edilmiş proqnozlar təqdim edir. '
      + 'Addımları izləyin, qeydiyyatdan keçin, depozit qoyun və eksklüziv proqnozları açın.\n\n'
      + 'Oyununuzu yüksək səviyyəyə qaldırmağa hazırsınız? Başlayaq! 🚀',
    menu_register:     '🎰 1Win hesabımı yaradın',
    menu_instructions: '📖 ROVAS necə işləyir?',
    menu_status:       '📊 Mənim statusum',
    menu_language:     '🌐 Dili dəyiş',
    menu_predictions:  '⭐ Proqnozlara bax',
    instructions_text:
      'ROVAS ilə necə başlamaq olar:\n\n'
      + '1️⃣ <b>1Win hesabınızı yaradın</b>\n'
      + 'Aşağıdakı qeydiyyat düyməsinə basın və 1Win-də qeydiyyatdan keçin.\n\n'
      + '2️⃣ <b>Depozit qoyun</b>\n'
      + 'VIP girişi aktivləşdirmək üçün ən az <b>{MIN_DEPOSIT}$</b> depozit qoyun.\n\n'
      + '3️⃣ <b>Proqnozlara daxil olun</b>\n'
      + 'Depozitiniz təsdiqləndikdən sonra eksklüziv proqnozlar açılacaq.\n\n'
      + '💡 <i>Neçə çox oynayırsınızsa, bir o qədər qazanırsınız!</i>',
    instructions_back: '🔙 Menyuya qayıt',
    status_registered:     '✅ 1Win hesabınız bağlanıb',
    status_not_registered: '❌ Hələ 1Win hesabı bağlanmayıb',
    status_deposited:      '💰 Depozit təsdiqlənib: <b>{AMOUNT}$</b>',
    status_no_deposit:     '⚠️ Hələ depozit tapılmayıb',
    status_vip:            '🎉 Sizin VIP girişiniz var! Proqnozlara baxmaq üçün aşağıdakı düyməni basın.',
    status_not_vip:        '🔒 Proqnoz girişi açmaq üçün ən az <b>{MIN_DEPOSIT}$</b> depozit qoyun.',
    status_send_id:        '📝 Hesabı bağlamaq üçün <b>1Win ID</b>\'nizi (5-15 rəqəmli nömrə) bu çata göndərin.',
    lang_select:           '🌐 Dilinizi seçin:',
    lang_changed:          '✅ Dil uğurla yeniləndi!',
    id_saved:              '✅ 1Win ID\'niz (<code>{ID}</code>) uğurla saxlanıldı!\n\nHesabınız indi bağlanıb.',
    id_already_registered: 'ℹ️ Sizin 1Win hesabınız artıq bağlanıb.',
    id_invalid:            '⚠️ Bu keçərli 1Win ID kimi görünmür. Zəhmət olmasa, 5-15 rəqəmli nömrə daxil edin.',
  },

  tr: {
    welcome:
      '🃏 <b>ROVAS\'a hoş geldiniz</b> — akıllı tahmin asistanınız!\n\n'
      + 'ROVAS, casino oyunları için özenle analiz edilmiş tahminler sunar. '
      + 'Adımları takip edin, kayıt olun, para yatırın ve özel tahminlerin kilidini açın.\n\n'
      + 'Oyununuzu bir üst seviyeye taşımaya hazır mısınız? Başlayalım! 🚀',
    menu_register:     '🎰 1Win hesabımı oluştur',
    menu_instructions: '📖 ROVAS nasıl çalışır?',
    menu_status:       '📊 Durumum',
    menu_language:     '🌐 Dil değiştir',
    menu_predictions:  '⭐ Tahminlere eriş',
    instructions_text:
      'ROVAS ile başlamak için:\n\n'
      + '1️⃣ <b>1Win hesabınızı oluşturun</b>\n'
      + 'Aşağıdaki kayıt butonuna tıklayın ve 1Win\'de kaydolun.\n\n'
      + '2️⃣ <b>Para yatırın</b>\n'
      + 'VIP erişimi aktifleştirmek için en az <b>{MIN_DEPOSIT}$</b> yatırın.\n\n'
      + '3️⃣ <b>Tahminlere erişin</b>\n'
      + 'Yatırma işleminiz onaylandığında özel tahminler açılacak.\n\n'
      + '💡 <i>Ne kadar çok oynarsanız, o kadar çok kazanırsınız!</i>',
    instructions_back: '🔙 Menüye dön',
    status_registered:     '✅ 1Win hesabınız bağlı',
    status_not_registered: '❌ Henüz 1Win hesabı bağlı değil',
    status_deposited:      '💰 Para yatırma onaylandı: <b>{AMOUNT}$</b>',
    status_no_deposit:     '⚠️ Henüz para yatırma tespit edilmedi',
    status_vip:            '🎉 VIP erişiminiz var! Tahminleri görmek için aşağıdaki butonu tıklayın.',
    status_not_vip:        '🔒 Tahmin erişimini açmak için en az <b>{MIN_DEPOSIT}$</b> yatırın.',
    status_send_id:        '📝 Hesabınızı bağlamak için <b>1Win ID</b>\'nizi (5-15 haneli numara) bu sohbete gönderin.',
    lang_select:           '🌐 Tercih ettiğiniz dili seçin:',
    lang_changed:          '✅ Dil başarıyla güncellendi!',
    id_saved:              '✅ 1Win ID\'niz (<code>{ID}</code>) başarıyla kaydedildi!\n\nHesabınız artık bağlı.',
    id_already_registered: 'ℹ️ Zaten bir 1Win hesabınız bağlı.',
    id_invalid:            '⚠️ Bu geçerli bir 1Win ID görünmüyor. Lütfen 5-15 haneli bir numara girin.',
  },

  ar: {
    welcome:
      '🃏 <b>مرحبًا بك في ROVAS</b> — رفيقك الذكي للتنبؤات!\n\n'
      + 'يقدم لك ROVAS تنبؤات محللة بعناية لألعاب الكازينو. '
      + 'اتبع الخطوات، وسجل، وقم بالإيداع، وافتح التنبؤات الحصرية.\n\n'
      + 'هل أنت مستعد للارتقاء بلعبك؟ هيا بنا! 🚀',
    menu_register:     '🎰 إنشاء حسابي على 1Win',
    menu_instructions: '📖 كيف يعمل ROVAS؟',
    menu_status:       '📊 حالتي',
    menu_language:     '🌐 تغيير اللغة',
    menu_predictions:  '⭐ الوصول للتنبؤات',
    instructions_text:
      'كيف تبدأ مع ROVAS:\n\n'
      + '1️⃣ <b>أنشئ حسابك على 1Win</b>\n'
      + 'اضغط على زر التسجيل وأكمل تسجيلك على 1Win.\n\n'
      + '2️⃣ <b>قم بالإيداع</b>\n'
      + 'أودع في حسابك ما لا يقل عن <b>{MIN_DEPOSIT}$</b> لتفعيل الوصول VIP.\n\n'
      + '3️⃣ <b>الوصول للتنبؤات</b>\n'
      + 'بمجرد تأكيد إيداعك، ستفتح التنبؤات الحصرية.\n\n'
      + '💡 <i>كلما لعبت أكثر، ربحت أكثر!</i>',
    instructions_back: '🔙 العودة للقائمة',
    status_registered:     '✅ حسابك على 1Win مرتبط',
    status_not_registered: '❌ لم يتم ربط حساب 1Win بعد',
    status_deposited:      '💰 الإيداع مؤكد: <b>{AMOUNT}$</b>',
    status_no_deposit:     '⚠️ لم يتم اكتشاف إيداع بعد',
    status_vip:            '🎉 لديك وصول VIP! استخدم الزر أدناه لعرض التنبؤات.',
    status_not_vip:        '🔒 أودع ما لا يقل عن <b>{MIN_DEPOSIT}$</b> لفتح الوصول للتنبؤات.',
    status_send_id:        '📝 لربط حسابك، أرسل <b>معرف 1Win</b> الخاص بك (رقم من 5 إلى 15 خانة) في هذه المحادثة.',
    lang_select:           '🌐 اختر لغتك المفضلة:',
    lang_changed:          '✅ تم تحديث اللغة بنجاح!',
    id_saved:              '✅ تم حفظ معرف 1Win الخاص بك (<code>{ID}</code>) بنجاح!\n\nحسابك الآن مرتبط.',
    id_already_registered: 'ℹ️ لديك بالفعل حساب 1Win مرتبط.',
    id_invalid:            '⚠️ هذا لا يبدو معرف 1Win صالحًا. يرجى إدخال رقم من 5 إلى 15 خانة.',
  },

  ru: {
    welcome:
      '🃏 <b>Добро пожаловать в ROVAS</b> — ваш умный помощник по прогнозам!\n\n'
      + 'ROVAS предоставляет тщательно проанализированные прогнозы для казино-игр. '
      + 'Выполните шаги, зарегистрируйтесь, пополните счёт и получите доступ к эксклюзивным прогнозам.\n\n'
      + 'Готовы поднять свою игру на новый уровень? Начнём! 🚀',
    menu_register:     '🎰 Создать аккаунт 1Win',
    menu_instructions: '📖 Как работает ROVAS?',
    menu_status:       '📊 Мой статус',
    menu_language:     '🌐 Сменить язык',
    menu_predictions:  '⭐ Открыть прогнозы',
    instructions_text:
      'Как начать работу с ROVAS:\n\n'
      + '1️⃣ <b>Создайте аккаунт 1Win</b>\n'
      + 'Нажмите кнопку регистрации и завершите регистрацию на 1Win.\n\n'
      + '2️⃣ <b>Пополните счёт</b>\n'
      + 'Внесите не менее <b>{MIN_DEPOSIT}$</b> для активации VIP-доступа.\n\n'
      + '3️⃣ <b>Получите доступ к прогнозам</b>\n'
      + 'После подтверждения пополнения вы откроете эксклюзивные прогнозы.\n\n'
      + '💡 <i>Чем больше играете, тем больше выигрываете!</i>',
    instructions_back: '🔙 Назад в меню',
    status_registered:     '✅ Ваш аккаунт 1Win привязан',
    status_not_registered: '❌ Аккаунт 1Win ещё не привязан',
    status_deposited:      '💰 Пополнение подтверждено: <b>{AMOUNT}$</b>',
    status_no_deposit:     '⚠️ Пополнение пока не обнаружено',
    status_vip:            '🎉 У вас есть VIP-доступ! Нажмите кнопку ниже для просмотра прогнозов.',
    status_not_vip:        '🔒 Пополните счёт не менее чем на <b>{MIN_DEPOSIT}$</b> для доступа к прогнозам.',
    status_send_id:        '📝 Чтобы привязать аккаунт, отправьте свой <b>ID 1Win</b> (число от 5 до 15 цифр) в этот чат.',
    lang_select:           '🌐 Выберите ваш язык:',
    lang_changed:          '✅ Язык успешно обновлён!',
    id_saved:              '✅ Ваш ID 1Win (<code>{ID}</code>) успешно сохранён!\n\nВаш аккаунт теперь привязан.',
    id_already_registered: 'ℹ️ У вас уже привязан аккаунт 1Win.',
    id_invalid:            '⚠️ Это не похоже на корректный ID 1Win. Пожалуйста, введите число от 5 до 15 цифр.',
  },

  pt: {
    welcome:
      '🃏 <b>Bem-vindo ao ROVAS</b> — seu assistente inteligente de previsões!\n\n'
      + 'O ROVAS oferece previsões analisadas com cuidado para jogos de cassino. '
      + 'Siga os passos, registre-se, faça seu depósito e desbloqueie previsões exclusivas.\n\n'
      + 'Pronto para elevar o seu jogo ao próximo nível? Vamos lá! 🚀',
    menu_register:     '🎰 Criar minha conta 1Win',
    menu_instructions: '📖 Como funciona o ROVAS?',
    menu_status:       '📊 Meu status',
    menu_language:     '🌐 Mudar idioma',
    menu_predictions:  '⭐ Acessar previsões',
    instructions_text:
      'Como começar com o ROVAS:\n\n'
      + '1️⃣ <b>Crie sua conta 1Win</b>\n'
      + 'Clique no botão de registro e complete seu cadastro no 1Win.\n\n'
      + '2️⃣ <b>Faça um depósito</b>\n'
      + 'Deposite pelo menos <b>{MIN_DEPOSIT}$</b> para ativar o acesso VIP.\n\n'
      + '3️⃣ <b>Acesse as previsões</b>\n'
      + 'Assim que seu depósito for confirmado, as previsões exclusivas serão desbloqueadas.\n\n'
      + '💡 <i>Quanto mais você joga, mais você ganha!</i>',
    instructions_back: '🔙 Voltar ao menu',
    status_registered:     '✅ Sua conta 1Win está vinculada',
    status_not_registered: '❌ Nenhuma conta 1Win vinculada ainda',
    status_deposited:      '💰 Depósito confirmado: <b>{AMOUNT}$</b>',
    status_no_deposit:     '⚠️ Nenhum depósito detectado ainda',
    status_vip:            '🎉 Você tem acesso VIP! Clique no botão abaixo para ver as previsões.',
    status_not_vip:        '🔒 Deposite pelo menos <b>{MIN_DEPOSIT}$</b> para desbloquear as previsões.',
    status_send_id:        '📝 Para vincular sua conta, envie seu <b>ID 1Win</b> (um número de 5 a 15 dígitos) neste chat.',
    lang_select:           '🌐 Escolha seu idioma preferido:',
    lang_changed:          '✅ Idioma atualizado com sucesso!',
    id_saved:              '✅ Seu ID 1Win (<code>{ID}</code>) foi salvo com sucesso!\n\nSua conta está agora vinculada.',
    id_already_registered: 'ℹ️ Você já tem uma conta 1Win vinculada.',
    id_invalid:            '⚠️ Isso não parece um ID 1Win válido. Por favor, insira um número de 5 a 15 dígitos.',
  },
};

// ── Translation helper ─────────────────────────────────────────────────
function t(lang, key, vars) {
  const fallback = i18n.fr[key] || key;
  let text = (i18n[lang] && i18n[lang][key]) || fallback;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.split(k).join(String(v));
    }
  }
  return text;
}

// ── Supported language list ────────────────────────────────────────────
const LANGUAGES = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'hi', flag: '🇮🇳', label: 'हिन्दी' },
  { code: 'uz', flag: '🇺🇿', label: 'O\'zbek' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'az', flag: '🇦🇿', label: 'Azərbaycan' },
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'ar', flag: '🇸🇦', label: 'العربية' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
];

// ═══════════════════════════════════════════════════════════════════════
// Database helpers
// ═══════════════════════════════════════════════════════════════════════

/**
 * Upsert user into the users table. Returns the user row.
 */
async function upsertUser(telegramId, username, firstName, lastName) {
  const { rows } = await query(
    `INSERT INTO users (telegram_id, username, first_name, last_name, updated_at)
     VALUES ($1::int, $2, $3, $4, NOW())
     ON CONFLICT (telegram_id)
     DO UPDATE SET username = $2, first_name = $3, last_name = $4, updated_at = NOW()
     RETURNING *`,
    [telegramId, username || '', firstName || '', lastName || ''],
  );
  return rows[0];
}

/**
 * Fetch a single user by telegram_id.
 */
async function getUser(telegramId) {
  const { rows } = await query(
    'SELECT * FROM users WHERE telegram_id = $1::int',
    [telegramId],
  );
  return rows[0] || null;
}

/**
 * Update user language.
 */
async function setUserLang(telegramId, lang) {
  await query(
    `UPDATE users SET language = $2, updated_at = NOW()
     WHERE telegram_id = $1::int`,
    [telegramId, lang],
  );
}

/**
 * Save 1Win user ID and mark user as registered.
 */
async function registerOneWinId(telegramId, oneWinId) {
  const { rows } = await query(
    `UPDATE users
     SET one_win_user_id = $2, is_registered = TRUE, registered_at = NOW(), updated_at = NOW()
     WHERE telegram_id = $1::int
     RETURNING *`,
    [telegramId, oneWinId],
  );
  return rows[0];
}

/**
 * Upsert a bot_session row.
 */
async function upsertSession(telegramId, action, tempData) {
  await query(
    `INSERT INTO bot_sessions (bot_type, admin_id, action, temp_data, updated_at)
     VALUES ('ROVAS', $1::int, $2, $3, NOW())
     ON CONFLICT (bot_type, admin_id)
     DO UPDATE SET action = $2, temp_data = $3, updated_at = NOW()`,
    [telegramId, action || '', tempData || ''],
  );
}

/**
 * Get bot_session for a user.
 */
async function getSession(telegramId) {
  const { rows } = await query(
    `SELECT * FROM bot_sessions
     WHERE bot_type = 'ROVAS' AND admin_id = $1::int`,
    [telegramId],
  );
  return rows[0] || null;
}

// ═══════════════════════════════════════════════════════════════════════
// Keyboard builders
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build referral link with user telegram_id.
 */
function buildRefLink(telegramId) {
  if (!REG_LINK) return '';
  const sep = REG_LINK.includes('?') ? '&' : '?';
  return `${REG_LINK}${sep}ref=${telegramId}`;
}

/**
 * Main menu inline keyboard.
 * @param {string} lang  - user's language
 * @param {number} tid   - telegram_id for referral link
 * @param {boolean} isVip - whether user has VIP access
 */
function buildMainMenu(lang, tid, isVip) {
  const refUrl = buildRefLink(tid);
  const rows = [
    [{ text: t(lang, 'menu_register'), url: refUrl }],
    [{ text: t(lang, 'menu_instructions'), callback_data: 'instructions' }],
    [{ text: t(lang, 'menu_status'), callback_data: 'status' }],
    [{ text: t(lang, 'menu_language'), callback_data: 'lang_select' }],
  ];
  if (isVip && PREDICTION_URL) {
    rows.push([{ text: t(lang, 'menu_predictions'), url: PREDICTION_URL }]);
  }
  return { inline_keyboard: rows };
}

/**
 * Language selection inline keyboard.
 */
function buildLangKeyboard() {
  const rows = [];
  for (let i = 0; i < LANGUAGES.length; i += 2) {
    const row = [];
    row.push({
      text: `${LANGUAGES[i].flag} ${LANGUAGES[i].label}`,
      callback_data: `lang_${LANGUAGES[i].code}`,
    });
    if (i + 1 < LANGUAGES.length) {
      row.push({
        text: `${LANGUAGES[i + 1].flag} ${LANGUAGES[i + 1].label}`,
        callback_data: `lang_${LANGUAGES[i + 1].code}`,
      });
    }
    rows.push(row);
  }
  // Back button
  rows.push([{ text: '🔙', callback_data: 'menu' }]);
  return { inline_keyboard: rows };
}

/**
 * Instructions page keyboard (back to menu).
 */
function buildInstructionsKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, 'instructions_back'), callback_data: 'menu' }],
    ],
  };
}

/**
 * Status page keyboard.
 */
function buildStatusKeyboard(lang, tid, isVip) {
  const rows = [];
  if (!isVip) {
    const refUrl = buildRefLink(tid);
    rows.push([{ text: t(lang, 'menu_register'), url: refUrl }]);
  }
  if (isVip && PREDICTION_URL) {
    rows.push([{ text: t(lang, 'menu_predictions'), url: PREDICTION_URL }]);
  }
  rows.push([{ text: t(lang, 'instructions_back'), callback_data: 'menu' }]);
  return { inline_keyboard: rows };
}

// ═══════════════════════════════════════════════════════════════════════
// Handlers
// ═══════════════════════════════════════════════════════════════════════

/**
 * Handle /start command — upsert user, show language picker or main menu.
 */
async function handleStart(chatId, user) {
  const { id: tid, username, first_name, last_name } = user;
  const dbUser = await upsertUser(tid, username, first_name, last_name);
  const lang = dbUser.language || 'fr';

  if (!dbUser.language || dbUser.language === '') {
    // First time — show language selection
    await tgSendMessage(chatId, t('fr', 'lang_select'), buildLangKeyboard());
    await upsertSession(tid, 'choosing_language', '');
  } else {
    // Returning user — show main menu
    const isVip = dbUser.is_deposited && parseFloat(dbUser.deposit_amount) >= MIN_DEPOSIT;
    const markup = buildMainMenu(lang, tid, isVip);
    await tgSendMessage(chatId, t(lang, 'welcome'), markup);
    await upsertSession(tid, 'menu', '');
  }
}

/**
 * Show main menu (reusable from callback).
 */
async function showMainMenu(chatId, lang, tid, existingMessageId) {
  const dbUser = await getUser(tid);
  const isVip = dbUser && dbUser.is_deposited && parseFloat(dbUser.deposit_amount) >= MIN_DEPOSIT;
  const text = t(lang, 'welcome');
  const markup = buildMainMenu(lang, tid, isVip);

  if (existingMessageId) {
    try {
      await tgEditMessage(chatId, existingMessageId, text, markup);
      return;
    } catch {
      // Edit failed (message too old, etc.) — fall through to send
    }
  }
  await tgSendMessage(chatId, text, markup);
}

/**
 * Handle callback queries.
 */
async function handleCallback(callbackQuery) {
  const { id: cbId, message, from, data } = callbackQuery;
  const chatId = message.chat.id;
  const messageId = message.message_id;
  const tid = from.id;

  // Acknowledge callback
  await tgAnswerCallback(cbId).catch(() => {});

  try {
    // ── Language selection grid ──────────────────────────────────────
    if (data === 'lang_select') {
      const user = await getUser(tid);
      const lang = user ? user.language || 'fr' : 'fr';
      const text = t(lang, 'lang_select');
      await tgEditMessage(chatId, messageId, text, buildLangKeyboard());
      await upsertSession(tid, 'choosing_language', '');
      return;
    }

    // ── Language chosen ─────────────────────────────────────────────
    if (data.startsWith('lang_')) {
      const langCode = data.replace('lang_', '');
      if (LANGUAGES.some((l) => l.code === langCode)) {
        await setUserLang(tid, langCode);
        await upsertSession(tid, 'menu', '');
        const confirmText = t(langCode, 'lang_changed');
        // Brief confirmation, then show menu
        await tgEditMessage(chatId, messageId, confirmText, buildMainMenu(langCode, tid, false));
      }
      return;
    }

    // ── Main menu ───────────────────────────────────────────────────
    if (data === 'menu') {
      const user = await getUser(tid);
      const lang = user ? user.language || 'fr' : 'fr';
      await showMainMenu(chatId, lang, tid, messageId);
      await upsertSession(tid, 'menu', '');
      return;
    }

    // ── Instructions ────────────────────────────────────────────────
    if (data === 'instructions') {
      const user = await getUser(tid);
      const lang = user ? user.language || 'fr' : 'fr';
      const text = t(lang, 'instructions_text', { '{MIN_DEPOSIT}': MIN_DEPOSIT });
      await tgEditMessage(chatId, messageId, text, buildInstructionsKeyboard(lang));
      return;
    }

    // ── Status ──────────────────────────────────────────────────────
    if (data === 'status') {
      const user = await getUser(tid);
      const lang = user ? user.language || 'fr' : 'fr';
      const isVip = user && user.is_deposited && parseFloat(user.deposit_amount) >= MIN_DEPOSIT;

      let statusText = '<b>📊 ' + (lang === 'fr' ? 'Votre statut' : 'Status') + '</b>\n\n';

      // Registration status
      if (user && user.is_registered) {
        statusText += t(lang, 'status_registered') + '\n';
      } else {
        statusText += t(lang, 'status_not_registered') + '\n';
        statusText += t(lang, 'status_send_id') + '\n\n';
      }

      // Deposit status
      if (user && user.is_deposited) {
        statusText += t(lang, 'status_deposited', { '{AMOUNT}': user.deposit_amount }) + '\n';
      } else {
        statusText += t(lang, 'status_no_deposit') + '\n';
      }

      // VIP status
      statusText += '\n';
      if (isVip) {
        statusText += t(lang, 'status_vip');
      } else {
        statusText += t(lang, 'status_not_vip', { '{MIN_DEPOSIT}': MIN_DEPOSIT });
      }

      const markup = buildStatusKeyboard(lang, tid, isVip);
      await tgEditMessage(chatId, messageId, statusText, markup);
      return;
    }
  } catch (err) {
    console.error('[ROVAS] handleCallback error:', err);
  }
}

/**
 * Handle text messages (1Win ID detection).
 */
async function handleMessage(chatId, from, text) {
  const tid = from.id;
  const trimmed = (text || '').trim();

  // Only process if it looks like a 1Win ID: all digits, 5-15 chars
  const isLikelyId = /^\d{5,15}$/.test(trimmed);
  if (!isLikelyId) return; // Not an ID, ignore

  try {
    const user = await getUser(tid);
    const lang = user ? user.language || 'fr' : 'fr';

    // Already registered
    if (user && user.is_registered) {
      await tgSendMessage(chatId, t(lang, 'id_already_registered'));
      return;
    }

    // Save 1Win ID
    await registerOneWinId(tid, trimmed);
    await upsertSession(tid, 'menu', '');

    const confirmText = t(lang, 'id_saved', { '{ID}': trimmed });
    await tgSendMessage(chatId, confirmText);
  } catch (err) {
    console.error('[ROVAS] handleMessage error:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Main webhook handler
// ═══════════════════════════════════════════════════════════════════════
module.exports = async (req, res) => {
  // ── Health check ───────────────────────────────────────────────────
  if (req.method === 'GET') {
    return res.status(200).send('ROVAS Bot en ligne');
  }

  // ── Reject non-POST ───────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Always respond 200 to Telegram ─────────────────────────────────
  res.status(200).json({ ok: true });

  try {
    const update = req.body;
    if (!update) return;

    // ── Callback query ───────────────────────────────────────────────
    if (update.callback_query) {
      await handleCallback(update.callback_query);
      return;
    }

    // ── Message ──────────────────────────────────────────────────────
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const from  = msg.from || {};
      const text  = msg.text || '';
      const tid   = from.id;

      // /start command
      if (text.startsWith('/start')) {
        await handleStart(chatId, from);
        return;
      }

      // Potential 1Win ID
      await handleMessage(chatId, from, text);
      return;
    }
  } catch (err) {
    console.error('[ROVAS] webhook error:', err.message || err);
  }
};
