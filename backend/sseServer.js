const express = require('express');
const fs = require('fs');
const { Pool } = require('pg');
const cors = require("cors");

const app = express();
const PORT = 4000;

app.use(
  cors({
    origin: "*", // Allow all origins (change in production)
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// // PostgreSQL connection setup
// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'webapp',
//   password: '1234',
//   port: 5432,
// });

const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: String(process.env.DATABASE_PASS),
    port: parseInt(process.env.DATABASE_PORT, 10),
});

// SSE Endpoint
app.get("/api/items", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sentDataIds = new Set();

  const sendSSEEvent = (message) => {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  };

  // Send last 5 successful entries initially (one every 2 seconds)
  try {
    const initialQuery = `
      SELECT * FROM users
      WHERE payment_status = 'SUCCESS'
      ORDER BY id DESC
      LIMIT 5
    `;
    const result = await pool.query(initialQuery);

    if (result.rows.length > 0) {
      const rows = result.rows; // Chronological order

      for (const item of rows) {
        const imagePath = item.image_path;

        try {
          const imageData = await fs.promises.readFile(imagePath, "base64");
          item.image_base64 = `data:image/png;base64,${imageData}`;
        } catch (fileError) {
          console.error("Error reading image file:", fileError);
          item.image_base64 = null;
        }

        sendSSEEvent([item]); // Send as array with one item
        sentDataIds.add(item.id);
        await new Promise(resolve => setTimeout(resolve, 100)); // 2s delay
      }
    } else {
      console.log("No initial data found.");
    }
  } catch (err) {
    console.error("Error sending initial data:", err);
  }

  // Start regular polling every 10 seconds
  const intervalId = setInterval(async () => {
    try {
      const currentDate = new Date();
      const currentDateString = currentDate.toISOString().split("T")[0];
      const currentTimeString = currentDate.toTimeString().split(":").slice(0, 2).join(":");

      const query = `
        SELECT * FROM users
        WHERE user_selected_date >= $1::date
        AND user_selected_date < ($1::date + interval '1 day')
        AND to_char(user_selected_time, 'HH24:MI') = $2
        AND payment_status = 'SUCCESS'
        ORDER BY id
      `;
      const result = await pool.query(query, [currentDateString, currentTimeString]);

      if (result.rows.length > 0) {
        const newRows = result.rows.filter(row => !sentDataIds.has(row.id));

        if (newRows.length > 0) {
          for (let item of newRows) {
            const imagePath = item.image_path;

            try {
              const imageData = await fs.promises.readFile(imagePath, "base64");
              item.image_base64 = `data:image/png;base64,${imageData}`;
            } catch (fileError) {
              console.error("Error reading image file:", fileError);
              item.image_base64 = null;
            }
          }

          sendSSEEvent(newRows);
          newRows.forEach(row => sentDataIds.add(row.id));
        }
      }
    } catch (error) {
      console.error("Error fetching data for SSE:", error);
    }
  }, 10000); // Every 10s

  // Cleanup on client disconnect
  req.on("close", () => {
    console.log("SSE connection closed");
    clearInterval(intervalId);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`SSE server running on http://localhost:${PORT}/api/items`);
});
