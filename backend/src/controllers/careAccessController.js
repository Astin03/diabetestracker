import crypto from 'crypto';
import pool from '../config/db.js';

function mapViewer(row) {
  return {
    id: row.id,
    email: row.invited_email,
    displayName: row.display_name,
    caregiverName: row.caregiver_name || null,
    status: row.status,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

export async function listViewers(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT ca.*, u.full_name AS caregiver_name
       FROM care_access ca
       LEFT JOIN users u ON u.id = ca.caregiver_id
       WHERE ca.patient_id = ? AND ca.status != 'revoked'
       ORDER BY ca.created_at DESC`,
      [req.user.id]
    );
    res.json({ viewers: rows.map(mapViewer) });
  } catch (e) {
    next(e);
  }
}

export async function inviteViewer(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const displayName = req.body.displayName?.trim() || null;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const [self] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
    if (self[0]?.email?.toLowerCase() === email) {
      return res.status(400).json({ error: 'You cannot add yourself as a viewer' });
    }

    const [existing] = await pool.query(
      `SELECT id, status FROM care_access WHERE patient_id = ? AND LOWER(invited_email) = ?`,
      [req.user.id, email]
    );

    const [users] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [email]);
    const caregiverId = users.length ? users[0].id : null;
    const token = crypto.randomBytes(32).toString('hex');

    if (existing.length) {
      const row = existing[0];
      if (row.status !== 'revoked') {
        return res.status(409).json({ error: 'This person already has access or a pending invite' });
      }

      await pool.query(
        `UPDATE care_access
         SET status = 'pending', caregiver_id = ?, display_name = ?, invite_token = ?,
             accepted_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [caregiverId, displayName, token, row.id]
      );

      return res.status(201).json({
        viewer: {
          id: row.id,
          email,
          displayName,
          status: 'pending',
          caregiverRegistered: !!caregiverId,
        },
      });
    }

    const [result] = await pool.query(
      `INSERT INTO care_access (patient_id, caregiver_id, invited_email, display_name, invite_token, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, caregiverId, email, displayName, token]
    );

    res.status(201).json({
      viewer: {
        id: result.insertId,
        email,
        displayName,
        status: 'pending',
        caregiverRegistered: !!caregiverId,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function revokeViewer(req, res, next) {
  try {
    const [result] = await pool.query(
      `UPDATE care_access SET status = 'revoked' WHERE id = ? AND patient_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Viewer not found' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function listPatients(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT ca.patient_id, u.full_name, u.email, ca.accepted_at
       FROM care_access ca
       JOIN users u ON u.id = ca.patient_id
       WHERE ca.caregiver_id = ? AND ca.status = 'accepted'
       ORDER BY u.full_name`,
      [req.user.id]
    );
    res.json({
      patients: rows.map((r) => ({
        id: r.patient_id,
        fullName: r.full_name,
        email: r.email,
        acceptedAt: r.accepted_at,
      })),
    });
  } catch (e) {
    next(e);
  }
}

export async function listInvites(req, res, next) {
  try {
    const [self] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
    const email = self[0]?.email?.toLowerCase();

    await pool.query(
      `UPDATE care_access SET caregiver_id = ? WHERE caregiver_id IS NULL AND LOWER(invited_email) = ? AND status = 'pending'`,
      [req.user.id, email]
    );

    const [rows] = await pool.query(
      `SELECT ca.id, ca.created_at, u.full_name AS patient_name, u.id AS patient_id
       FROM care_access ca
       JOIN users u ON u.id = ca.patient_id
       WHERE ca.status = 'pending' AND ca.caregiver_id = ?
       ORDER BY ca.created_at DESC`,
      [req.user.id]
    );

    res.json({
      invites: rows.map((r) => ({
        id: r.id,
        patientId: r.patient_id,
        patientName: r.patient_name,
        createdAt: r.created_at,
      })),
    });
  } catch (e) {
    next(e);
  }
}

export async function acceptInvite(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM care_access WHERE id = ? AND status = 'pending'`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Invite not found' });

    const invite = rows[0];
    const [self] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
    const email = self[0]?.email?.toLowerCase();

    if (invite.caregiver_id !== req.user.id && invite.invited_email.toLowerCase() !== email) {
      return res.status(403).json({ error: 'This invite is not for you' });
    }

    await pool.query(
      `UPDATE care_access SET status = 'accepted', caregiver_id = ?, accepted_at = NOW() WHERE id = ?`,
      [req.user.id, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
