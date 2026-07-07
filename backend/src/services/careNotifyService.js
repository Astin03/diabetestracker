import pool from '../config/db.js';
import { getGlucoseLabel } from '../utils/glucose.js';

const INSULIN_LABELS = { apidra: 'Apidra', lantus: 'Lantus' };
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

async function getPatientName(patientId) {
  const [rows] = await pool.query('SELECT full_name FROM users WHERE id = ?', [patientId]);
  return rows[0]?.full_name || 'Patient';
}

export async function notifyPatientCaregivers(patientUserId, { type, title, message, metadata = {} }) {
  const [caregivers] = await pool.query(
    `SELECT ca.caregiver_id
     FROM care_access ca
     JOIN users u ON u.id = ca.caregiver_id
     WHERE ca.patient_id = ? AND ca.status = 'accepted' AND ca.caregiver_id IS NOT NULL
       AND u.notifications_enabled = 1`,
    [patientUserId]
  );

  if (!caregivers.length) return;

  const meta = JSON.stringify({ patientId: patientUserId, ...metadata });

  for (const row of caregivers) {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, metadata) VALUES (?, ?, ?, ?, ?)`,
      [row.caregiver_id, type, title, message, meta]
    );
  }
}

export async function notifyGlucoseLogged(patientUserId, log) {
  const name = await getPatientName(patientUserId);
  const level = getGlucoseLabel(log.category);
  await notifyPatientCaregivers(patientUserId, {
    type: 'glucose_alert',
    title: `${name} logged glucose`,
    message: `${log.value} mg/dL — ${level}`,
    metadata: { logId: log.id, category: log.category, value: log.value },
  });
}

export async function notifyInsulinLogged(patientUserId, log) {
  const name = await getPatientName(patientUserId);
  const insulin = INSULIN_LABELS[log.insulin_type] || log.insulin_type;
  const meal = MEAL_LABELS[log.meal] || log.meal;
  await notifyPatientCaregivers(patientUserId, {
    type: 'system',
    title: `${name} injected insulin`,
    message: `${log.units} units ${insulin} (${meal})`,
    metadata: { logId: log.id, kind: 'insulin', insulinType: log.insulin_type, units: log.units },
  });
}

export async function notifyMedicationTaken(patientUserId, { medicationName, scheduledTime }) {
  const name = await getPatientName(patientUserId);
  await notifyPatientCaregivers(patientUserId, {
    type: 'medication',
    title: `${name} took medication`,
    message: `${medicationName}${scheduledTime ? ` at ${scheduledTime}` : ''}`,
    metadata: { medicationName, scheduledTime },
  });
}
