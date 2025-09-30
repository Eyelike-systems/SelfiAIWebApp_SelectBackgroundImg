// migrate_whatsapp_logs.js
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "webapp",
  password: "1234",
  port: 5432,
});

async function migrateWhatsappLogsTable() {
  const query = `
    -- 1️⃣ Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS whatsapp_logs (
      id SERIAL PRIMARY KEY,
      transaction_id UUID UNIQUE,             -- internal tracking for retries
      message_id TEXT,                         -- WhatsApp's message ID (can change on retry)
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      image_url TEXT NOT NULL,
      whatsapp_message_status TEXT NOT NULL,   -- sent, delivered, failed, permanent_failure
      whatsapp_exists BOOLEAN,
      retry_count INTEGER DEFAULT 0,
      permanent_failed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 2️⃣ Add columns if missing
    ALTER TABLE whatsapp_logs
      ADD COLUMN IF NOT EXISTS transaction_id UUID UNIQUE;

    ALTER TABLE whatsapp_logs
      ADD COLUMN IF NOT EXISTS message_id TEXT;

    ALTER TABLE whatsapp_logs
      ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

    ALTER TABLE whatsapp_logs
      ADD COLUMN IF NOT EXISTS permanent_failed BOOLEAN DEFAULT FALSE;

    ALTER TABLE whatsapp_logs
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- 3️⃣ Remove unique constraint on message_id if it exists
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'whatsapp_logs_message_id_key'
      ) THEN
        ALTER TABLE whatsapp_logs DROP CONSTRAINT whatsapp_logs_message_id_key;
      END IF;
    END$$;
  `;

  try {
    await pool.query(query);
    console.log("✅ whatsapp_logs table migrated successfully.");
  } catch (err) {
    console.error("❌ Error migrating whatsapp_logs table:", err);
  } finally {
    await pool.end();
  }
}

migrateWhatsappLogsTable();
