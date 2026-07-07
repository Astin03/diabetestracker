import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const USERS = [
  {
    email: 'admin@local.dev',
    password: 'admin123',
    fullName: 'Admin User',
    diabetesType: 'type_2',
  },
  {
    email: 'juliet25tabunan@gmail.com',
    password: 'viewer123',
    fullName: 'Juliet Tabunan',
    diabetesType: 'type_2',
    accountType: 'guardian',
  },
];

async function ensureUser({ email, password, fullName, diabetesType, accountType = 'patient' }) {
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    await pool.query('UPDATE users SET account_type = ? WHERE id = ?', [accountType, existing[0].id]);
    console.log(`User already exists: ${email}`);
    return existing[0].id;
  }

  const hash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, diabetes_type, account_type)
     VALUES (?, ?, ?, ?, ?)`,
    [email, hash, fullName, diabetesType, accountType]
  );
  console.log(`Created user: ${email} / ${password}`);
  return result.insertId;
}

async function acceptPendingInvites(caregiverId, email) {
  const [result] = await pool.query(
    `UPDATE care_access
     SET status = 'accepted', caregiver_id = ?, accepted_at = NOW()
     WHERE LOWER(invited_email) = LOWER(?) AND status = 'pending'`,
    [caregiverId, email]
  );
  if (result.affectedRows) {
    console.log(`Accepted ${result.affectedRows} pending invite(s) for ${email}`);
  }
}

async function seed() {
  for (const user of USERS) {
    const id = await ensureUser(user);
    if (user.email === 'juliet25tabunan@gmail.com') {
      await acceptPendingInvites(id, user.email);
    }
  }

  console.log('\nLogin accounts:');
  for (const user of USERS) {
    console.log(`  ${user.email}  →  ${user.password}`);
  }
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e.message);
    process.exit(1);
  })
  .finally(() => pool.end());
