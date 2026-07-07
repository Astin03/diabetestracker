import pool from '../config/db.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';
import { patientId } from '../utils/patientContext.js';
import { notifyInsulinLogged } from '../services/careNotifyService.js';

const INSULIN_LABELS = { apidra: 'Apidra', lantus: 'Lantus' };
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

function mapLog(row) {
  return {
    id: row.id,
    insulinType: row.insulin_type,
    insulinLabel: INSULIN_LABELS[row.insulin_type] || row.insulin_type,
    meal: row.meal,
    mealLabel: MEAL_LABELS[row.meal] || row.meal,
    units: parseFloat(row.units),
    recordedAt: row.recorded_at,
    notes: row.notes,
    injectionSite: row.injection_site,
    createdAt: row.created_at,
  };
}

export async function create(req, res, next) {
  try {
    const { insulinType, meal, units, recordedAt, notes, injectionSite } = req.body;
    const [result] = await pool.query(
      `INSERT INTO insulin_logs (user_id, insulin_type, meal, units, recorded_at, notes, injection_site)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patientId(req), insulinType, meal, units, recordedAt, notes || null, injectionSite || null]
    );
    const [rows] = await pool.query('SELECT * FROM insulin_logs WHERE id = ?', [result.insertId]);
    notifyInsulinLogged(patientId(req), rows[0]).catch(() => {});
    res.status(201).json({ log: mapLog(rows[0]) });
  } catch (e) {
    next(e);
  }
}

export async function list(req, res, next) {
  try {
    const { from, to, insulinType } = req.query;
    const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 10 });

    let where = 'WHERE user_id = ?';
    const params = [patientId(req)];

    if (from) { where += ' AND recorded_at >= ?'; params.push(from); }
    if (to) { where += ' AND recorded_at <= ?'; params.push(to + ' 23:59:59'); }
    if (insulinType) { where += ' AND insulin_type = ?'; params.push(insulinType); }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM insulin_logs ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM insulin_logs ${where} ORDER BY recorded_at DESC LIMIT ? OFFSET ?`,
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

export async function summary(req, res, next) {
  try {
    const { from, to } = req.query;
    const dateFrom = from || new Date().toISOString().slice(0, 10);
    const dateTo = to || dateFrom;

    const [byType] = await pool.query(
      `SELECT insulin_type, SUM(units) as total_units, COUNT(*) as doses
       FROM insulin_logs
       WHERE user_id = ? AND recorded_at >= ? AND recorded_at <= ?
       GROUP BY insulin_type`,
      [patientId(req), dateFrom, dateTo + ' 23:59:59']
    );

    const [byMeal] = await pool.query(
      `SELECT insulin_type, meal, SUM(units) as total_units, COUNT(*) as doses
       FROM insulin_logs
       WHERE user_id = ? AND recorded_at >= ? AND recorded_at <= ?
       GROUP BY insulin_type, meal`,
      [patientId(req), dateFrom, dateTo + ' 23:59:59']
    );

    const totals = { apidra: { units: 0, doses: 0 }, lantus: { units: 0, doses: 0 } };
    for (const r of byType) {
      totals[r.insulin_type] = {
        units: parseFloat(r.total_units),
        doses: r.doses,
      };
    }

    const meals = ['breakfast', 'lunch', 'dinner'];
    const byMealGrid = {};
    for (const type of ['apidra', 'lantus']) {
      byMealGrid[type] = {};
      for (const meal of meals) {
        byMealGrid[type][meal] = { units: 0, doses: 0 };
      }
    }
    for (const r of byMeal) {
      if (byMealGrid[r.insulin_type]?.[r.meal]) {
        byMealGrid[r.insulin_type][r.meal] = {
          units: parseFloat(r.total_units),
          doses: r.doses,
        };
      }
    }

    res.json({ from: dateFrom, to: dateTo, totals, byMeal: byMealGrid });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { insulinType, meal, units, recordedAt, notes, injectionSite } = req.body;
    const [result] = await pool.query(
      `UPDATE insulin_logs SET insulin_type=?, meal=?, units=?, recorded_at=?, notes=?, injection_site=?
       WHERE id=? AND user_id=?`,
      [insulinType, meal, units, recordedAt, notes, injectionSite, req.params.id, patientId(req)]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Log not found' });
    const [rows] = await pool.query('SELECT * FROM insulin_logs WHERE id = ?', [req.params.id]);
    res.json({ log: mapLog(rows[0]) });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const [result] = await pool.query(
      'DELETE FROM insulin_logs WHERE id = ? AND user_id = ?',
      [req.params.id, patientId(req)]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Log not found' });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
