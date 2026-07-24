'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const email = (process.env.PROVISION_ADMIN_EMAIL || 'runtime-admin@example.com').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || 'RuntimeAcceptance123!';
  const name = process.env.PROVISION_ADMIN_NAME || 'RuntimeAdmin';
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,'admin')
     ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash,role='admin',updated_at=NOW()`,
    [name, email, hash]
  );
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
