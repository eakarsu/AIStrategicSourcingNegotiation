// Shim to provide a Pool to legacy gap routes that did `require('../db')`.
// The canonical pool is created in server.js and attached to app.locals.pool,
// but these routes import the module directly, so we export an equivalent Pool.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
module.exports.pool = pool;
module.exports.query = (text, params) => pool.query(text, params);
