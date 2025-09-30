const axios = require("axios");

/**
 * Send templated SMS
 * @param {string} mobile - Receiver's phone number (with country code, e.g., 91XXXXXXXXXX)
 * @param {string} name - User's name to replace {#var#}
 * @param {string} mandir - Mandir name to replace {#var#}
 * @param {string} filename - File path (no "?")
 */
async function sendSMS(mobile, name, mandir, filename) {
  const baseUrl = "https://sms.auurumdigital.com/api/mt/SendSMS";

  // ✅ Make sure we don’t have "?" in the URL (replace with clean path)
  // Example: screenshoots/Kailas_Erande_2025-08-12T12-27-56.035Z.png
//   const safeFilename = filename.replace(/\?/g, "").replace(/ /g, "_");

  // Build message text using your approved template
//   const message = `Dear ${name}, your image with ${mandir} mandir background is ready. View here: https://app.eyelikesystems.com/?${filename}. Link valid for 48 hours, you can download your image. Thanks for your donation. Visit Again!. Powered by Eye Like Systems LLP. Website Link: https://eyelikesystems.com`;
  const message = `Dear user, your image is ready. View here: https://app.eyelikesystems.com/?${filename} Link valid for 48 hours, you can download your image. Thanks for your donation. Visit Again! Powered by Eye Like Systems LLP. Website: https://eyelikesystems.com`;

  const params = {
    user: "Eyelikesys",
    password: "Eyelikesys@25",
    senderid: "EYELIk",
    channel: "Trans",
    DCS: 0,
    flashsms: 0,
    number: mobile,
    text: message,
    route: "00",
    // templateid: "1707175577529951112", // ✅ Approved DLT template id
    templateid: "1707175610817007196", // ✅ Approved DLT template id 
  };

  try {
    const response = await axios.get(baseUrl, { params });
    console.log("✅ SMS sent:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Error sending SMS:", error.message);
    return false;
  }
}

// ✅ Example usage
sendSMS(
  "919309996326", // Receiver's number
  "Akshay",       // Name
  "Mahalaxmi",    // Mandir
  "screenshoots/Raju_1Dhole.png" // ✅ clean path (no ?)
);
