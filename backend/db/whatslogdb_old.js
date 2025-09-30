// db-setup.js
const { Client, Pool } = require("pg");



// const defaultClient = new Client({
//   user: "postgres",
//   host: "localhost",
//   database: "postgres", // Connect to the default "postgres" database
//   password: "1234",
//   port: 5432,
// });

// // Function to create the database
// const createDatabase = async () => {
//   try {
//     await defaultClient.connect();
//     const res = await defaultClient.query(
//       "SELECT 1 FROM pg_database WHERE datname = 'webapp'"
//     );
//     if (res.rowCount === 0) {
//       await defaultClient.query("CREATE DATABASE webapp");
//       console.log('Database "webapp" created');
//     } else {
//       console.log('Database "webapp" already exists');
//     }
//   } catch (err) {
//     console.error("Error creating/checking database:", err);
//   } finally {
//     await defaultClient.end();
//   }
// };

// PostgreSQL connection settings
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'webapp',
  password: '1234',
  port: 5432, // default PostgreSQL port
});

async function createWhatsappLogsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS whatsapp_logs (
      id SERIAL PRIMARY KEY,
      message_id TEXT UNIQUE, -- WhatsApp message identifier
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      image_url TEXT NOT NULL,
      whatsapp_message_status TEXT NOT NULL, -- sent, delivered, failed, no_whatsapp
      whatsapp_exists BOOLEAN, -- true if number has WhatsApp, false if not
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('✅ whatsapp_logs table created or already exists.');
  } catch (err) {
    console.error('❌ Error creating whatsapp_logs table:', err);
  } finally {
    await pool.end();
  }
}

createWhatsappLogsTable();
