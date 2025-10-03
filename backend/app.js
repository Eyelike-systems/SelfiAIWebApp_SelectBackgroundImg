const express = require('express');
const app = express();
const path = require('path');
const userRoutes = require('./routes/indexMonolithic');
const uploadServer = require('./routes/uploadServer');
const sseServer = require('./routes/sseServer');
const locationCheck = require('./routes/locationCheck');
const authRoutes = require("./auth/auth")
const backgroundImg = require("./routes/backgroundImg")

// whatsapp
//const webhookRoutes = require("./routes/webhook"); // Adjust path as needed
const { sendWhatsAppImage, router: whatsappRouter } = require("./routes/sendWhatsAppImage");


const https = require('https'); // production only
const fs = require('fs'); // production only

// app.use((req, res, next) => {
//   console.log("➡️ Incoming:", req.method, req.originalUrl);
//   next();
// });


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'eyelike_secret', (err, user) => {
    if (err) return res.sendStatus(403); // invalid token
    req.user = user;
    next();
  });
}

// app.get('/dashboard', authenticateToken, (req, res) => {
//   res.json({ message: `Welcome, ${req.user.username}` });
// });

// Serve the screenshots folder
app.use('/screenshoots', express.static(path.join(__dirname, 'screenshoots')));
app.use('/processed_images', express.static(path.join(__dirname, 'processed_images')));

// Serve static background images with CORS headers
const UPLOAD_FOLDER = path.join(__dirname, "uploads");
app.use(
  "/background",
  express.static(UPLOAD_FOLDER, {
    setHeaders: (res, path, stat) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  })
);

app.use('/api/login', express.json({ limit: "1mb" }), express.urlencoded({
  limit: "1mb",
  extended: true,
}), authRoutes);

app.use('/api/location-check',express.json({ limit: "1mb" }), express.urlencoded({
  limit: "1mb",
  extended: true,
}), locationCheck);

app.use('/upload', express.json({ limit: "100mb" }), express.urlencoded({
  limit: "100mb",
  extended: true,
}), uploadServer);

app.use('/sse/api/items', sseServer);


// whatsapp message status check
// Mount the webhook
//app.use("/webhook", webhookRoutes);
app.use("/webhook", whatsappRouter); // or "/webhook" if you want all webhooks under that prefix

// user send background images
app.use("/api/background", backgroundImg);

app.use('/', express.json({ limit: "300mb" }),express.urlencoded({
    limit: "300mb",  // 300 md on live server and local 100 mb
    extended: true,
}), userRoutes);

app.use((req, res, next) => {
  console.log("❌ Route not found:", req.method, req.originalUrl);
  res.status(404).send("Not found");
});

// local 
app.listen(3000, () => {
    console.log('App running on port 3000');
});;

// production 
// const sslOptions = {
//   key: fs.readFileSync('./selfsigned.key'),
//   cert: fs.readFileSync('./selfsigned.crt')
// };

// https.createServer(sslOptions, app).listen(8080, () => {
//   console.log('HTTPS Server running on port 8080');
// });
