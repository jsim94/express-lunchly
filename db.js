/** Database setup for lunchly. */
const Pool = require("pg").Pool;

let DB;

if (process.env.NODE_ENV === "test") {
  DB = "lunchly_test";
} else {
  DB = "lunchly";
}
const DB_URI = `postgresql:///${DB}`;

const pool = new Pool({
  host: "localhost",
  database: DB,
  password: "admin",
});

module.exports = pool;
