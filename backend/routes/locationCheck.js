const express = require("express");
const router = express.Router();
const { getDistance } = require("geolib");
const cors = require('cors');

// // location restric check this is mubai location
// const TARGET_LAT = 18.9582;
// const TARGET_LON = 72.8321;

// // this this desktop office location for test
const TARGET_LAT = 18.51399;
const TARGET_LON = 73.80665;

// //Actual mobile location office is
// const TARGET_LAT = 18.5097522;
// const TARGET_LON = 73.8031001;

const MAX_DISTANCE_METERS = 10000;



router.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

router.post("/", (req, res) => {
  const { latitude, longitude, deviceType } = req.body;
  //   console.log("location req received: ", latitude," ", longitude," ", deviceType)
  // 1. Device type check
  if (deviceType !== "mobile") {
    return res.status(403).json({
      allowed: false,
      message: "App allowed only on mobile devices"
    });
  }

  // 2. Validate coordinates
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({
      allowed: false,
      message: "Valid coordinates required"
    });
  }

  // 3. Calculate distance to target
  const distance = getDistance(
    { latitude, longitude },
    { latitude: TARGET_LAT, longitude: TARGET_LON }
  );

  // 4. Allow or deny based on distance
  if (distance <= MAX_DISTANCE_METERS) {
    return res.json({
      allowed: true,
      distance
    });
  } else {
    return res.json({
      allowed: false,
      distance,
      message: "Too far from target location"
    });
  }
});



module.exports = router;
