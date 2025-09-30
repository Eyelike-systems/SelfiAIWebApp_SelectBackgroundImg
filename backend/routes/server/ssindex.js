const { Pool, Client } = require("pg");
const express = require("express");
const fs = require("fs");
const fss = require("fs").promises;
const base64Img = require("base64-img");
const path = require("path");
const cors = require("cors");
const Joi = require("joi"); // for input validation
const https = require("https");  // s for live server
const crypto = require("crypto");
const { Cashfree } = require("cashfree-pg");
const FormData = require("form-data");
const axios = require("axios");
require("dotenv").config();
require("events").EventEmitter.defaultMaxListeners = 30; // Optional increase
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Register only once — before any routes
process.once("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const { v4: uuidv4 } = require("uuid");
const dayjs = require("dayjs");
const router = express.Router();

router.use(
  cors({
    origin: "*", // Replace with your frontend's actual URL
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

router.use(express.json({ limit: "300mb" })); // 300 md on live server and local 100 mb
/////////////////////////
router.use(
  express.urlencoded({
    limit: "300mb",  // 300 md on live server and local 100 mb
    extended: true,
  })
);
Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_SECRET;
// Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

// ---------------------------- database start ---------------------------------------------
// After database creation, connect to `webapp`
const connectToWebappDB = () => {
  return new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: String(process.env.DATABASE_PASS),
    port: parseInt(process.env.DATABASE_PORT, 10),
  });
};

// Use the connection pool in your application
const pool = connectToWebappDB();
const generateOrderId = () => crypto.createHash("sha256").update(crypto.randomBytes(16)).digest("hex").substr(0, 12);

router.post("/api/payment", async (req, res) => {
  console.log("payment request received");
  let {
    order_amount,
    customer_phone,
    customer_name,
    customer_email,
    slogan,
  } = req.body;
  customer_phone = String(customer_phone);
  try {
    let request = {
      order_amount: order_amount,
      order_currency: "INR",
      order_id: await generateOrderId(),
      customer_details: {
        customer_id: "123456",
        customer_phone: customer_phone,
        customer_name: customer_name,
        customer_email: customer_email,
        slogan: slogan,
      },
    };
    Cashfree.PGCreateOrder("2023-08-01", request)
      .then((response) => {
        // console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        // console.log(response.data.payment_session_id);
        // console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        
        console.log(`payment request response: `, response.data);

        res.json(response.data);
      })
      .catch((error) => {
        console.error(error.response.data.message);
      });
  } catch (error) {
    console.log(error);
  }
});

router.post("/api/verify", async (req, res) => {
  console.log("verify request received");
  console.log("data", req.body);
  try {
    let { orderId } = req.body;

    Cashfree.PGOrderFetchPayments("2023-08-01", orderId)
      .then((response) => {
        console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
        console.log(`verify request response: `, response.data);

        console.log(`payment status`, response.data[0].payment_status);

        if (response.data[0].payment_status) {
          // let paymentSuccess = response.data[0].payment_status;
          let paymentSuccess = response.data[0];
          res.json(paymentSuccess);
        }
        console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
      })
      .catch((error) => {
        console.error("api/verify", error.response);
      });
  } catch (error) {
    console.log(error);
  }
});
///////////////////////////////////

// Define the image directory
const imageDir = path.join(__dirname, "images");
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir);
}

// ???????????????????????????????????????????????????????????????????????????????????????????????
// Define the image directory
const imageDir2 = path.join(__dirname, "screenshoots");
if (!fs.existsSync(imageDir2)) {
  fs.mkdirSync(imageDir2);
}
// ???????????????????????????????????????????????????????????????????????????????????????????????
// Define the input validation schema
const schema = Joi.object({
  order_amount: Joi.number().positive().required(), // must be a positive number
  customer_phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(), // must be a string of exactly 10 digits
  customer_name: Joi.string().min(3).max(30).required(), // customer name should be between 3-30 characters
  customer_email: Joi.string().email().required(), // must be a valid email format
  // base64String: Joi.string().base64().required(), // must be a valid base64 string
});

const imageProcessingApiUrl = "http://localhost:8000/api/processImage"; // Replace with actual URL

var newUser;  //temp
var user_selected_date;  //temp
var user_selected_time; //temp


router.post("/api/addDataInDatabase", async (req, res) => {
  console.log("addDataInDatabase request received");
  const { error, value } = schema.validate(req.body);
  try {
    var {
      order_amount,
      customer_phone,
      customer_name,
      customer_email,
      slogan,
      base64String, // Original base64 image
      payment_status, 
      order_id,
      transaction_id,
      payment_currency,
      payment_completion_time,

    } = value;

    if (!base64String) {
      return res.status(400).json({ message: "Base64 string is required." });
    }
    if (!base64String.startsWith("data:image")) {
      return res.status(400).json({ message: "Invalid Base64 image format" });
    }

    // Ensure the temp directory exists
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Convert Base64 to Image and get the correct file path
    base64Img.imgSync(base64String, tempDir, `${customer_name}_temp`);

    // FIX: Define the correct file path by appending `.jpg`
    const tempImagePath = path.join(tempDir, `${customer_name}_temp.png`);

    // Ensure the file exists before using createReadStream
    if (!fs.existsSync(tempImagePath)) {
      return res.status(500).json({ message: "Temporary image not found" });
    }

    // Prepare form data for external API
    const formData = new FormData();
    formData.append("image", fs.createReadStream(tempImagePath));

    const prossedBase64String = value.base64String.split(",")[1]; // This will remove the prefix if present

    const externalResponse = await axios.post(
      imageProcessingApiUrl,
      {
        image_base64: prossedBase64String, // Send the Base64 data directly
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // console.log("Response from image processing API:", externalResponse.data);

    if (!externalResponse.data || !externalResponse.data.image) {
      return res
        .status(500)
        .json({ message: "Failed to process image from external API" });
    }

    // Save the new processed image
    const processedDir = path.join(__dirname, "processed_images");
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    const now = new Date();
    
    // Format date and time
    const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const timeString = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS

    const newImageBuffer = Buffer.from(externalResponse.data.image, "base64");
    const newImagePath = path.join(processedDir, `${customer_name}_${dateString}_${timeString}}.jpg`);

    fs.writeFileSync(newImagePath, newImageBuffer);

    // Remove temporary image
    // fs.unlinkSync(tempImagePath);

    // Insert user details into the database
    const query = `
        INSERT INTO users (
        customer_name, 
        customer_phone, 
        customer_email, 
        slogan, image_path, 
        order_amount, 
        payment_status, 
        order_id, 
        transaction_id, 
        payment_currency, 
        payment_completion_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;

    const values = [
      customer_name,
      customer_phone,
      customer_email,
      slogan,
      newImagePath,
      order_amount,
      payment_status,      
      order_id,
      transaction_id,
      payment_currency,
      payment_completion_time
    ];

    const result = await pool.query(query, values);
    const newUser = result.rows[0];

    // Step 2: Get next slot from /api/book
    // const bookingRes = await axios.post("https://localhost:8080/api/book"); // Change port if needed
    const bookingRes = await axios.post(
      "https://localhost:8080/api/book",
      {}, // empty data body, since POST expects a payload, can be empty object
      {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, // if using self-signed cert, otherwise true or omit
        }),
      }
    );

    // const { user_selected_date, user_selected_time } = bookingRes.data;
      user_selected_date = bookingRes.data.user_selected_date;  //temp
      user_selected_time = bookingRes.data.user_selected_time;  // temp

    // Step 3: Update the same user with assigned date/time
    await pool.query(
      "UPDATE users SET user_selected_date = $1, user_selected_time = $2 WHERE id = $3",
      [user_selected_date, user_selected_time, newUser.id]
    );

    // Step 4: Return combined response
    res.status(201).json({
      message: "User added and booked successfully",
      user: { ...newUser, user_selected_date, user_selected_time }
    });

  } catch (error) {
    console.error("Error in /api/addDataInDatabase:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Define the folder where your media files are stored
const mediaFolderPath = path.join("C:/web");

// Endpoint to serve a random media file
router.get("/api/media/:filename", (req, res) => {
  console.log("media request get");
  const filename = req.params.filename;
  const filePath = path.join(mediaFolderPath, filename);

  // Check if the file exists before serving it
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "video/mp4"); // Set content type for video
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// apis for book time slots start here --------------------------------------------
// Endpoint to check availability
  // /api/book
router.post("/api/book", async (req, res) => {
  console.log("get requrest api book...........")
  const now = dayjs();
  const today = now.format("YYYY-MM-DD");

  try {
    // Fetch all bookings for today, ordered by time
    const result = await pool.query(
      "SELECT user_selected_time FROM users WHERE user_selected_date = $1 ORDER BY user_selected_time ASC",
      [today]
    );
    // Convert booked times to dayjs objects
    const bookedTimes = result.rows.map(row =>
      dayjs(`${today} ${row.user_selected_time}`)
    );
    // Initialize candidate time as now + 5 seconds
    let candidateTime = now.add(5, "second");
    // Round candidateTime to the next multiple of 6 seconds
    const seconds = candidateTime.second();
    const remainder = seconds % 6;
    if (remainder !== 0) {
      candidateTime = candidateTime.add(6 - remainder, "second");
    }
    // Loop to find a valid time slot
    while (true) {
      // Count bookings in the same minute
      const sameMinuteCount = bookedTimes.filter(t =>
        t.isSame(candidateTime, "minute")
      ).length;
      if (sameMinuteCount < 10 && candidateTime.isAfter(now)) {
        break; // Valid slot found
      }
      // Move to the next 6-second slot
      candidateTime = candidateTime.add(6, "second");
    }
    const assignedTimeStr = candidateTime.format("HH:mm:ss");
    // Return the assigned date and time
    return res.status(200).json({
      message: "Booking slot assigned",
      user_selected_date: today,
      user_selected_time: assignedTimeStr
    });
  } catch (error) {
    console.error("Error assigning booking slot:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// apis for book time slots end here --------------------------------------------
router.post("/api/test", (req, res) => {
  console.log("test request received:", req.body);
  res.status(200).json({ message: "test sucess" });
});

// Handle unknown routes
router.use((req, res) => {
  res.status(404).send("Not Found");
});

module.exports = router;
