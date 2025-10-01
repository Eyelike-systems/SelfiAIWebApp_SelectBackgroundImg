const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const Joi = require("joi"); // for input validation
const crypto = require("crypto");
const { Cashfree } = require("cashfree-pg");
const axios = require("axios");
const multer = require("multer");
const sharp = require("sharp");
const db = require("./db");
const https = require('https'); // production only
const { sendWhatsAppImage } = require("./sendWhatsAppImage");
require("dotenv").config();
require("events").EventEmitter.defaultMaxListeners = 30; // Optional increase

// Register only once — before any routes
process.once("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

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

Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;
// Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

function generateOrderId() {
  const uniqueId = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256");
  hash.update(uniqueId);
  const orderId = hash.digest("hex");
  return orderId.substr(0, 12);
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// Accept multiple fields: "image" and "background_image"
const multiUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "background_image", maxCount: 1 },
]);

const paymentSchema = Joi.object({
  customer_name: Joi.string().min(2).max(100).required(),
  customer_phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  order_amount: Joi.number().positive().required(),
  slogan: Joi.string().max(255).optional(), // Adjust based on use case
});

const dataSchema = Joi.object({
  customer_name: Joi.string().min(2).max(30).required(),
  customer_phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  slogan: Joi.string().max(255).allow('', null),
  order_amount: Joi.number().positive().required(),
  payment_status: Joi.string().valid("SUCCESS", "FAILED", "PENDING", "USER_DROPPED").required(),
  order_id: Joi.string().required(),
  transaction_id: Joi.string().required(),
  payment_currency: Joi.string().valid("INR").required(),
  payment_completion_time: Joi.string().isoDate().required(), // or allow custom format
  // user_selected_time: Joi.string().required(),
  // user_selected_date: Joi.string().required()
});


router.post("/api/payment", multiUpload, async (req, res) => {
  //  console.log("payment request received");
  // `req.body` will now contain text fields, `req.file` will contain image
  let {
    order_amount,
    customer_phone,
    customer_name,
    slogan,
  } = req.body;

    // Validate incoming fields
  const { error } = paymentSchema.validate({
    customer_name,
    customer_phone,
    order_amount,
    slogan,
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

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

router.post("/api/verify", multiUpload, async (req, res) => {
  console.log("verify request received");
  console.log("data", req.body);

  try {
    let { orderId } = req.body;

    // Step 1: Verify payment
    const verifyResponse = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
    const paymentInfo = verifyResponse.data[0];

    if (!paymentInfo) {
      return res.status(400).json({ message: "No payment found for this order" });
    }

    const payment_status = paymentInfo.payment_status;

    const {
      customer_name,
      customer_phone,
      slogan,
      order_amount,
      order_id = paymentInfo.order_id,
      transaction_id = paymentInfo.cf_payment_id,
      payment_currency = paymentInfo.payment_currency,
      payment_completion_time = paymentInfo.payment_completion_time,
    } = { ...req.body, ...paymentInfo };

    // Validate inputs
    const { error } = dataSchema.validate({
      customer_name,
      customer_phone,
      slogan,
      order_amount,
      payment_status,
      order_id,
      transaction_id,
      payment_currency,
      payment_completion_time,
    });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let finalImagePath = null;
    let user_selected_date = null;
    let user_selected_time = null;

    if (payment_status === "SUCCESS") {
      if (!req.files || !req.files["image"] || !req.files["background_image"]) {
        return res.status(400).json({ error: "Both user image and background image required." });
      }

      const userImageBuffer = req.files["image"][0].buffer;
      const backgroundBuffer = req.files["background_image"][0].buffer;

      const processedDir = path.join(__dirname, "../processed_images");
      if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true });

      const now = new Date();
      const dateString = now.toISOString().split("T")[0];
      const timeString = now.toTimeString().split(" ")[0].replace(/:/g, "-");

      // Step 1: Remove background
      const externalResponse = await axios.post(imageProcessingApiUrl, {
        image_base64: userImageBuffer.toString("base64"),
      });

      if (!externalResponse.data?.image) {
        return res.status(500).json({ message: "Background removal failed" });
      }
      const removedBgBuffer = Buffer.from(externalResponse.data.image, "base64");

      // Step 2: Merge with background + resize
      const laptopWidth = 1366;
      const laptopHeight = 768;
      finalImagePath = path.join(
        processedDir,
        `${customer_name}_${dateString}_${timeString}_final.jpg`
      );

      // Resize background to fit laptop size (keep aspect ratio, pad with black if needed)
      const backgroundResized = await sharp(backgroundBuffer)
        .resize(laptopWidth, laptopHeight, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0 }, // black padding
        })
        .toBuffer();


      // --- Step 1: Resize image ---
      const userMaxWidth = Math.floor(laptopWidth * 0.35);   // up to 20% of background width
      const userMaxHeight = Math.floor(laptopHeight * 0.50); // up to 30% of background height

      const userResized = await sharp(removedBgBuffer)
        .resize({
          width: userMaxWidth,
          height: userMaxHeight,
          fit: "inside",   // never crop, fit inside box
          withoutEnlargement: true, // don't upscale small images
        })
        .png()
        .toBuffer();

      // --- Step 2: Get resized dimensions ---
      const userMeta = await sharp(userResized).metadata();
      const userHeight = userMeta.height;

      // --- Step 3: Composite at true bottom-left (no padding) ---
      await sharp(backgroundResized)
        .composite([
          {
            input: userResized,
            top: laptopHeight - userHeight, // bottom aligned
            left: 0,                        // flush to left edge
            blend: "over",
          },
        ])
        .jpeg({ quality: 90 })
        .toFile(finalImagePath);

      // Step 3: Book slot
      const bookingRes = await axios.post(`${process.env.MAIN_SERVER_IP}/api/book`);
      user_selected_date = bookingRes.data.user_selected_date;
      user_selected_time = bookingRes.data.user_selected_time;

      
      // ------------------------ sent whatsapp message start ------------------------

      // Extract filename from finalImagePath
      const fileName = path.basename(finalImagePath);

      // Build processed image URL
      const imageUrl = `https://web.eyelikesystems.com/processed_images/${fileName}`;

      // console.log("finalImagePath:", finalImagePath);
      // console.log("imageUrl:", imageUrl);

      // Call WhatsApp sender
      // await sendWhatsAppImage(customer_phone, customer_name, imageUrl);
      
      // ------------------------ sent whatsapp message end ------------------------
  
    }

    // Step 4: Save in DB
    const result = await db.query(
      `INSERT INTO users (
        customer_name, customer_phone, slogan, image_path,
        order_amount, payment_status, order_id, transaction_id,
        payment_currency, payment_completion_time,
        user_selected_date, user_selected_time
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *;`,
      [
        customer_name,
        customer_phone,
        slogan,
        finalImagePath,
        order_amount,
        payment_status,
        order_id,
        transaction_id,
        payment_currency,
        payment_completion_time,
        user_selected_date,
        user_selected_time,
      ]
    );

    const newUser = result.rows[0];

    return res.status(201).json({
      message: `Payment ${payment_status} - user data saved`,
      user: newUser,
    });

  } catch (error) {
    console.error("Error in /api/verify:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});



// Define the image directory
const imageDir = path.join(__dirname, "images");
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir);
}

// Define the image directory
const imageDir2 = path.join(__dirname, "screenshoots");
if (!fs.existsSync(imageDir2)) {
  fs.mkdirSync(imageDir2);
}

const imageProcessingApiUrl = `${process.env.FAST_API_IP}/api/processImage`; // Replace with actual URL

// Define the folder where your media files are stored
const mediaFolderPath = path.join("C:/web");


// Endpoint to serve a random media file
router.get("/api/media/:filename", (req, res) => {
  // console.log("media request get");
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
// Endpoint to check availability // /api/book
router.post("/api/book", async (req, res) => {
  // console.log('/api/book/hit..........')
  const now = dayjs();
  const today = now.format("YYYY-MM-DD");

  try {
    // Fetch all bookings for today, ordered by time
    const result = await db.query(
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
  // console.log("test request received:", req.body);
  res.status(200).json({ message: "test sucess" });
});

// Handle unknown routes
router.use((req, res) => {
  res.status(404).send("Not Found");
});

module.exports = router;

    // In Production
    // const bookingRes = await axios.post(
    //   `${process.env.MAIN_SERVER_IP}/api/book`,
    //   {}, // empty data body, since POST expects a payload, can be empty object
    //   {
    //     httpsAgent: new https.Agent({
    //       rejectUnauthorized: false, // if using self-signed cert, otherwise true or omit
    //     }),
    //   }
    // );