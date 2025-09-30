// const axios = require('axios');
// require("dotenv").config();

// // Replace these values with your actual data
// const phoneNumberId = process.env.PHONE_NO_ID;
// const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

// //user data
// var userWhatsappNumber = "9309996326"
// var recipientPhone = "+91" + `${userWhatsappNumber}`; // Customer's phone number (with country code)
// var userName = "Akshay bhosale"
// var userUrl = "https://app.eyelikesystems.com/screenshoots/Akshay_2025-08-01T06-12-54.621Z.png"


// // Your approved template name and parameters
// axios.post(
//   `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
//   {
//     messaging_product: "whatsapp",
//     to: `${recipientPhone}`,
//     type: "template",
//     template: {
//       name: "user_image_ready", // must match approved template
//       language: { code: "en" },
//       components: [
//         {
//           type: "body",
//           parameters: [
//             { type: "text", text: `${userName}` }, // {{1}} in template
//             {
//               type: "text",
//               text: `${userUrl}`
//             } // {{2}} in template
//           ]
//         }
//       ]
//     }
//   },
//   {
//     headers: {
//       Authorization: `Bearer ${whatsappAccessToken}`,
//       "Content-Type": "application/json"
//     }
//   }
// )
// .then((res) => {
//   console.log("Message sent:", res.data);
// })
// .catch((err) => {
//   console.error("Error sending message:", err.response?.data || err.message);
// });


const axios = require("axios");
require("dotenv").config();

// WhatsApp API credentials
const phoneNumberId = process.env.PHONE_NO_ID;
const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

// User data
const userWhatsappNumber = "9309996326";
const recipientPhone = "+91" + userWhatsappNumber; // With country code
const userName = "Akshay Bhosale";
const userImageUrl = "https://app.eyelikesystems.com/screenshoots/Akshay_2025-08-01T06-12-54.621Z.png";
const companyUrl = "https://eyelikesystems.com";

// Send image using public URL
axios
  .post(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "image",
      image: {
        link: userImageUrl,
        // caption: `Hello ${userName}, your image is ready!\n\n🔗 Visit our website:\n${companyUrl}`,
        caption: `🔗 Visit our website:\n${companyUrl}`,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${whatsappAccessToken}`,
        "Content-Type": "application/json",
      },
    }
  )
  .then((response) => {
    console.log("✅ Image sent successfully:", response.data);
  })
  .catch((error) => {
    console.error("❌ Error sending image:", error.response?.data || error.message);
  });
