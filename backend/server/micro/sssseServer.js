
const express = require('express');
const fs = require('fs'); // File system module for reading files
const { Pool } = require('pg'); // PostgreSQL client
const cors = require("cors");
const https = require("https");  // s for live server
require("dotenv").config();
const path = require("path");  // for get access to user screenshoot
const app = express();

app.use(
    cors({
      origin: "*", // Replace with your frontend's actual URL
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ limit: "300mb", extended: true }));

// // Configure PostgreSQL connection
// const pool = new Pool({
//   // Provide your PostgreSQL configuration here
//   user: 'akshay',
//   host: 'localhost',
//   database: 'webapp',
//   password: 'eyelike@123./hqrZ',
//   port: 5432, // Default PostgreSQL port
// });

const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: String(process.env.DATABASE_PASS),
    port: parseInt(process.env.DATABASE_PORT, 10),
});


app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});


// Static file serving (this is critical!) // for get access to user screenshoot
console.log("Serving static files from:", path.join(__dirname, 'screenshoots'));
app.use('/screenshoots', express.static(path.join(__dirname, 'screenshoots')));


// // SSE endpoint
// app.get("/api/items", async (req, res) => {      // eyelike server
app.get("/sse/api/items", async (req, res) => {    //amey server
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();  // Start the response immediately

  // Store sent data IDs to avoid sending the same data again
  const sentDataIds = new Set();

  // Function to send SSE events
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
      const currentDateString = currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      const currentTimeString = currentDate.toTimeString().split(":").slice(0, 2).join(":"); // Format as HH:MM

      // const query = `
      //   SELECT * FROM users
      //   WHERE user_selected_date::date = $1::date
      //   AND to_char(user_selected_time::time, 'HH24:MI') = $2
      //   AND payment_status = 'SUCCESS'
      //   ORDER BY id 
      // `;
      
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
        // Filter out rows that have already been sent
        const newRows = result.rows.filter(row => !sentDataIds.has(row.id));

        if (newRows.length > 0) {
          // Process each row to add image data
          for (let item of newRows) {
            const imagePath = item.image_path;

            try {
              // Read the image file and convert it to base64
              const imageData = await fs.promises.readFile(imagePath, "base64"); // Use promises for async/await

              // Add base64 string to the item object
              item.image_base64 = `data:image/png;base64,${imageData}`; // Prefix with MIME type
            } catch (fileError) {
              console.error("Error reading image file:", fileError);
              item.image_base64 = null; // Set to null if reading fails
            }
          }

          // Send the new rows with image data as SSE
          sendSSEEvent(newRows);

          // Mark the new data as sent
          newRows.forEach(row => sentDataIds.add(row.id));
        }
      }
    } catch (error) {
      console.error("Error fetching data for SSE:", error);
    }
  }, 10000); // Adjust interval as needed (10 seconds here)

  // Close the SSE connection after a timeout or when the client disconnects
  req.on("close", () => {
    console.log("SSE connection closed");
    clearInterval(intervalId); // Clear the interval to stop sending data
  });
});


// app.get("/api/items", async (req, res) => {
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");
//   res.flushHeaders();

//   console.log("SSE /api/items connection received");

//   // Send test message immediately
//   res.write(`data: ${JSON.stringify({ test: "hello world" })}\n\n`);

//   // Keep connection open
//   const intervalId = setInterval(() => {
//     res.write(`data: ${JSON.stringify({ ping: new Date().toISOString() })}\n\n`);
//   }, 10000);

//   req.on("close", () => {
//     console.log("SSE client disconnected");
//     clearInterval(intervalId);
//   });
// });


// const options = {
//   key: fs.readFileSync('/home/ubuntu/ssl/privkey.pem'),
//   cert: fs.readFileSync('/home/ubuntu/ssl/fullchain.pem'),
//   ca: fs.readFileSync('/home/ubuntu/ssl/chain.pem')
// };


// SSL paths from Certbot
const sslOptions = {
  key: fs.readFileSync('/home/eyelike/nodebackend/ssl/privkey.pem'),
  cert: fs.readFileSync('/home/eyelike/nodebackend/ssl/fullchain.pem')
};

https.createServer(sslOptions, app).listen(8181, "0.0.0.0", () => {
  console.log("Server running on https://localhost:8181");
});
