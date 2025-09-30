import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import CameraCapture from "./CameraCapture";
import UserForm from "./UserForm";
import useFormHandlers from "../hooks/useFormHandlers";
import AddLogsInDatabase from "./AddLogsInDatabase";

const SentFormData = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const formRef = useRef(null);
  const submitBtnRef = useRef(null);

  const {
    isImageCaptured,
    imageDataUrl,
    isImageVisible,
    loading,
    errorMessage,
    addDataToDatabase,
    addPaymentResponseInState,
    isFormComplete,
    handleCapture,
    handleCancel,
    handleClick222,
    checkFormCompletion,
  } = useFormHandlers({ formRef, videoRef, canvasRef, navigate });

  return (
    <div className="main">
      <div className="camera">
        <CameraCapture
          videoRef={videoRef}
          canvasRef={canvasRef}
          imageDataUrl={imageDataUrl}
          isImageCaptured={isImageCaptured}
          isImageVisible={isImageVisible}
          onCapture={handleCapture}
          onCancel={handleCancel}
        />
      </div>
      <div className="form-container">
        <UserForm
          formRef={formRef}
          submitBtnRef={submitBtnRef}
          onChange={checkFormCompletion}
          onSubmit={handleClick222}
          isFormComplete={isFormComplete}
          loading={loading}
          errorMessage={errorMessage}
        />
      </div>
      {addDataToDatabase && ["PENDING", "FAILED", "USER_DROPPED"].includes(addPaymentResponseInState) && (
        <AddLogsInDatabase />
      )}
    </div>
  );
};

export default SentFormData;