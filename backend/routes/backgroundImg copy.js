const express = require('express');
const path = require('path');
const cors = require("cors");
const fs = require('fs');
const multer = require("multer");

const router = express.Router();

router.use(
  cors({
    origin: "*", // Replace with frontend URL if needed
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ----------------------- upload background images start -----------------------------
const UPLOAD_FOLDER = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER);

router.use(express.static(UPLOAD_FOLDER));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({ storage });

// Upload multiple background images
router.post(
  "/images",
  upload.array("images", 10),
  (req, res) => {
    console.log("✅ Received background images");
    const files = req.files.map((file) => ({
      filename: file.filename,
      url: `http://localhost:3001/background/${file.filename}`, // backend port
    }));
    res.json({ success: true, files });
  }
);

// Fetch all images
router.get("/images", (req, res) => {
  fs.readdir(UPLOAD_FOLDER, (err, files) => {
    if (err) return res.status(500).json({ error: "Unable to fetch images" });
    const urls = files.map((f) => `http://localhost:3000/background/${f}`);
    res.json(urls);
  });
});

// ----------------------- upload background images end -----------------------------

module.exports = router;   // 👈 VERY IMPORTANT
