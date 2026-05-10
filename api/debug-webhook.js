// Debug webhook - temporary
module.exports = async function handler(req, res) {
    if (req.method === 'POST') {
        const body = req.body;
        console.log('[DEBUG] Full update received:', JSON.stringify(body, null, 2));
        
        // Check if it's a callback query
        if (body.callback_query) {
            const q = body.callback_query;
            console.log('[DEBUG] Callback query:', q.data, 'from:', q.from.id, 'chat:', q.message.chat.id, 'msgId:', q.message.message_id);
        }
        
        // Also forward to the real webhook
        try {
            const realRes = await fetch('https://newrovasbot.vercel.app/api/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const realBody = await realRes.text();
            console.log('[DEBUG] Real webhook response:', realRes.status, realBody);
            return res.status(200).send('Debug OK - Real: ' + realBody);
        } catch (e) {
            console.log('[DEBUG] Error forwarding:', e.message);
            return res.status(500).json({ error: e.message, originalBody: body });
        }
    }
    res.status(200).send('Debug endpoint active');
};
