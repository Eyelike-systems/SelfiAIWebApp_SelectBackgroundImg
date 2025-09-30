// src/config.js

const config = {
  // IP_ADDRESS: 'ws://localhost/ws', 

  // // // microservices local
  // BACKEND_API: 'http://localhost:3000/api',
  // BACKEND_SSE_API: 'http://localhost:4000/api',   
  // BACKEND_UPLOAD_API: 'http://localhost:5000/upload',  

  // // monolithic local
  BACKEND_API: 'http://localhost:3000/api', 
  BACKEND_SSE_API: 'http://localhost:3000/sse/api',
  BACKEND_UPLOAD_API: 'http://localhost:3000/upload', 

  BACKEND_API_RTSP: 'http://localhost:3010/api',

  // // production mono/micro  eyelike server
  // BACKEND_API: 'https://app.eyelikesystems.com/api',
  // BACKEND_SSE_API: 'https://app.eyelikesystems.com/sse/api', // sse/api amey // eyelike /api
  // BACKEND_UPLOAD_API: 'https://app.eyelikesystems.com/upload',

  
  // // // production mono/micro  eyelike server 2
  // BACKEND_API: 'https://web.eyelikesystems.com/api',
  // BACKEND_SSE_API: 'https://web.eyelikesystems.com/sse/api',
  // BACKEND_UPLOAD_API: 'https://web.eyelikesystems.com/upload',

  };
  
  export default config;