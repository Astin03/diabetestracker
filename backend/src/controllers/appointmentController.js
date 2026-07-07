import pool from '../config/db.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';

function mapAppt(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    appointmentAt: row.appointment_at,
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function create(req, res, next) {
  try {
    const { title, type, appointmentAt, location, notes } = req.body;
    const [result] = await pool.query(
      `INSERT INTO appointments (user_id, title, type, appointment_at, location, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, type || 'doctor', appointmentAt, location || null, notes || null]
    );
    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [result.insertId]);
    res.status(201).json({ appointment: mapAppt(rows[0]) });
  } catch (e) {
    next(e);
  }
}

export async function list(req, res, next) {
  try {
    const { from, to, status } = req.query;
    const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 10 });

    let where = 'WHERE user_id = ?';
    const params = [req.user.id];
    if (from) { where += ' AND appointment_at >= ?'; params.push(from); }
    if (to) { where += ' AND appointment_at <= ?'; params.push(to.includes(' ') ? to : `${to} 23:59:59`); }
    if (status === 'upcoming') where += ' AND appointment_at >= NOW()';
    if (status === 'past') where += ' AND appointment_at < NOW()';

    const order = status === 'past' ? 'DESC' : 'ASC';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM appointments ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM appointments ${where} ORDER BY appointment_at ${order} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      appointments: rows.map(mapAppt),
      pagination: paginationMeta(page, limit, total),
    });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { title, type, appointmentAt, location, notes } = req.body;
    const [result] = await pool.query(
      `UPDATE appointments SET title=?, type=?, appointment_at=?, location=?, notes=?
       WHERE id=? AND user_id=?`,
      [title, type, appointmentAt, location, notes, req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Appointment not found' });
    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ appointment: mapAppt(rows[0]) });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const [result] = await pool.query(
      'DELETE FROM appointments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
