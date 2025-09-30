const axios = require("axios");
require("dotenv").config();

const phoneNumberId = process.env.PHONE_NO_ID;
console.log("phoneNumberId:", phoneNumberId);

const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const hardcodedImageUrl = "https://app.eyelikesystems.com/screenshoots/Akshay_2025-08-01T06-12-54.621Z.png";


async function sendWhatsAppImage(phone, imageUrl) {
  const recipientPhone = `+91${phone}`;

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "template",
        template: {
          name: "user_media", // Your approved template that has only a header image
          language: {
            code: "en"
          },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "image",
                  image: {
                    link: hardcodedImageUrl
                  }
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

    console.log("✅ Image template sent successfully:", response.data);
  } catch (error) {
    console.error("❌ Error sending WhatsApp image template:", error.response?.data || error.message);
  }
}

// sendWhatsAppImage()
module.exports = sendWhatsAppImage;