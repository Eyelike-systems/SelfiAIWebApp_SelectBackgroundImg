require('dotenv').config();
const { Pool } = require("pg");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "webapp",
  password: "1234",
  port: 5432,
});

const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.PHONE_NO_ID;

const hardcodedImageUrl = "https://app.eyelikesystems.com/screenshoots/Ratan_2025-08-11T11-08-54.630Z.png";

/**
 * Retry sending failed WhatsApp template messages (max 3 retries, 1 minute delay).
 * Uses the same approved 'user_media' template with image header.
 */
async function retryFailedMessages() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT * FROM whatsapp_logs
       WHERE whatsapp_message_status = 'failed'
         AND retry_count < 3
         AND (permanent_failed IS NOT TRUE OR permanent_failed IS NULL)
         AND updated_at < NOW() - INTERVAL '5 minute'
       ORDER BY updated_at ASC
       LIMIT 5`
    );

    if (rows.length === 0) {
      console.log("ℹ️ No failed messages to retry.");
      return;
    }

    for (const row of rows) {
      const transactionId = row.transaction_id || uuidv4();

      if (!row.transaction_id) {
        await client.query(
          `UPDATE whatsapp_logs SET transaction_id = $1 WHERE id = $2`,
          [transactionId, row.id]
        );
      }

      console.log(`♻️ Retrying send to ${row.customer_phone} (attempt ${row.retry_count + 1})`);

      try {
        const response = await axios.post(
          `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
          {
            messaging_product: "whatsapp",
            to: row.customer_phone,
            type: "template", // or "image" if you want
            template: {
              name: "usr_media", // your approved template name
              language: { code: "en" },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "image",
                      // image: { link: row.image_url }
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
              "Content-Type": "application/json",
            },
          }
        );

        const messageId = response.data.messages?.[0]?.id || null;

        await client.query(
          `UPDATE whatsapp_logs
           SET whatsapp_message_status = 'sent',
               message_id = $1,
               retry_count = retry_count + 1,
               updated_at = NOW()
           WHERE transaction_id = $2`,
          [messageId, transactionId]
        );

        console.log(`✅ Sent to ${row.customer_phone} | Message ID: ${messageId}`);
      } catch (err) {
        const errorData = err.response?.data || {};
        const errorCode = errorData.error?.code || null;

        console.error(`❌ Failed to send to ${row.customer_phone}:`, errorData);

        const isPermanentFail = [131047, 131049].includes(errorCode); // Add other permanent error codes here

        // If permanent fail or retry count is 2 (next would be 3), mark permanent_failed true
        const shouldMarkPermanent = isPermanentFail || row.retry_count + 1 >= 3;

        await client.query(
          `UPDATE whatsapp_logs
           SET retry_count = retry_count + 1,
               whatsapp_message_status = 'failed',
               permanent_failed = $1,
               updated_at = NOW()
           WHERE transaction_id = $2`,
          [shouldMarkPermanent, transactionId]
        );

        if (shouldMarkPermanent) {
          console.log(`🚫 Marked as permanent failure for ${row.customer_phone}`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Retry worker error:", err);
  } finally {
    client.release();
  }
}

setInterval(retryFailedMessages, 60 * 1000); // Run every 1 minute

// Export for manual invocation if needed
module.exports = { retryFailedMessages };
