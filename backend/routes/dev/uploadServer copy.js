const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const crypto = require("crypto");
const cors = require("cors");
const db = require("../db"); 


const router = express.Router();
console.log("📦 uploadServer router loaded");

const SECRET_KEY = "your_super_secret_key_123";

router.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

router.post("/", async (req, res) => {
  console.log("📥 /upload POST route hit");
  const { screenshot, customer_name, order_id } = req.body;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const lockQuery = await client.query(
      `SELECT final_image_path FROM users WHERE order_id = $1 FOR UPDATE`,
      [order_id]
    );

    const existing = lockQuery.rows[0];
    if (existing?.final_image_path) {
      await client.query("COMMIT");
      return res.status(200).json({
        status: "duplicate",
        message: "Screenshot already exists",
        imagePath: existing.final_image_path,
      });
    }

    const imageDir = "./screenshoots";
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    const now = new Date();
    const dateString = now.toISOString().replace(/:/g, "-");
    const readableTime = now.toLocaleString();
    const fileName = `${customer_name}_${dateString}.png`;
    const outputPath = path.join(imageDir, fileName);

    // Decode base64
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, "base64");

    // Get image dimensions
    const metadata = await sharp(imgBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Generate unique HMAC hash
    const hash = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(`${customer_name}|${readableTime}`)
      .digest("hex")
      .substring(0, 12);

    // Create SVG watermark
    const watermarkText = `${customer_name} • ${readableTime} • ${hash}`;
    const svgOverlay = Buffer.from(`
      <svg width="${width}" height="${height}">
        <text x="20" y="${
          height - 10
        }" font-size="10" fill="rgba(255,255,255,0.4)" font-family="Arial" font-weight="bold">
          ${watermarkText}
        </text>
      </svg>
    `);

    // Apply watermark
    await sharp(imgBuffer)
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .png()
      .toFile(outputPath);

    const imageUrl = `https://your-domain.com/screenshoots/${fileName}`; // Update domain

    // Update DB
    await client.query(
      `UPDATE users 
       SET final_image_path = $1, watermark_string = $2 
       WHERE order_id = $3`,
      [imageUrl, watermarkText, order_id]
    );

    await client.query("COMMIT");

    res.json({
      status: "success",
      message: "Screenshot saved with watermark and hash",
      imagePath: imageUrl,
      hash,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error handling upload:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to process request",
    });
  } finally {
    client.release(); // Always release the DB client
  }
});

router.get("/test", (req, res) => {
  res.send("Upload server works");
});

// app.listen(PORT, () => {
//   console.log(`Upload server running on http://localhost:${PORT}/api/upload`);
// });

module.exports = router;