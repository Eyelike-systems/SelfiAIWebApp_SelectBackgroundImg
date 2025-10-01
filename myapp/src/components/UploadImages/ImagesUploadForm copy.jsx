import React, { useState } from "react";

const ImagesUploadForm = ({ onUploadSuccess = () => {} }) => {
  // 👈 default no-op
  const [files, setFiles] = useState([]);

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
      alert(`${data.files.length} images uploaded!`);
      onUploadSuccess(); // will just be a no-op if parent didn’t provide
      setFiles([]);
    }
  };

  return (
    // <div style={{ position:'relative', backgroundColor:'whitesmoke', height:'90%'}}>
    //   <div style={{display:'flex', backgroundColor:'gray', alignItems:'center', justifyContent:'center' }}>
    //     <form onSubmit={handleSubmit}>
    //       <input type="file" accept="image/*" multiple onChange={handleFileChange} />
    //       <button type="submit">Upload Images</button>
    //       {files.length > 0 && (
    //         <ul>
    //           {files.map((file, idx) => (
    //             <li key={idx}>{file.name}</li>
    //           ))}
    //         </ul>
    //       )}
    //     </form>
    //   </div>
    // </div>
    <div
      style={{
        position: "relative",
        backgroundColor: "whitesmoke",
        height: "85vh", // full screen height
        display: "flex",
        alignItems: "center", // vertical center
        justifyContent: "center", // horizontal center
      }}
    >
      <div
        style={{
          backgroundColor: "gray",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 10px 12px rgba(0, 0, 0, 0.2)",
          minWidth: "320px",
          maxWidth: "500px",
          color: "white",
          textAlign: "center",
        }}
      >
        <form onSubmit={handleSubmit}>
          <h2 style={{ marginBottom: "20px" }}>Upload Your Images</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{
              marginBottom: "15px",
              display: "block",
              width: "100%",
            }}
          />
          {files.length > 0 && (
            <ul
              style={{
                marginTop: "20px",
                textAlign: "left",
                color: "#eee",
                maxHeight: "120px",
                overflowY: "auto",
                padding: 0,
                listStyle: "none",
              }}
            >
              {files.map((file, idx) => (
                <li key={idx}>📂 {file.name}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            style={{
              backgroundColor: "white",
              color: "gray",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default ImagesUploadForm;
