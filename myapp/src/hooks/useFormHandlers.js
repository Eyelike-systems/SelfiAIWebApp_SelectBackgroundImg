import { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";

const useFormHandlers = ({ formRef, videoRef, canvasRef, navigate }) => {
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [isImageCaptured, setIsImageCaptured] = useState(false);
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [addDataToDatabase, setAddDataToDatabase] = useState(false);
  const [addPaymentResponseInState, setAddPaymentResponseInState] = useState(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
  }, [videoRef]);

  const checkFormCompletion = () => {
    const form = formRef.current;
    if (form) {
      const allFieldsFilled = [...form.elements].every(
        (el) => el.type === "submit" || el.value.trim() !== ""
      );
      setIsFormComplete(allFieldsFilled && isImageCaptured);
    }
  };

  const handleCapture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    setImageDataUrl(dataUrl);
    setIsImageCaptured(true);
    setIsImageVisible(true);
    checkFormCompletion();
  };

  const handleCancel = () => {
    setIsImageVisible(false);
    setIsImageCaptured(false);
    checkFormCompletion();
  };

  const handleClick222 = async (e) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form || !isFormComplete) return;
    setLoading(true);
    try {
      const blob = await fetch(imageDataUrl).then((res) => res.blob());
      const base64Data = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });

      const payload = {
        customer_name: form.fname.value,
        customer_phone: form.mno.value,
        customer_email: "abc@gmail.com",
        order_amount: form.order_amount.value,
        base64String: base64Data,
      };

      const response = await axios.post(`${config.IP_ADDRESS}/payment`, payload);
      const sessionId = response.data.payment_session_id;
      const orderId = response.data.order_id;

      if (sessionId) {
        const cashfree = await (await import("@cashfreepayments/cashfree-js")).load({ mode: config.MODE });
        await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_modal" });
        await verifyPayment(orderId);
      }
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (orderId) => {
    try {
      const verifyRes = await axios.post(`${config.IP_ADDRESS}/verify`, { orderId });
      const status = verifyRes.data.payment_status;
      setAddPaymentResponseInState(status);
      if (["PENDING", "FAILED", "USER_DROPPED"].includes(status)) {
        setAddDataToDatabase(true);
      } else if (status === "SUCCESS") {
        navigate("/receipt");
      }
    } catch (err) {
      console.error("Verify error:", err);
      setErrorMessage("Verification failed.");
    }
  };

  return {
    imageDataUrl,
    isImageCaptured,
    isImageVisible,
    isFormComplete,
    errorMessage,
    loading,
    addDataToDatabase,
    addPaymentResponseInState,
    handleCapture,
    handleCancel,
    handleClick222,
    checkFormCompletion,
  };
};

export default useFormHandlers;