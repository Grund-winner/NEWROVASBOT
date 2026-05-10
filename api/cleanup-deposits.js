// ═══════════════════════════════════════════════════════
// ROVAS V2 - Nettoyage des doublons de depots
// ═══════════════════════════════════════════════════════
const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
    try {
        const pwd = req.query.password;
        if (pwd !== (process.env.ADMIN_PASSWORD || 'rovasadmin2024')) {
            return res.status(403).json({ error: 'Non autorise' });
        }

        const allDeposits = await query('SELECT * FROM deposits ORDER BY created_at DESC');

        const groups = {};
        for (const d of allDeposits) {
            const minute = d.created_at ? d.created_at.toISOString().substring(0, 16) : '';
            const key = d.one_win_user_id + '|' + d.amount + '|' + minute;
            if (!groups[key]) groups[key] = [];
            groups[key].push(d);
        }

        let deleted = [];
        let kept = [];

        for (const [key, group] of Object.entries(groups)) {
            if (group.length <= 1) continue;
            group.sort((a, b) => {
                if (a.transaction_id && !b.transaction_id) return -1;
                if (!a.transaction_id && b.transaction_id) return 1;
                return 0;
            });
            kept.push(group[0]);
            for (let i = 1; i < group.length; i++) {
                await query('DELETE FROM deposits WHERE id = $1', [group[i].id]);
                deleted.push(group[i]);
            }
        }

        const affectedUsers = new Set();
        [...deleted, ...kept].forEach(d => {
            if (d.telegram_id) affectedUsers.add(d.telegram_id);
            if (d.one_win_user_id) affectedUsers.add('win:' + d.one_win_user_id);
        });

        let recalculated = 0;
        const MIN_DEPOSIT = parseFloat(process.env.MIN_DEPOSIT) || 5;
        for (const uid of affectedUsers) {
            let userResult;
            if (uid.startsWith('win:')) {
                const winId = uid.substring(4);
                userResult = await query('SELECT telegram_id FROM users WHERE one_win_user_id = $1', [winId]);
            } else {
                userResult = await query('SELECT telegram_id FROM users WHERE telegram_id = $1', [uid]);
            }
            if (userResult.length > 0 && userResult[0].telegram_id) {
                const tgId = userResult[0].telegram_id;
                const sumResult = await query(
                    "SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE telegram_id = $1 OR one_win_user_id = (SELECT one_win_user_id FROM users WHERE telegram_id = $1)",
                    [tgId]
                );
                const newTotal = parseFloat(sumResult[0].total);
                const isDep = newTotal >= MIN_DEPOSIT;
                await query(
                    'UPDATE users SET deposit_amount = $1, is_deposited = $2, updated_at = NOW() WHERE telegram_id = $3',
                    [newTotal, isDep, tgId]
                );
                recalculated++;
            }
        }

        return res.status(200).json({
            success: true,
            duplicates_removed: deleted.length,
            deleted: deleted.map(d => ({ id: d.id, one_win_user_id: d.one_win_user_id, amount: d.amount, transaction_id: d.transaction_id })),
            users_recalculated: recalculated,
            remaining_deposits: allDeposits.length - deleted.length
        });
    } catch (error) {
        console.error('[CLEANUP ERROR]', error);
        return res.status(500).json({ error: error.message });
    }
};
