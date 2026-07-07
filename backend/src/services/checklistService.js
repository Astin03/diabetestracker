import pool from '../config/db.js';

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function parseDate(d) {
  return new Date(d + 'T12:00:00');
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(date, n) {
  const d = parseDate(date);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

function shouldScheduleOnDate(med, dateStr) {
  const start = med.start_date;
  const end = med.end_date;
  if (dateStr < start) return false;
  if (end && dateStr > end) return false;

  const config = typeof med.frequency_config === 'string'
    ? JSON.parse(med.frequency_config || '{}')
    : med.frequency_config || {};

  const d = parseDate(dateStr);
  const dayName = WEEKDAYS[d.getDay()];

  switch (med.frequency_type) {
    case 'daily':
      return true;
    case 'every_other_day': {
      const startD = parseDate(start);
      const diff = Math.floor((d - startD) / (86400000));
      return diff % 2 === 0;
    }
    case 'weekdays':
      return (config.weekdays || []).includes(dayName);
    case 'multiple_daily':
      return true;
    case 'custom_interval': {
      const interval = config.intervalDays || 1;
      const startD = parseDate(start);
      const diff = Math.floor((d - startD) / (86400000));
      return diff % interval === 0;
    }
    default:
      return true;
  }
}

function getTimesForMed(med) {
  const config = typeof med.frequency_config === 'string'
    ? JSON.parse(med.frequency_config || '{}')
    : med.frequency_config || {};

  if (med.frequency_type === 'multiple_daily' && config.times?.length) {
    return config.times;
  }
  return [med.reminder_time?.slice?.(0, 8) || med.reminder_time || '08:00:00'];
}

export async function generateChecklistsForUser(userId, fromDate, toDate) {
  const [meds] = await pool.query(
    `SELECT * FROM medications WHERE user_id = ? AND is_active = 1`,
    [userId]
  );

  let current = fromDate;
  const end = toDate;
  let created = 0;

  while (current <= end) {
    for (const med of meds) {
      if (!shouldScheduleOnDate(med, current)) continue;
      const times = getTimesForMed(med);
      for (const time of times) {
        const t = time.length === 5 ? `${time}:00` : time;
        try {
          await pool.query(
            `INSERT IGNORE INTO medication_checklists
             (user_id, medication_id, scheduled_date, scheduled_time, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [userId, med.id, current, t]
          );
          created++;
        } catch {
          /* duplicate */
        }
      }
    }
    current = addDays(current, 1);
  }
  return created;
}

export async function markMissedChecklists(userId) {
  const today = formatDate(new Date());
  await pool.query(
    `UPDATE medication_checklists c
     INNER JOIN medications m ON m.id = c.medication_id AND m.is_active = 1
     SET c.status = 'missed'
     WHERE c.user_id = ? AND c.scheduled_date < ? AND c.status = 'pending'`,
    [userId, today]
  );
}

/** Remove checklist rows tied to deleted/inactive medications. */
export async function purgeInactiveMedicationChecklists(userId) {
  await pool.query(
    `DELETE c FROM medication_checklists c
     INNER JOIN medications m ON m.id = c.medication_id
     WHERE c.user_id = ? AND m.is_active = 0`,
    [userId]
  );
}

export async function ensureChecklistsForRange(userId, daysAhead = 30) {
  const today = formatDate(new Date());
  const end = addDays(today, daysAhead);
  await markMissedChecklists(userId);
  return generateChecklistsForUser(userId, today, end);
}

/** Delete today's checklist rows and rebuild from active medications. */
export async function resetTodayChecklists(userId) {
  const today = formatDate(new Date());
  await pool.query(
    `DELETE FROM medication_checklists WHERE user_id = ? AND scheduled_date = ?`,
    [userId, today]
  );
  await generateChecklistsForUser(userId, today, today);
  return today;
}
