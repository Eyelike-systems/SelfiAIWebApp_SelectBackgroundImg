const axios = require('axios');

const sendSMS = async () => {
  const baseUrl = 'https://sms.auurumdigital.com/api/mt/SendSMS';
  const params = {
    user: 'clinetdemo',
    password: 'Clinetdemo@2019',
    senderid: 'AUURUM',
    channel: 'Trans',
    DCS: 0,
    flashsms: 0,
    number: '9309996326',  // ✅ Receiver's phone number
    text: 'Service has been restarted on 123. AUURUM DIGITAL.',
    text: 'Thank you for donate  Your image available at this url https://selfi.eyelikesystems.com/screenshoots/User_1_2025-06-06T05-12-50.884Z.png ',
    route: '00',
    templateid: '1007555651200033188' // ✅ Make sure this is the correct approved DLT template
  };

  try {
    const response = await axios.get(baseUrl, { params });
    console.log('SMS API Response:', response.data);
  } catch (error) {
    console.error('Error sending SMS:', error.message);
  }
};

sendSMS();
