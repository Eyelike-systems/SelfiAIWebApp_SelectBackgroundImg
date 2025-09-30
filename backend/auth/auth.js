const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const cors = require("cors");


router.use(
    cors({
      origin: "*", // Replace with your frontend's actual URL
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

const SECRET_KEY = 'eyelike_secret'; // ⚠️ keep secret & secure

router.post('/', (req, res) => {
  const { username, password } = req.body;

  // hardcoded for demo — use a DB in production
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

module.exports = router;
