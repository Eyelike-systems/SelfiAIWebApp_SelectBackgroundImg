const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const cors = require('cors');
const https = require("https");  // s for live server

const app = express();

const SECRET_KEY = "your_super_secret_key_123";

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ limit: "300mb", extended: true }));

const path = require('path');

// Serve screenshots folder as static
app.use('/screenshoots', express.static(path.join(__dirname, 'screenshoots')));  // this line need to check


app.post("/upload", async (req, res) => {
  const { screenshot, customer_name, customer_phone } = req.body;

  console.log("Received screenshot for customer:", customer_name);

  const imageDir = "./screenshoots";
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  const now = new Date();
  const dateString = now.toISOString().replace(/:/g, "-");
  const readableTime = now.toLocaleString();
  const fileName = `${customer_name}_${dateString}.png`;
  const outputPath = path.join(imageDir, fileName);

  try {
    // Decode base64
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, 'base64');

    // Get image dimensions
    const metadata = await sharp(imgBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Generate unique HMAC hash
    const hash = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${customer_name}|${readableTime}`)
      .digest('hex')
      .substring(0, 12);

    // SVG watermark same size as image
    const watermarkText = `${customer_name} • ${readableTime} • ${hash}`;
    const svgOverlay = Buffer.from(`
      <svg width="${width}" height="${height}">
        <text x="20" y="${height - 10}" font-size="10" fill="rgba(255,255,255,0.4)" font-family="Arial" font-weight="bold">
          ${watermarkText}
        </text>
      </svg>
    `);

    // Composite watermark
    await sharp(imgBuffer)
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .png()
      .toFile(outputPath);

    const imageUrl = `https://your-domain.com/screenshoots/${fileName}`; // Replace with your domain

    res.json({
      status: "success",
      message: "Screenshot saved with watermark and hash",
      imagePath: imageUrl,
      hash,
    });
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to process request",
    });
  }
});

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

https.createServer(sslOptions, app).listen(8282, "0.0.0.0", () => {
  console.log("Server running on https://localhost:8282");
});
