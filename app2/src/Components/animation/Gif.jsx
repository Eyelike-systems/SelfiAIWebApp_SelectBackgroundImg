import React, { useEffect, useState } from "react";
import image from "../../static/images/output_image.png"

import { motion } from "framer-motion";

const AnimatedImage = () => {
  return (
    <motion.img
      src={image}
      alt="Animated"
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{ width: "200px" }}
    />
  );
};

export default AnimatedImage;
