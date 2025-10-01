import React, { useState } from "react";
import image1 from "../assets/images/1.jpg";
import image2 from "../assets/images/2.jpg";
import image3 from "../assets/images/3.jpg";
import image4 from "../assets/images/4.jpg";
import image5 from "../assets/images/5.jpg";
import image6 from "../assets/images/6.jpg";
import image7 from "../assets/images/7.jpg";
import image8 from "../assets/images/8.jpg";

const BackgroundImage = ({ onSelect }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const chooseImage = async (imagePath) => {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    const file = new File([blob], "background.jpg", { type: blob.type });

    onSelect(file);
    setIsModalOpen(false);
  };

  const images = [image1, image2, image3, image4, image5, image6, image7, image8];

  return (
    <div>
      <button type="button" onClick={() => setIsModalOpen(true)}>
        Select Background Image
      </button>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "80%", maxWidth: "800px" }}>
            <h3>Select an Image</h3>
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                gap: "10px",
                padding: "10px 0",
              }}
            >
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Background ${idx + 1}`}
                  width="150"
                  style={{ cursor: "pointer", flex: "0 0 auto" }}
                  onClick={() => chooseImage(img)}
                />
              ))}
            </div>
            <button onClick={() => setIsModalOpen(false)} style={{ marginTop: "10px" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundImage;
