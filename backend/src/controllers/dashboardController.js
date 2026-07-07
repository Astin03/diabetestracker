import pool from '../config/db.js';
import { estimateA1C, glucoseStats, timeInRange } from '../utils/a1c.js';
import { patientId } from '../utils/patientContext.js';
import {
  ensureChecklistsForRange,
  purgeInactiveMedicationChecklists,
} from '../services/checklistService.js';

export async function getDashboard(req, res, next) {
  try {
    const userId = patientId(req);
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    const targetLow = parseFloat(user.target_low);
    const targetHigh = parseFloat(user.target_high);

    const [todayLogs] = await pool.query(
      `SELECT * FROM glucose_logs WHERE user_id = ? AND DATE(recorded_at) = ? ORDER BY recorded_at ASC`,
      [userId, today]
    );

    const [weekLogs] = await pool.query(
      `SELECT * FROM glucose_logs WHERE user_id = ? AND recorded_at >= ? ORDER BY recorded_at ASC`,
      [userId, weekAgo]
    );

    const [recentLogs] = await pool.query(
      `SELECT * FROM glucose_logs WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 5`,
      [userId]
    );

    await ensureChecklistsForRange(userId);
    await purgeInactiveMedicationChecklists(userId);

    const [checklist] = await pool.query(
      `SELECT c.*, m.name FROM medication_checklists c
       JOIN medications m ON m.id = c.medication_id AND m.is_active = 1
       WHERE c.user_id = ? AND c.scheduled_date = ? ORDER BY c.scheduled_time`,
      [userId, today]
    );

    const [missedMeds] = await pool.query(
      `SELECT COUNT(*) as count FROM medication_checklists c
       INNER JOIN medications m ON m.id = c.medication_id AND m.is_active = 1
       WHERE c.user_id = ? AND c.status = 'missed' AND c.scheduled_date >= ?`,
      [userId, weekAgo]
    );

    const todayStats = glucoseStats(todayLogs);
    const weekStats = glucoseStats(weekLogs);
    const tir = timeInRange(weekLogs, targetLow, targetHigh);

    const mapLog = (r) => ({
      id: r.id,
      value: parseFloat(r.value),
      readingType: r.reading_type,
      recordedAt: r.recorded_at,
      category: r.category,
    });

    res.json({
      today: {
        logs: todayLogs.map(mapLog),
        stats: { ...todayStats, estimatedA1C: estimateA1C(todayStats.avg) },
      },
      week: {
        stats: { ...weekStats, estimatedA1C: estimateA1C(weekStats.avg) },
        timeInRange: tir,
        logs: weekLogs.map(mapLog),
      },
      recentReadings: recentLogs.map(mapLog),
      medicationChecklist: checklist.map((c) => ({
        id: c.id,
        name: c.name,
        scheduledTime: c.scheduled_time,
        status: c.status,
      })),
      missedMedicationCount: Number(missedMeds[0].count) || 0,
      streakDays: user.streak_days,
      targetLow,
      targetHigh,
    });
  } catch (e) {
    next(e);
  }
}

export async function getCalendarDay(req, res, next) {
  try {
    const { date } = req.params;
    const userId = patientId(req);

    const [logs] = await pool.query(
      `SELECT * FROM glucose_logs WHERE user_id = ? AND DATE(recorded_at) = ? ORDER BY recorded_at`,
      [userId, date]
    );

    const [meds] = await pool.query(
      `SELECT c.*, m.name, m.dosage FROM medication_checklists c
       JOIN medications m ON m.id = c.medication_id
       WHERE c.user_id = ? AND c.scheduled_date = ?`,
      [userId, date]
    );

    const [appts] = await pool.query(
      `SELECT * FROM appointments WHERE user_id = ? AND DATE(appointment_at) = ?`,
      [userId, date]
    );

    const [insulin] = await pool.query(
      `SELECT * FROM insulin_logs WHERE user_id = ? AND DATE(recorded_at) = ? ORDER BY recorded_at`,
      [userId, date]
    );

    const [users] = await pool.query('SELECT target_low, target_high FROM users WHERE id = ?', [userId]);
    const stats = glucoseStats(logs);

    res.json({
      date,
      glucoseLogs: logs,
      insulinLogs: insulin.map((r) => ({
        id: r.id,
        insulinType: r.insulin_type,
        meal: r.meal,
        units: parseFloat(r.units),
        recordedAt: r.recorded_at,
        notes: r.notes,
      })),
      medications: meds,
      appointments: appts.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        appointmentAt: r.appointment_at,
        location: r.location,
        notes: r.notes,
      })),
      stats: { ...stats, estimatedA1C: estimateA1C(stats.avg) },
      targetLow: parseFloat(users[0].target_low),
      targetHigh: parseFloat(users[0].target_high),
    });
  } catch (e) {
    next(e);
  }
}
