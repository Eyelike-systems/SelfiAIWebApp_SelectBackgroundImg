const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();

const userRoutes = require('./index');
const uploadServer = require('./uploadServer');
const sseServer = require('./sseServer');
const locationCheck = require('./locationCheck');

// SSL paths from Certbot
const sslOptions = {
  key: fs.readFileSync('/home/ubuntu/nodebackendM/ssl/privkey.pem'),
  cert: fs.readFileSync('/home/ubuntu/nodebackendM/ssl/fullchain.pem')
};

// Routes
app.use('/upload', express.json({ limit: "100mb" }), express.urlencoded({
  limit: "100mb",
  extended: true,
}), uploadServer);

app.use('/sse/api/items', sseServer);


//app.use('/api/location-check', locationCheck);

app.use('/', express.json({ limit: "300mb" }), express.urlencoded({
  limit: "300mb",
  extended: true,
}), userRoutes);

app.use((req, res, next) => {
  console.log("❌ Route not found:", req.method, req.originalUrl);
  res.status(404).send("Not found");
});

// Start HTTPS server
https.createServer(sslOptions, app).listen(8080, () => {
  console.log('HTTPS Server running on port 8080');
});