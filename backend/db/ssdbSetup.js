const { Client, Pool } = require("pg");

const defaultClient = new Client({
  user: "postgres",
  host: "localhost",
  database: "postgres", // Connect to the default "postgres" database
  password: "eyelike@123./hqrZ",
  port: 5432,
});

// Function to create the database
const createDatabase = async () => {
  try {
    await defaultClient.connect();
    const res = await defaultClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'webapp'"
    );
    if (res.rowCount === 0) {
      await defaultClient.query("CREATE DATABASE webapp");
      console.log('Database "webapp" created');
    } else {
      console.log('Database "webapp" already exists');
    }
  } catch (err) {
    console.error("Error creating/checking database:", err);
  } finally {
    await defaultClient.end();
  }
};

// Function to create the "users" table
const createTable = async () => {
  const pool = new Pool({
    user: "akshay",
    host: "localhost",
    database: "webapp",
    password: "eyelike@123./hqrZ",
    port: 5432,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(100),
        customer_phone VARCHAR(15),
        customer_email TEXT,
        slogan TEXT, 
        image_path TEXT,
        order_amount TEXT,
        user_selected_date DATE NULL,
        user_selected_time TIME NULL,
        payment_status TEXT NOT NULL,
        order_id TEXT,
        transaction_id TEXT NULL,
        payment_currency TEXT NULL,
        payment_completion_time TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Table "users" created or already exists');
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await pool.end();
  }
};

// Initialize database and table
const setupDatabase = async () => {
  await createDatabase();
  await createTable();
};

setupDatabase();
