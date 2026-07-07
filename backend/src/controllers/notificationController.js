import pool from '../config/db.js';

export async function list(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({
      notifications: rows.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        message: r.message,
        isRead: !!r.is_read,
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : r.metadata,
        createdAt: r.created_at,
      })),
    });
  } catch (e) {
    next(e);
  }
}

export async function markRead(req, res, next) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

export async function markAllRead(req, res, next) {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

export async function pendingReminders(req, res, next) {
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [rows] = await pool.query(
      `SELECT r.*, m.name as medication_name FROM reminders r
       LEFT JOIN medications m ON m.id = r.medication_id
       WHERE r.user_id = ? AND r.is_sent = 0 AND r.remind_at <= ?
       ORDER BY r.remind_at ASC LIMIT 20`,
      [req.user.id, now]
    );
    res.json({ reminders: rows });
  } catch (e) {
    next(e);
  }
}
