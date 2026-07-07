import pool from '../config/db.js';
import { categorizeGlucose } from '../utils/glucose.js';

const PATIENT_EMAIL = 'admin@local.dev';
const YEAR = 2026;

const COLUMNS = [
  { key: 'bf', type: 'pre_breakfast', time: '07:00:00' },
  { key: 'bf2', type: 'post_breakfast_2h', time: '09:30:00' },
  { key: 'lunch', type: 'pre_lunch', time: '12:00:00' },
  { key: 'lunch2', type: 'post_lunch_2h', time: '14:30:00' },
  { key: 'dinner', type: 'pre_dinner', time: '18:00:00' },
  { key: 'dinner2', type: 'post_dinner_2h', time: '20:30:00' },
];

const ROWS = [
  { date: '2026-06-20', bf: 74, bf2: 71, lunch: 137, lunch2: 188, dinner: 153, dinner2: 124 },
  { date: '2026-06-21', bf: 78, lunch: 72, lunch2: 80, dinner2: 170 },
  { date: '2026-06-22', bf: 70, bf2: 88, lunch: 146, lunch2: 81, dinner: 121, dinner2: 90 },
  { date: '2026-06-23', bf: 64, bf2: 105, lunch: 105, lunch2: 160, dinner: 64, dinner2: 122 },
  { date: '2026-06-24', bf: 97, bf2: 128, lunch: 79, dinner: 128, dinner2: 172 },
  { date: '2026-06-25', bf: 61, bf2: 122, lunch: 140, lunch2: 130, dinner: 193, dinner2: 153 },
  { date: '2026-06-26', bf: 128, lunch: 198, lunch2: 158, dinner: 116, dinner2: 153, notes: 'Rift Sensor' },
  { date: '2026-06-27', bf: 98, bf2: 160, lunch: 153, lunch2: 175, dinner: 134, dinner2: 176 },
  { date: '2026-06-28', bf2: 117, lunch: 123, lunch2: 179, dinner: 183, dinner2: 207 },
  { date: '2026-06-29', bf: 110, bf2: 150, lunch: 131, lunch2: 169, dinner: 188, dinner2: 248 },
  { date: '2026-06-30', bf: 108, bf2: 170, lunch: 149, lunch2: 114, dinner: 103 },
  { date: '2026-07-01', bf: 97, bf2: 167, lunch: 136, lunch2: 145, dinner: 122, dinner2: 124 },
  { date: '2026-07-02', bf: 94, lunch: 111, lunch2: 115, dinner: 100 },
  { date: '2026-07-03', bf: 71, bf2: 134, lunch: 110, lunch2: 152, dinner: 150, dinner2: 165 },
  { date: '2026-07-04', bf: 92, bf2: 195 },
  { date: '2026-07-05', bf: 100, lunch: 161, lunch2: 137, dinner: 133, dinner2: 98 },
  { date: '2026-07-06', bf: 143, bf2: 179, lunch2: 143, dinner: 141, dinner2: 188 },
  { date: '2026-07-07', bf: 140, bf2: 134 },
];

async function seedGlucoseTable() {
  const [users] = await pool.query('SELECT id, target_low, target_high FROM users WHERE email = ?', [PATIENT_EMAIL]);
  if (!users.length) {
    throw new Error(`User not found: ${PATIENT_EMAIL}. Run npm run seed first.`);
  }

  const userId = users[0].id;
  const targetLow = parseFloat(users[0].target_low);
  const targetHigh = parseFloat(users[0].target_high);

  const dateFrom = `${YEAR}-06-20`;
  const dateTo = `${YEAR}-07-07 23:59:59`;

  const [deleted] = await pool.query(
    `DELETE FROM glucose_logs WHERE user_id = ? AND recorded_at >= ? AND recorded_at <= ?`,
    [userId, dateFrom, dateTo]
  );

  let inserted = 0;
  for (const row of ROWS) {
    const dayNotes = row.notes || null;
    for (const col of COLUMNS) {
      const value = row[col.key];
      if (value == null || value === '' || value === '-') continue;

      const recordedAt = `${row.date} ${col.time}`;
      const category = categorizeGlucose(value, targetLow, targetHigh);

      await pool.query(
        `INSERT INTO glucose_logs
         (user_id, value, reading_type, recorded_at, notes, meal_notes, tags, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          value,
          col.type,
          recordedAt,
          dayNotes,
          null,
          JSON.stringify(['imported']),
          category,
        ]
      );
      inserted += 1;
    }
  }

  await pool.query(
    `UPDATE users SET last_log_date = ?, streak_days = GREATEST(streak_days, 18) WHERE id = ?`,
    ['2026-07-07', userId]
  );

  console.log(`Glucose table import complete for ${PATIENT_EMAIL}`);
  console.log(`  Removed ${deleted.affectedRows} existing logs in range`);
  console.log(`  Inserted ${inserted} readings (${ROWS.length} days)`);
}

seedGlucoseTable()
  .catch((e) => {
    console.error('Import failed:', e.message);
    process.exit(1);
  })
  .finally(() => pool.end());
