require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "webapp",
  password: "1234",
  port: 5432,
});

const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.PHONE_NO_ID;
const hardcodedImageUrl = "https://app.eyelikesystems.com/screenshoots/Sandes_mfusmrcu.png";
/**
 * Send WhatsApp image using approved template 'user_media' with image in header.
 * Upserts DB with status 'pending' or 'failed'.
 *
 * @param {string} phone - recipient phone number
 * @param {string} customer_name - recipient name
 * @param {string} imageUrl - image URL to send
 * @param {string|null} transactionId - optional existing transaction ID for retries
 * @returns {Promise<string>} transactionId
 */
async function sendWhatsAppImage(phone, customer_name, imageUrl, transactionId = null) {
  const client = await pool.connect();
  try {
    if (!transactionId) {
      transactionId = uuidv4();
    }

    console.log(`📤 Sending template message to ${phone} | Transaction ID: ${transactionId}`);

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: "userimg_utility",
          language: { code: "en_US" },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "image",
                  image: { link: hardcodedImageUrl }
                }
              ]
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${whatsappAccessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const messageId = response.data.messages?.[0]?.id;

    // Upsert DB row with 'pending' status on send
    await client.query(
      `
      INSERT INTO whatsapp_logs
        (transaction_id, message_id, customer_name, customer_phone, image_url, whatsapp_message_status, whatsapp_exists, created_at, updated_at, retry_count)
      VALUES ($1, $2, $3, $4, $5, 'pending', true, NOW(), NOW(), 0)
      ON CONFLICT (transaction_id)
      DO UPDATE SET
        message_id = EXCLUDED.message_id,
        updated_at = NOW(),
        retry_count = whatsapp_logs.retry_count + 1
      `,
      [transactionId, messageId, customer_name, phone, hardcodedImageUrl]
    );

    console.log(`✅ Template message sent to WhatsApp API | Message ID: ${messageId}`);

    return transactionId;
  } catch (error) {
    console.error(`❌ Failed to send template message to ${phone}:`, error.response?.data || error.message);

    // Insert or update as 'failed' if send failed
    await client.query(
      `
      INSERT INTO whatsapp_logs
        (transaction_id, customer_name, customer_phone, image_url, whatsapp_message_status, whatsapp_exists, created_at, updated_at, retry_count)
      VALUES ($1, $2, $3, $4, 'failed', false, NOW(), NOW(), 0)
      ON CONFLICT (transaction_id)
      DO UPDATE SET
        whatsapp_message_status = 'failed',
        updated_at = NOW(),
        retry_count = whatsapp_logs.retry_count + 1
      `,
      [transactionId, customer_name, phone, imageUrl]
    );

    return transactionId;
  } finally {
    client.release();
  }
}

/**
 * Webhook to receive status updates from WhatsApp and update DB accordingly.
 */
router.post("/whatsapp-webhook", async (req, res) => {
  try {

    console.log("Webhook payload:", JSON.stringify(req.body, null, 2));
    const statusObj = req.body?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0];
    if (statusObj) {
      const { id: messageId, status } = statusObj;

      const result = await pool.query(
        `
        UPDATE whatsapp_logs
        SET whatsapp_message_status = $1, updated_at = NOW()
        WHERE message_id = $2
        `,
        [status, messageId]
      );

      if (result.rowCount === 0) {
        console.warn(`⚠️ No DB entry found for messageId: ${messageId}`);
      } else {
        console.log(`🔄 Webhook: Message ${messageId} → ${status}`);
      }
    } else {
      console.log("⚠️ Webhook received without status update");
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.sendStatus(500);
  }
});

module.exports = { sendWhatsAppImage, router };
