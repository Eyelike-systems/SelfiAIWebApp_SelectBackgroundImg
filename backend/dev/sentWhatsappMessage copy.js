const axios = require('axios');

// Replace these values with your actual data
const phoneNumberId = '763676703488641';
const recipientPhone = '+919309996326'; // Customer's phone number (with country code)
const accessToken = 'EAAKkjR3bZClgBPEMSJAj8ckZCOiSBnOcnmLG5fJ0256ZCNZBFMpiL9Yqb9dT9O3TldPUq1jE6f3qmNGcDuK7ofTqNCRoTsenXIWU6SIUnBAAGPUXbAkAeSetKPMqnj6W9dyhsnmnedngk49cvZA5cNtcsq9UVY8O9AiZCP8ZCsxCZCuMJrXX8qB96DwwwtEzCgZDZD';

// Your approved template name and parameters
axios.post(
  `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
  {
    messaging_product: "whatsapp",
    to: `${recipientPhone}`,
    type: "template",
    template: {
      name: "user_image_ready", // must match approved template
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Akshay" }, // {{1}} in template
            {
              type: "text",
              text: "https://app.eyelikesystems.com/screenshoots/Akshay_2025-08-01T06-12-54.621Z.png"
            } // {{2}} in template
          ]
        }
      ]
    }
  },
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  }
)
.then((res) => {
  console.log("Message sent:", res.data);
})
.catch((err) => {
  console.error("Error sending message:", err.response?.data || err.message);
});