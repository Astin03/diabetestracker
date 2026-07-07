import pool from '../config/db.js';
import {
  ensureChecklistsForRange,
  generateChecklistsForUser,
  resetTodayChecklists,
  purgeInactiveMedicationChecklists,
} from '../services/checklistService.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';

function mapMed(row) {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    notes: row.notes,
    startDate: row.start_date,
    endDate: row.end_date,
    reminderTime: row.reminder_time,
    frequencyType: row.frequency_type,
    frequencyConfig: typeof row.frequency_config === 'string'
      ? JSON.parse(row.frequency_config || '{}')
      : row.frequency_config || {},
    isActive: !!row.is_active,
    createdAt: row.created_at,
  };
}

export async function create(req, res, next) {
  try {
    const {
      name, dosage, notes, startDate, endDate, reminderTime,
      frequencyType, frequencyConfig,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO medications
       (user_id, name, dosage, notes, start_date, end_date, reminder_time, frequency_type, frequency_config)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, name, dosage || null, notes || null,
        startDate, endDate || null, reminderTime,
        frequencyType || 'daily',
        JSON.stringify(frequencyConfig || {}),
      ]
    );

    const end = endDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    await generateChecklistsForUser(req.user.id, startDate, end);

    const [rows] = await pool.query('SELECT * FROM medications WHERE id = ?', [result.insertId]);
    res.status(201).json({ medication: mapMed(rows[0]) });
  } catch (e) {
    next(e);
  }
}

export async function list(req, res, next) {
  try {
    const activeOnly = req.query.active !== 'false';
    const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 12 });

    let where = 'WHERE user_id = ?';
    const params = [req.user.id];
    if (activeOnly) where += ' AND is_active = 1';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM medications ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM medications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      medications: rows.map(mapMed),
      pagination: paginationMeta(page, limit, total),
    });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const {
      name, dosage, notes, startDate, endDate, reminderTime,
      frequencyType, frequencyConfig, isActive,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE medications SET
        name=COALESCE(?, name), dosage=?, notes=?, start_date=COALESCE(?, start_date),
        end_date=?, reminder_time=COALESCE(?, reminder_time),
        frequency_type=COALESCE(?, frequency_type),
        frequency_config=COALESCE(?, frequency_config),
        is_active=COALESCE(?, is_active)
       WHERE id=? AND user_id=?`,
      [
        name, dosage, notes, startDate, endDate, reminderTime,
        frequencyType,
        frequencyConfig ? JSON.stringify(frequencyConfig) : null,
        isActive != null ? (isActive ? 1 : 0) : null,
        req.params.id, req.user.id,
      ]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Medication not found' });
    const [rows] = await pool.query('SELECT * FROM medications WHERE id = ?', [req.params.id]);
    res.json({ medication: mapMed(rows[0]) });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const [result] = await pool.query(
      'UPDATE medications SET is_active = 0 WHERE id = ? AND user_id = ? AND is_active = 1',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Medication not found' });
    await pool.query(
      'DELETE FROM medication_checklists WHERE medication_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

function mapChecklistRow(r) {
  return {
    id: r.id,
    medicationId: r.medication_id,
    name: r.name,
    dosage: r.dosage,
    scheduledDate: r.scheduled_date,
    scheduledTime: r.scheduled_time,
    status: r.status,
    takenAt: r.taken_at,
  };
}

async function fetchTodayChecklistRows(userId) {
  const today = new Date().toISOString().slice(0, 10);
  await purgeInactiveMedicationChecklists(userId);
  const [rows] = await pool.query(
    `SELECT c.*, m.name, m.dosage
     FROM medication_checklists c
     JOIN medications m ON m.id = c.medication_id AND m.is_active = 1
     WHERE c.user_id = ? AND c.scheduled_date = ?
     ORDER BY c.scheduled_time ASC`,
    [userId, today]
  );
  return rows;
}

export async function todayChecklist(req, res, next) {
  try {
    await ensureChecklistsForRange(req.user.id);
    const rows = await fetchTodayChecklistRows(req.user.id);
    res.json({ checklist: rows.map(mapChecklistRow) });
  } catch (e) {
    next(e);
  }
}

export async function resetTodayChecklist(req, res, next) {
  try {
    await resetTodayChecklists(req.user.id);
    const rows = await fetchTodayChecklistRows(req.user.id);
    res.json({
      checklist: rows.map(mapChecklistRow),
      message: "Today's checklist reset",
    });
  } catch (e) {
    next(e);
  }
}

export async function markTaken(req, res, next) {
  try {
    const { id } = req.params;
    const takenAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await pool.query(
      `UPDATE medication_checklists SET status = 'taken', taken_at = ?
       WHERE id = ? AND user_id = ?`,
      [takenAt, id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Checklist item not found' });
    res.json({ success: true, status: 'taken', takenAt });
  } catch (e) {
    next(e);
  }
}

export async function checklistByDate(req, res, next) {
  try {
    const { date } = req.params;
    const [rows] = await pool.query(
      `SELECT c.*, m.name, m.dosage
       FROM medication_checklists c
       JOIN medications m ON m.id = c.medication_id
       WHERE c.user_id = ? AND c.scheduled_date = ?
       ORDER BY c.scheduled_time ASC`,
      [req.user.id, date]
    );
    res.json({
      checklist: rows.map((r) => ({
        id: r.id,
        medicationId: r.medication_id,
        name: r.name,
        dosage: r.dosage,
        scheduledDate: r.scheduled_date,
        scheduledTime: r.scheduled_time,
        status: r.status,
        takenAt: r.taken_at,
      })),
    });
  } catch (e) {
    next(e);
  }
}

export async function calendarMeds(req, res, next) {
  try {
    const { from, to } = req.query;
    const [rows] = await pool.query(
      `SELECT scheduled_date, status, COUNT(*) as count
       FROM medication_checklists
       WHERE user_id = ? AND scheduled_date >= ? AND scheduled_date <= ?
       GROUP BY scheduled_date, status`,
      [req.user.id, from, to]
    );
    res.json({ calendar: rows });
  } catch (e) {
    next(e);
  }
}

export async function missed(req, res, next) {
  try {
    await purgeInactiveMedicationChecklists(req.user.id);
    const [rows] = await pool.query(
      `SELECT c.*, m.name, m.dosage
       FROM medication_checklists c
       JOIN medications m ON m.id = c.medication_id AND m.is_active = 1
       WHERE c.user_id = ? AND c.status = 'missed'
       ORDER BY c.scheduled_date DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ missed: rows });
  } catch (e) {
    next(e);
  }
}
