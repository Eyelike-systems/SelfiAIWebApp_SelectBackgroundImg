import React, { useState } from "react";

const ImagesUploadForm = () => {
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const res = await fetch("http://localhost:3000/background/images", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      setPreviewUrls(data.files.map((f) => f.url)); // show processed images
      alert(`${data.files.length} images uploaded!`);
      setFiles([]);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#1b0450ff",
        height: "90%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "10px",
      }}
    >
      <div
        style={{
          backgroundColor: "gray",
          padding: "20px",
          borderRadius: "10px",
          width: "90%", // responsive width
          maxWidth: "500px", // don’t stretch too wide
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ textAlign: "center", width: "100%" }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ width: "100%", marginBottom: "10px" }}
          />

          {files.length > 0 && (
            <div
              style={{
                marginTop: "15px",
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              {files.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: "1 1 calc(33.333% - 10px)", // 3 per row on big screens
                    maxWidth: "120px", // prevent huge thumbnails
                    minWidth: "80px", // shrink on small screens
                    aspectRatio: "1 / 1", // keep square shape
                    overflow: "hidden",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    backgroundColor: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          
          <button
            type="submit"
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: "black",
              color: "white",
              cursor: "pointer",
            }}
          >
            Upload Images
          </button>
        </form>
      </div>
    </div>
  );
};

export default ImagesUploadForm;
