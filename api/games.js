const { query } = require('../lib/db');

// ═══════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'NewROVASadmin22';

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate a URL-safe slug from a name.
 * e.g. "Aviator Predict" → "aviator-predict"
 */
function slugify(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse body for both JSON and multipart/form-data.
 */
function parseBody(req) {
  const raw = req.body || {};
  if (typeof raw === 'object' && !Buffer.isBuffer(raw)) {
    return raw;
  }
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return {};
}

// ═══════════════════════════════════════════════════════════════════════
// Action handlers
// ═══════════════════════════════════════════════════════════════════════

/**
 * list — Get all games ordered by sort_order
 */
async function handleList() {
  const { rows } = await query(
    'SELECT * FROM games ORDER BY sort_order ASC, created_at DESC',
  );
  return rows;
}

/**
 * add — Insert a new game
 */
async function handleAdd(body) {
  const { name, prediction, description, image_url, game_url } = body;
  if (!name || !name.trim()) {
    return { success: false, error: 'name is required' };
  }

  // Generate slug from name if not provided
  let slug = body.slug;
  if (!slug || !slug.trim()) {
    slug = slugify(name);
  }
  if (!slug) {
    return { success: false, error: 'Could not generate a valid slug from the name' };
  }

  // Check for duplicate slug
  const { rows: existing } = await query(
    'SELECT id FROM games WHERE slug = $1 LIMIT 1',
    [slug],
  );
  if (existing.length > 0) {
    // Append a random suffix to make it unique
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const { rows } = await query(
    `INSERT INTO games (slug, name, prediction, description, image_url, game_url, is_active, sort_order, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE, COALESCE($7, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM games)), NOW(), NOW())
     RETURNING *`,
    [slug, name.trim(), prediction || null, description || null, image_url || null, game_url || null, body.sort_order ? parseInt(body.sort_order, 10) : null],
  );

  return { success: true, game: rows[0] };
}

/**
 * edit — Update a game by id
 */
async function handleEdit(body) {
  const gameId = parseInt(body.game_id || body.id, 10);
  if (!gameId) {
    return { success: false, error: 'game_id is required' };
  }

  // Check game exists
  const { rows: existing } = await query(
    'SELECT id FROM games WHERE id = $1',
    [gameId],
  );
  if (existing.length === 0) {
    return { success: false, error: 'Game not found' };
  }

  const fields = [];
  const params = [];
  let paramIdx = 1;

  const updatableFields = [
    'name', 'prediction', 'description', 'image_url', 'game_url',
  ];

  for (const field of updatableFields) {
    if (body[field] !== undefined) {
      fields.push(`${field} = $${paramIdx++}`);
      params.push(body[field]);
    }
  }

  // is_active (boolean)
  if (body.is_active !== undefined) {
    fields.push(`is_active = ${body.is_active === true || body.is_active === 'true'}`);
  }

  // sort_order (integer)
  if (body.sort_order !== undefined) {
    fields.push(`sort_order = $${paramIdx++}`);
    params.push(parseInt(body.sort_order, 10) || 0);
  }

  if (fields.length === 0) {
    return { success: false, error: 'No fields to update' };
  }

  fields.push('updated_at = NOW()');

  params.push(gameId);
  await query(
    `UPDATE games SET ${fields.join(', ')} WHERE id = $${paramIdx}`,
    params,
  );

  const { rows: [game] } = await query(
    'SELECT * FROM games WHERE id = $1',
    [gameId],
  );

  return { success: true, game };
}

/**
 * delete — Delete a game by game_id
 */
async function handleDelete(body) {
  const gameId = parseInt(body.game_id || body.id, 10);
  if (!gameId) {
    return { success: false, error: 'game_id is required' };
  }

  const { rowCount } = await query(
    'DELETE FROM games WHERE id = $1',
    [gameId],
  );

  if (rowCount === 0) {
    return { success: false, error: 'Game not found' };
  }

  return { success: true, deleted: gameId };
}

/**
 * toggle_active — Flip is_active for a game
 */
async function handleToggleActive(body) {
  const gameId = parseInt(body.game_id || body.id, 10);
  if (!gameId) {
    return { success: false, error: 'game_id is required' };
  }

  const { rows } = await query(
    `UPDATE games SET is_active = NOT is_active, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [gameId],
  );

  if (rows.length === 0) {
    return { success: false, error: 'Game not found' };
  }

  return { success: true, game: rows[0] };
}

/**
 * public — Get active games only (for predictions page, no auth required)
 */
async function handlePublic() {
  const { rows } = await query(
    'SELECT * FROM games WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC',
  );
  return rows;
}

// ═══════════════════════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════════════════════
module.exports = async (req, res) => {
  // ── Public endpoint: active games (no auth) ────────────────────────
  if (req.method === 'GET') {
    const action = (req.query.action || '').toLowerCase().trim();

    // Public endpoint — no auth needed
    if (action === 'public') {
      try {
        const data = await handlePublic();
        return res.status(200).json({ success: true, data });
      } catch (err) {
        console.error('[games/public] Error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }

    // Authenticated GET endpoints
    const password = req.query.password || '';
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      let data;
      switch (action) {
        case 'list':
          data = await handleList();
          break;
        default:
          return res.status(400).json({ error: 'Action non reconnue' });
      }
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error(`[games] GET error on action "${action}":`, err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // ── POST endpoints ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = parseBody(req);
    const action = (body.action || '').toLowerCase().trim();

    // Public POST for list (auth optional)
    if (action === 'list') {
      const password = body.password || req.query.password || '';
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      try {
        const data = await handleList();
        return res.status(200).json({ success: true, data });
      } catch (err) {
        console.error('[games/list] Error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }

    // Auth check for write operations
    const password = body.password || req.query.password || '';
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      let result;

      switch (action) {
        case 'add':
          result = await handleAdd(body);
          break;
        case 'edit':
          result = await handleEdit(body);
          break;
        case 'delete':
          result = await handleDelete(body);
          break;
        case 'toggle_active':
          result = await handleToggleActive(body);
          break;
        default:
          return res.status(400).json({ error: 'Action non reconnue' });
      }

      return res.status(200).json(result);
    } catch (err) {
      console.error(`[games] POST error on action "${action}":`, err);
      return res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
    }
  }

  // Other methods not allowed
  return res.status(405).json({ error: 'Method not allowed' });
};
