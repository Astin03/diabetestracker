import pool from '../config/db.js';

export async function exportCsv(req, res, next) {
  try {
    const { from, to } = req.query;
    let sql = 'SELECT * FROM glucose_logs WHERE user_id = ?';
    const params = [req.user.id];
    if (from) { sql += ' AND recorded_at >= ?'; params.push(from); }
    if (to) { sql += ' AND recorded_at <= ?'; params.push(to + ' 23:59:59'); }
    sql += ' ORDER BY recorded_at ASC';

    const [rows] = await pool.query(sql, params);
    const header = 'Date,Time,Value (mg/dL),Reading Type,Category,Notes,Meal Notes,Tags\n';
    const lines = rows.map((r) => {
      const dt = new Date(r.recorded_at);
      const tags = typeof r.tags === 'string' ? r.tags : JSON.stringify(r.tags || []);
      return [
        r.recorded_at?.slice?.(0, 10) || r.recorded_at,
        r.recorded_at?.slice?.(11, 19) || '',
        r.value,
        r.reading_type,
        r.category,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
        `"${(r.meal_notes || '').replace(/"/g, '""')}"`,
        `"${tags.replace(/"/g, '""')}"`,
      ].join(',');
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=astin-glucose-export.csv');
    res.send(header + lines.join('\n'));
  } catch (e) {
    next(e);
  }
}

export async function exportData(req, res, next) {
  try {
    const userId = req.user.id;
    const [logs] = await pool.query('SELECT * FROM glucose_logs WHERE user_id = ?', [userId]);
    const [meds] = await pool.query('SELECT * FROM medications WHERE user_id = ?', [userId]);
    const [checklists] = await pool.query('SELECT * FROM medication_checklists WHERE user_id = ?', [userId]);
    const [appts] = await pool.query('SELECT * FROM appointments WHERE user_id = ?', [userId]);
    const [insulin] = await pool.query('SELECT * FROM insulin_logs WHERE user_id = ?', [userId]);
    const [user] = await pool.query(
      'SELECT id, email, full_name, diabetes_type, target_low, target_high, timezone FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      exportedAt: new Date().toISOString(),
      user: user[0],
      glucoseLogs: logs,
      medications: meds,
      medicationChecklists: checklists,
      appointments: appts,
      insulinLogs: insulin,
    });
  } catch (e) {
    next(e);
  }
}

export async function restoreData(req, res, next) {
  try {
    const { glucoseLogs, medications, appointments } = req.body;
    const userId = req.user.id;

    if (glucoseLogs?.length) {
      for (const log of glucoseLogs) {
        await pool.query(
          `INSERT INTO glucose_logs
           (user_id, value, reading_type, recorded_at, notes, meal_notes, tags, category)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId, log.value, log.reading_type || log.readingType,
            log.recorded_at || log.recordedAt, log.notes, log.meal_notes || log.mealNotes,
            JSON.stringify(log.tags || []), log.category,
          ]
        );
      }
    }

    res.json({ success: true, message: 'Restore completed (partial import)' });
  } catch (e) {
    next(e);
  }
}
