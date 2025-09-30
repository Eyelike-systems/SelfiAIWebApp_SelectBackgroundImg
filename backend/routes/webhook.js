// This files first time for setup webhook
const express = require("express");
const router = express.Router();

// 🌐 GET route for webhook verification (Meta requires this)
router.get("/whatsapp-webhook", (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN; // set in .env
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === verifyToken) {
    console.log("🟢 Webhook verified");
    res.status(200).send(challenge);
  } else {
    console.warn("🔴 Webhook verification failed");
    res.sendStatus(403);
  }
});

// 📦 POST route for receiving webhook events
router.post("/whatsapp-webhook", (req, res) => {
  const body = req.body;

  if (body.object) {
    body.entry?.forEach((entry) => {
      const changes = entry.changes;
      changes?.forEach((change) => {
        const value = change.value;
        const statuses = value.statuses;

        if (statuses) {
          statuses.forEach((statusObj) => {
            const messageId = statusObj.id;
            const status = statusObj.status; // delivered | read | failed
            const phone = statusObj.recipient_id;

            console.log(`📬 Message to ${phone} is now '${status}' (ID: ${messageId})`);
            // 👉 You can store/update this status in your DB here
          });
        }
      });
    });

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

//module.exports = router;