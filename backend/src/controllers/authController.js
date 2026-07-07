import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { env } from '../config/env.js';

function userPayload(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    diabetesType: row.diabetes_type,
    glucoseUnit: row.glucose_unit,
    targetLow: parseFloat(row.target_low),
    targetHigh: parseFloat(row.target_high),
    timezone: row.timezone,
    notificationsEnabled: !!row.notifications_enabled,
    soundAlerts: !!row.sound_alerts,
    browserNotifications: !!row.browser_notifications,
    darkMode: !!row.dark_mode,
    streakDays: row.streak_days,
    accountType: row.account_type || 'patient',
  };
}

export async function register(req, res, next) {
  try {
    const { email, password, fullName, diabetesType, accountType } = req.body;
    const role = accountType === 'guardian' ? 'guardian' : 'patient';
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, diabetes_type, account_type)
       VALUES (?, ?, ?, ?, ?)`,
      [email, hash, fullName, diabetesType || 'type_2', role]
    );

    if (role === 'guardian') {
      await pool.query(
        `UPDATE care_access SET caregiver_id = ?
         WHERE caregiver_id IS NULL AND LOWER(invited_email) = LOWER(?) AND status = 'pending'`,
        [result.insertId, email]
      );
      await pool.query(
        `UPDATE care_access SET status = 'accepted', accepted_at = NOW()
         WHERE caregiver_id = ? AND status = 'pending'`,
        [result.insertId]
      );
    }
    const token = jwt.sign({ id: result.insertId, email }, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    });
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json({ token, user: userPayload(rows[0]) });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: rows[0].id, email }, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    });
    res.json({ token, user: userPayload(rows[0]) });
  } catch (e) {
    next(e);
  }
}

export async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userPayload(rows[0]) });
  } catch (e) {
    next(e);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const {
      fullName, diabetesType, targetLow, targetHigh, timezone,
      notificationsEnabled, soundAlerts, browserNotifications, darkMode,
    } = req.body;
    await pool.query(
      `UPDATE users SET
        full_name = COALESCE(?, full_name),
        diabetes_type = COALESCE(?, diabetes_type),
        target_low = COALESCE(?, target_low),
        target_high = COALESCE(?, target_high),
        timezone = COALESCE(?, timezone),
        notifications_enabled = COALESCE(?, notifications_enabled),
        sound_alerts = COALESCE(?, sound_alerts),
        browser_notifications = COALESCE(?, browser_notifications),
        dark_mode = COALESCE(?, dark_mode)
       WHERE id = ?`,
      [
        fullName, diabetesType, targetLow, targetHigh, timezone,
        notificationsEnabled != null ? (notificationsEnabled ? 1 : 0) : null,
        soundAlerts != null ? (soundAlerts ? 1 : 0) : null,
        browserNotifications != null ? (browserNotifications ? 1 : 0) : null,
        darkMode != null ? (darkMode ? 1 : 0) : null,
        req.user.id,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: userPayload(rows[0]) });
  } catch (e) {
    next(e);
  }
}
