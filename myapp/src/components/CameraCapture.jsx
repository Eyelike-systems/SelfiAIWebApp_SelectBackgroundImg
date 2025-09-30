import React from "react";

const CameraCapture = ({
  videoRef,
  canvasRef,
  imageDataUrl,
  isImageCaptured,
  isImageVisible,
  onCapture,
  onCancel,
}) => (
  <div className="video-container">
    {!isImageCaptured && (
      <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
    )}
    <canvas ref={canvasRef} style={{ display: "none" }} />
    {isImageVisible && imageDataUrl && (
      <img src={imageDataUrl} alt="Captured" className="captured-image" />
    )}
    <div className="button-group">
      {!isImageCaptured ? (
        <button onClick={onCapture}>Capture</button>
      ) : (
        <button onClick={onCancel}>Retry</button>
      )}
    </div>
  </div>
);

export default CameraCapture;
