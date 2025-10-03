import React, { useState, useEffect } from "react";

const BackgroundImage = ({ onSelect }) => {
  const [images, setImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchImages = async () => {
    try {
      const res = await fetch("http://localhost:3000/background/images"); //backend returns array of URLs
      const data = await res.json();
      console.log("get background images from server:", data);
      setImages(data);
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const chooseImage = async (imageUrl) => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], "background.jpg", { type: blob.type });

    onSelect(file);
    setIsModalOpen(false);
  };

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
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              width: "80%",
              maxWidth: "800px",
            }}
          >
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
                  width="150"
                  style={{ cursor: "pointer", flex: "0 0 auto" }}
                  onClick={() => chooseImage(img)}
                />
              ))}
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{ marginTop: "10px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundImage;
