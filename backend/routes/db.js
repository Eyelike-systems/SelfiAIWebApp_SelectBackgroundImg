const { Pool } = require("pg");

const db = new Pool({
  user: "postgres",
  host: "localhost",
  database: "webapp",
  password: "1234",
  port: 5432,

  // Connection pool settings
  max: 10,                      // Maximum number of connections in pool
  idleTimeoutMillis: 30000,     // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000 // Timeout if connection takes > 5s

});

module.exports = db;
