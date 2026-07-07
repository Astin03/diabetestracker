import pool from '../config/db.js';
import { categorizeGlucose } from '../utils/glucose.js';
import { estimateA1C, glucoseStats, timeInRange } from '../utils/a1c.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';

function mapLog(row) {
  return {
    id: row.id,
    value: parseFloat(row.value),
    readingType: row.reading_type,
    recordedAt: row.recorded_at,
    notes: row.notes,
    mealNotes: row.meal_notes,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : row.tags || [],
    category: row.category,
    createdAt: row.created_at,
  };
}

async function updateStreak(userId, logDate) {
  const dateOnly = logDate.slice(0, 10);
  const [users] = await pool.query('SELECT streak_days, last_log_date FROM users WHERE id = ?', [userId]);
  const u = users[0];
  let streak = u.streak_days || 0;
  const last = u.last_log_date ? String(u.last_log_date).slice(0, 10) : null;

  if (last === dateOnly) return;
  const yesterday = new Date(dateOnly);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);

  if (last === yStr) streak += 1;
  else if (last !== dateOnly) streak = 1;

  await pool.query('UPDATE users SET streak_days = ?, last_log_date = ? WHERE id = ?', [
    streak, dateOnly, userId,
  ]);
}

export async function create(req, res, next) {
  try {
    const { value, readingType, recordedAt, notes, mealNotes, tags } = req.body;
    const [users] = await pool.query('SELECT target_low, target_high FROM users WHERE id = ?', [req.user.id]);
    const { target_low, target_high } = users[0];
    const category = categorizeGlucose(value, parseFloat(target_low), parseFloat(target_high));

    const [result] = await pool.query(
      `INSERT INTO glucose_logs
       (user_id, value, reading_type, recorded_at, notes, meal_notes, tags, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, value, readingType || 'random', recordedAt,
        notes || null, mealNotes || null,
        JSON.stringify(tags || []), category,
      ]
    );
    await updateStreak(req.user.id, recordedAt);

    const [rows] = await pool.query('SELECT * FROM glucose_logs WHERE id = ?', [result.insertId]);
    res.status(201).json({ log: mapLog(rows[0]) });
  } catch (e) {
    next(e);
  }
}

function buildGlucoseWhere(userId, query) {
  const { from, to, readingType, category, search } = query;
  let where = 'WHERE user_id = ?';
  const params = [userId];

  if (from) { where += ' AND recorded_at >= ?'; params.push(from); }
  if (to) { where += ' AND recorded_at <= ?'; params.push(to + ' 23:59:59'); }
  if (readingType) { where += ' AND reading_type = ?'; params.push(readingType); }
  if (category) { where += ' AND category = ?'; params.push(category); }
  if (search) {
    where += ' AND (notes LIKE ? OR meal_notes LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  return { where, params };
}

export async function list(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 10 });
    const { where, params } = buildGlucoseWhere(req.user.id, req.query);

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM glucose_logs ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM glucose_logs ${where} ORDER BY recorded_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      logs: rows.map(mapLog),
      pagination: paginationMeta(page, limit, total),
    });
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM glucose_logs WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Log not found' });
    res.json({ log: mapLog(rows[0]) });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { value, readingType, recordedAt, notes, mealNotes, tags } = req.body;
    const [users] = await pool.query('SELECT target_low, target_high FROM users WHERE id = ?', [req.user.id]);
    const category = categorizeGlucose(value, parseFloat(users[0].target_low), parseFloat(users[0].target_high));

    const [result] = await pool.query(
      `UPDATE glucose_logs SET value=?, reading_type=?, recorded_at=?, notes=?, meal_notes=?, tags=?, category=?
       WHERE id=? AND user_id=?`,
      [value, readingType, recordedAt, notes, mealNotes, JSON.stringify(tags || []), category, req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Log not found' });
    const [rows] = await pool.query('SELECT * FROM glucose_logs WHERE id = ?', [req.params.id]);
    res.json({ log: mapLog(rows[0]) });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const [result] = await pool.query(
      'DELETE FROM glucose_logs WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Log not found' });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

export async function summary(req, res, next) {
  try {
    const { from, to, period = 'day' } = req.query;
    const [users] = await pool.query('SELECT target_low, target_high FROM users WHERE id = ?', [req.user.id]);
    const targetLow = parseFloat(users[0].target_low);
    const targetHigh = parseFloat(users[0].target_high);

    let dateFrom = from;
    let dateTo = to;
    if (dateFrom && !dateTo) {
      dateTo = new Date().toISOString().slice(0, 10);
    }
    if (!dateFrom) {
      const now = new Date();
      if (period === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        dateFrom = d.toISOString().slice(0, 10);
      } else if (period === 'month') {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        dateFrom = d.toISOString().slice(0, 10);
      } else {
        dateFrom = now.toISOString().slice(0, 10);
      }
      dateTo = now.toISOString().slice(0, 10);
    }

    const dateEnd = (dateTo || dateFrom) + ' 23:59:59';
    const [rows] = await pool.query(
      `SELECT * FROM glucose_logs WHERE user_id = ? AND recorded_at >= ? AND recorded_at <= ? ORDER BY recorded_at ASC`,
      [req.user.id, dateFrom, dateEnd]
    );
    const logs = rows.map(mapLog);
    const stats = glucoseStats(logs);
    const tir = timeInRange(logs, targetLow, targetHigh);

    const { page: timelinePage, limit: timelineLimit, offset } = parsePagination(
      { page: req.query.timelinePage, limit: req.query.timelineLimit },
      { defaultLimit: 10 }
    );
    const timelineDesc = [...logs].sort(
      (a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)
    );
    const timeline = timelineDesc.slice(offset, offset + timelineLimit);

    res.json({
      logs,
      timeline,
      timelinePagination: paginationMeta(timelinePage, timelineLimit, timelineDesc.length),
      stats: { ...stats, estimatedA1C: estimateA1C(stats.avg) },
      timeInRange: tir,
      targetLow,
      targetHigh,
    });
  } catch (e) {
    next(e);
  }
}
