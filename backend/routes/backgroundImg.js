const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");   // 👈 install this: npm install sharp

const router = express.Router();

router.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const UPLOAD_FOLDER = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER);

router.use(express.static(UPLOAD_FOLDER));

const storage = multer.memoryStorage(); // 👈 store in memory, not disk
const upload = multer({ storage });

// target size
const TARGET_WIDTH = 1000;
const TARGET_HEIGHT = 560;

router.post("/images", upload.array("images", 10), async (req, res) => {
  try {
    console.log("✅ Received images");
    const processedFiles = [];

    for (const file of req.files) {
      const filename = Date.now() + "_" + file.originalname;
      const outputPath = path.join(UPLOAD_FOLDER, filename);

      // process with sharp
      const image = sharp(file.buffer);
      const metadata = await image.metadata();

      const originalRatio = metadata.width / metadata.height;
      const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;

      let resizeWidth, resizeHeight;
      if (originalRatio > targetRatio) {
        resizeHeight = TARGET_HEIGHT;
        resizeWidth = Math.round(TARGET_HEIGHT * originalRatio);
      } else {
        resizeWidth = TARGET_WIDTH;
        resizeHeight = Math.round(TARGET_WIDTH / originalRatio);
      }

      await image
        .resize(resizeWidth, resizeHeight)
        .extract({
          left: Math.max(Math.floor((resizeWidth - TARGET_WIDTH) / 2), 0),
          top: Math.max(Math.floor((resizeHeight - TARGET_HEIGHT) / 2), 0),
          width: TARGET_WIDTH,
          height: TARGET_HEIGHT,
        })
        .toFile(outputPath);

      processedFiles.push({
        filename,
        url: `http://localhost:3000/background/${filename}`, // adjust backend port
      });
    }

    res.json({ success: true, files: processedFiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Processing failed" });
  }
});

router.get("/images", (req, res) => {
  fs.readdir(UPLOAD_FOLDER, (err, files) => {
    if (err) return res.status(500).json({ error: "Unable to fetch images" });
    const urls = files.map((f) => `http://localhost:3000/background/${f}`);
    res.json(urls);
  });
});

module.exports = router;
