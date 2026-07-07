import pool from '../config/db.js';

export async function resolvePatientContext(req, res, next) {
  const raw = req.headers['x-patient-id'];
  const requestedId = raw ? parseInt(raw, 10) : null;

  if (!requestedId || requestedId === req.user.id) {
    req.patientContext = { patientId: req.user.id, role: 'owner' };
    return next();
  }

  const [rows] = await pool.query(
    `SELECT u.full_name AS patient_name
     FROM care_access ca
     JOIN users u ON u.id = ca.patient_id
     WHERE ca.caregiver_id = ? AND ca.patient_id = ? AND ca.status = 'accepted'`,
    [req.user.id, requestedId]
  );

  if (!rows.length) {
    return res.status(403).json({ error: 'You do not have access to this patient\'s data' });
  }

  req.patientContext = {
    patientId: requestedId,
    role: 'viewer',
    patientName: rows[0].patient_name,
  };
  next();
}

export function requireWriteAccess(req, res, next) {
  if (req.patientContext?.role === 'viewer') {
    return res.status(403).json({ error: 'View-only access — you cannot modify this patient\'s data' });
  }
  next();
}
