import React, { useState, useRef, useEffect } from "react";
import useLocationAndDeviceCheck from "../hooks/useLocationAndDeviceCheck";
import { useNavigate } from "react-router-dom";
import config from "../config";
import axios from "axios";
import { load } from "@cashfreepayments/cashfree-js";
import { useDispatch } from "react-redux";
import {
  setPaymentStatus,
  addUserInfo,
  resetUserAllInfo,
} from "../redux/slices/paymentSlice";
import flip_cam_icon from "../assets/images/flip_cam.jpeg";
import BackgroundImage from "./BackgroundImage";

const SentFormData = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isMobile, isAllowed, distanceAway } = useLocationAndDeviceCheck();
  const [isPortrait, setIsPortrait] = useState(
    window.matchMedia("(orientation: portrait)").matches
  );

  const [isSubmitted, setIsSubmitted] = useState(false);

  // 🔹 Orientation listener
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
    };

    window.addEventListener("resize", handleOrientationChange);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", handleOrientationChange);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  const [imageDataUrl, setImageDataUrl] = useState("");
  const [isImageCaptured, setIsImageCaptured] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const [imageBlobS, setImageBlobS] = useState(null);

  const [facingMode, setFacingMode] = useState("user");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const formRef = useRef(null);
  // const submitBtnRef = useRef(null);

  const [isImageVisible, setIsImageVisible] = useState(false);
  const [isImageCanceled, setIsImageCanceled] = useState(false);

  let order_amount;
  // let payload2;
  let cashfree;

  let orderId = "";
  let paymentReqResponse = null;
  let customer_phone = "";
  let customer_name = "";
  let customer_email = "";
  let blob = null;
  let imageBlob = null;

  // let insitialzeSDK = async function () {
  //   cashfree = await load({
  //     mode: config.MODE,
  //   });
  // };
  let insitialzeSDK = async function () {
    try {
      cashfree = await load({
        mode: config.MODE,
        version: "2022-09-01", // 👈 REQUIRED
        //"@cashfreepayments/cashfree-js": "^1.0.4",
      });
      //console.log("Cashfree SDK loaded:", cashfree);
    } catch (err) {
      console.error("Cashfree SDK failed to load", err);
    }
  };
  insitialzeSDK();

  useEffect(() => {
    dispatch(resetUserAllInfo()); // First remove all redux stored data
  }, [dispatch]);

  React.useEffect(() => {
    if (isAllowed) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing the camera: ", err);
        }
      };
      startCamera();
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isAllowed, facingMode]);

  const handleCapture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.setTransform(1, 0, 0, 1, 0, 0);

      if (facingMode !== "user") {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/png");
      setImageDataUrl(dataUrl);
      setIsImageCaptured(true);
      setErrorMessage(" ");
      setIsImageVisible(true);
      setIsImageCanceled(false);
      checkFormCompletion(true);

      // 👇 Add scroll here
      if (formRef.current) {
        setTimeout(() => {
          formRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 300); // slight delay helps smooth scroll trigger after render
      }
    }
  };

  const checkFormCompletion = (data) => {
    const form = formRef.current;
    if (form) {
      const formFields = [...form.elements].filter(
        (el) => el.type !== "submit"
      );
      const allFieldsFilled = formFields.every(
        (field) => field.value.trim() !== ""
      );
      const formComplete = allFieldsFilled && isImageCaptured;
    }
  };

  // Select background image start -------------------------------------------------------------
  const [selectedBgImage, setSelectedBgImage] = useState(null);
  const [selectedBgPreview, setSelectedBgPreview] = useState(null);

  // Update this when BackgroundImage calls onSelect
  const handleBgSelect = (file) => {
    setSelectedBgImage(file);
    setSelectedBgPreview(URL.createObjectURL(file));
  };

  // Select background image end -------------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault(); // prevent default form behavior
    setLoading(true);
    setErrorMessage("");

    if (!isImageCaptured) {
      setErrorMessage(
        "Please capture your image before submitting. / सबमिट करण्यापूर्वी कृपया आपली प्रतिमा कॅप्चर करा."
      );
      setLoading(false);
      return;
    }

    try {
      blob = await fetch(imageDataUrl).then((res) => res.blob());

      setImageBlobS(blob);

      const form = formRef.current;
      const formData = new FormData();
      formData.append("customer_name", form.fname.value);
      formData.append("customer_phone", form.mno.value);
      formData.append("order_amount", form.order_amount.value);
      formData.append("image", blob, "image.jpg"); // Add filename and ensure blob is a valid image

      if (selectedBgImage) {
        formData.append("background_image", selectedBgImage);
        // sends the actual image file
      }

      customer_name = form.fname.value;
      customer_phone = form.mno.value;
      order_amount = form.order_amount.value;
      imageBlob = blob;

      const response = await axios.post(
        `${config.IP_ADDRESS}/payment`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.payment_session_id) {
        return response.data;
      }

      form.reset();
      setImageDataUrl("");
      setIsImageCaptured(false);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(
        error.message || "An error occurred. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("customer_name", customer_name);
      formData.append("customer_phone", customer_phone);
      formData.append("customer_email", customer_email);
      formData.append("image", imageBlob, "image.jpg");
      if (selectedBgImage) {
        formData.append("background_image", selectedBgImage);
        // sends the actual image file
      }

      const verifyResponse = await axios.post(
        `${config.IP_ADDRESS}/verify`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("verifyResponse:", verifyResponse.data);

      const user = verifyResponse.data.user;
      dispatch(addUserInfo(user));
      dispatch(setPaymentStatus(user.payment_status));

      // if (user.payment_status === "SUCCESS") {
      navigate("/receipt");
      // }
    } catch (error) {
      console.error("Error verifying payment:", error);
      alert("An error occurred while verifying payment.");
    }
  };

  const handleClick222 = async (event) => {
    event.preventDefault();

    const data = await handleSubmit(event);
    if (!data) return;

    // Mark form as submitted and show loader
    setIsSubmitted(true); // hide form
    setLoading(true); // show loader

    sessionStorage.setItem("formSubmitted", "true");

    let sessionId = data.payment_session_id;
    orderId = data.order_id;

    if (sessionId) {
      let checkoutOptions = {
        paymentSessionId: sessionId,
        redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then(async (res) => {
        // After Cashfree checkout closes, verify payment
        await verifyPayment(orderId);
        setLoading(false); // hide loader
        // Redirect happens inside verifyPayment when payment_status is SUCCESS
      });
    } else {
      setLoading(false);
      setIsSubmitted(false);
    }
  };

  const handleCancel = () => {
    setIsImageVisible(false);
    setIsImageCaptured(false);
    setIsImageCanceled(true);
    checkFormCompletion(false);

    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error accessing the camera: ", err);
      });
  };

  // Not a mobile device
  if (!isMobile) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "white" }}>
        <h2>⚠️ Mobile Only</h2>
        <p>
          This app only works on mobile devices. Please open it on your phone.
        </p>
      </div>
    );
  }

  if (!isPortrait) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "white" }}>
        <h2>📱 Rotate Your Device</h2>
        <p>
          This app only works in <b>portrait (vertical)</b> mode.
        </p>
      </div>
    );
  }

  // Still verifying location
  if (isAllowed === null) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "white" }}>
        <h2>📍 Verifying Location...</h2>
        <p>Please wait while we confirm your location.</p>
      </div>
    );
  }

  // Outside allowed zone
  if (isAllowed === false) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "white" }}>
        <h2>📍 Location Restricted</h2>
        <p>You are outside the allowed zone.</p>
        {distanceAway !== null && (
          <p>You're {distanceAway} meters away from the target location.</p>
        )}
      </div>
    );
  }

  return (
    <>
      {!isSubmitted ? (
        <div className="main">
          <div className="camera">
            {isImageVisible && !isImageCanceled ? (
              <>
                <img
                  src={imageDataUrl}
                  alt="Captured"
                  className="img-captured"
                />
                <div className="btn">
                  <button onClick={handleCancel}>
                    Retake Photo / फोटो पुन्हा घ्या{" "}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="cam">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                      transform:
                        facingMode === "user" ? "scaleX(-1)" : "scaleX(1)",
                    }}
                  ></video>
                </div>
                <div className="btn">
                  <img
                    className="btn-cam-flip"
                    onClick={() =>
                      setFacingMode((prev) =>
                        prev === "user" ? "environment" : "user"
                      )
                    }
                    src={flip_cam_icon}
                    style={{ objectFit: "cover", width: "40px" }}
                  />
                  <button onClick={handleCapture}>
                    Take Picture / फोटो काढा{" "}
                    <span style={{ color: "red" }}>*</span>
                  </button>
                </div>
              </>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
            {isImageCaptured && (
              <p
                className="showText"
                style={{ color: "green", fontWeight: "bold" }}
              >
                Image captured successfully
              </p>
            )}
          </div>

          <div className="info">
            <div className="form">
              <form
  ref={formRef}
  onSubmit={(event) => {
    event.preventDefault();

    // 1️⃣ Check background image
    if (!selectedBgImage) {
      alert("Please select a background image before submitting.");
      return;
    }

    // 2️⃣ Check camera image
    if (!isImageCaptured) {
      alert("Please capture your image before submitting.");
      return;
    }

    // 3️⃣ Submit form normally
    handleClick222(event);
  }}
>
                
                <br></br>
                <BackgroundImage onSelect={handleBgSelect} />
                {/* invisible input for custom validity */}
                <input
                  type="text"
                  id="bg-required"
                  style={{
                    position: "absolute",
                    left: "-9999px",  // move it off-screen
                    width: "1px",
                    height: "1px",
                    opacity: 0,
                  }}
                  tabIndex="-1"
                />
                {selectedBgPreview && (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={selectedBgPreview}
                    alt="Selected background"
                    width="100"
                    style={{ border: "2px solid #333" }}
                  />
                </div>
              )}

              <p style={{ color: "red", marginTop: "5px" }}>
                {!selectedBgImage && "Background image is required *"}
              </p>
                <br></br>
                <label htmlFor="fname">
                  Name / नाव <span style={{ color: "red" }}>*</span>
                </label>
                <br />
                <br />
                <input
                  type="text"
                  id="fname"
                  name="fname"
                  placeholder="Enter name here"
                  required
                />
                <br />
                <br />
                <label htmlFor="mno">
                  WhatsApp Number / मोबाईल नंबर{" "}
                  <span style={{ color: "red" }}>*</span>
                </label>
                <br />
                <br />
                <input
                  id="mno"
                  name="mno"
                  type="tel"
                  placeholder="Enter mobile number"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required
                />
                <br />
                <br />
                <label htmlFor="order_amount">
                  Select Amount / रक्कम निवडा{" "}
                  <span style={{ color: "red" }}>*</span>
                </label>
                <br />
                <br />
                <select
                  id="order_amount"
                  name="order_amount"
                  // defaultValue="11"
                  required
                >
                  <option value="1">1</option>
                  <option value="11">11</option>
                  <option value="21">21</option>
                  <option value="51">51</option>
                  <option value="101">101</option>
                </select>
                <br />
                <br />
                <input type="checkbox" required defaultChecked></input>
                &nbsp;&nbsp;
                <label htmlFor="whatsapp">
                  Get Photo on Whatsapp<span style={{ color: "red" }}>*</span>
                </label>
                <p style={{ color: "#d1c9c9", fontStyle: "italic" }}>
                  "Please fill out all required fields marked with an asterisk
                  (*) before submitting." / "सबमिट करण्यापूर्वी कृपया तारांकित
                  (*) चिन्हांकित केलेली सर्व आवश्यक फील्ड भरा."
                </p>
                <br></br>
                <p style={{ color: "red" }}>
                  Please wait 5 seconds after payment. You’ll be redirected here
                  to see when your image appearing on the screen. / कृपया पेमेंट
                  पूर्ण झाल्यानंतर ५ सेकंद प्रतीक्षा करा. तुमचा फोटो स्क्रीनवर
                  कधी दिसेल ते तुम्हाला पाहता येईल.
                </p>
                {loading && <div id="loader"></div>}
                {/* Show error if image is not captured */}
                {errorMessage && (
                  <div id="message" style={{ color: "red" }}>
                    {errorMessage}
                  </div>
                )}
                <input
                  type="submit"
                  value="Donate / देणगी"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => {
                    setIsHovered(false);
                    setIsPressed(false); // reset press on leave
                  }}
                  onMouseDown={() => setIsPressed(true)}
                  onMouseUp={() => setIsPressed(false)}
                  style={{
                    backgroundColor: isHovered ? "darkgreen" : "green",
                    color: "white",
                    border: "none",
                    padding: "12px 25px",
                    fontSize: "16px",
                    borderRadius: "8px",
                    marginTop: "5%",
                    cursor: "pointer",
                    boxShadow: isPressed
                      ? "inset 2px 2px 5px rgba(0,0,0,0.3)"
                      : "4px 4px 10px rgba(0,0,0,0.3)",
                    transform: isPressed ? "translateY(2px)" : "translateY(0)",
                    transition: "all 0.1s ease-in-out",
                  }}
                />
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "white", marginTop: "2rem" }}>
          <h2>Processing your payment.....</h2>
          {loading && <div id="loader"></div>}
        </div>
      )}
    </>
  );
};

export default SentFormData;
