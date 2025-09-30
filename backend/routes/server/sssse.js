const express = require('express');
const fs = require('fs'); // File system module for reading files
const { Pool } = require('pg'); // PostgreSQL client
const cors = require("cors");

// const app = express();
const router = express.Router();

console.log("000000000000000000")

router.use(
    cors({
      origin: "*", // Replace with your frontend's actual URL
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

// Configure PostgreSQL connection
const pool = new Pool({
  // Provide your PostgreSQL configuration here
  user: 'akshay',
  host: 'localhost',
  database: 'webapp',
  password: 'eyelike@123./hqrZ',
  port: 5432, // Default PostgreSQL port
});

// SSE endpoint
router.get("/", async (req, res) => {
  console.log('1111111111111111111')
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

module.exports = router;
