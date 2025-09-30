import React, { useState, useRef, useEffect } from "react";
import useLocationAndDeviceCheck from "../hooks/useLocationAndDeviceCheck";
import { useNavigate } from "react-router-dom";
import config from "../config";
import axios from "axios";
import { load } from "@cashfreepayments/cashfree-js";
import { useDispatch } from "react-redux";
import { setPaymentStatus, addUserInfo, resetUserAllInfo } from "../redux/slices/paymentSlice";
import AddLogsInDatabase from "./AddLogsInDatabase";
import flip_cam_icon from "../assets/images/flip_cam.jpeg";

const SentFormData = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { isMobile, isAllowed, distanceAway } = useLocationAndDeviceCheck();

  const [imageDataUrl, setImageDataUrl] = useState("");
  const [isImageCaptured, setIsImageCaptured] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const [imageBlobS, setImageBlobS] = useState(null);


  // const [addDataToDatabase, setAddDataToDatabase] = useState(false);
  const [addPaymentResponseInState, setAddPaymentResponseInState] =
    useState(null);
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
  let slogan = "";
  let blob = null;
  let imageBlob = null;
  let user_selected_time;
  let user_selected_date;

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
    // "@cashfreepayments/cashfree-js": "^1.0.4",
    });
    // console.log("Cashfree SDK loaded:", cashfree);
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
      setErrorMessage(" ")
      setIsImageVisible(true);
      setIsImageCanceled(false);
      checkFormCompletion(true);

    // 👇 Add scroll here
    if (formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const convertToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // prevent default form behavior
    setLoading(true);
    setErrorMessage("");

    if (!isImageCaptured) {
      setErrorMessage("Please capture your image before submitting. / सबमिट करण्यापूर्वी कृपया आपली प्रतिमा कॅप्चर करा.");
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
      formData.append("slogan", form.slogan.value);
      formData.append("image", blob, "image.jpg"); // Add filename and ensure blob is a valid image

      customer_name = form.fname.value;
      customer_phone = form.mno.value;
      order_amount = form.order_amount.value;
      slogan =  form.slogan.value;
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
      const verifyResponse = await axios.post(`${config.IP_ADDRESS}/verify`, {
        orderId,
      });

      paymentReqResponse = verifyResponse;
      console.log("paymentReqResponse: ", paymentReqResponse.data)
      setAddPaymentResponseInState(paymentReqResponse.data.payment_status);
      
      // console.log("imageBlob type:", typeof imageBlob);
      // console.log("imageBlob instanceof Blob:", imageBlob instanceof Blob);
      // console.log("imageBlob:", imageBlob);

      const {
        order_id,
        cf_payment_id,
        order_amount,
        payment_currency,
        payment_completion_time,
        payment_status,
      } = paymentReqResponse.data;

      const paymentDetails = {
        order_amount,
        customer_phone,
        customer_name,
        customer_email,
        slogan,
        imageBlob,
        user_selected_time,
        user_selected_date,
        payment_status,
        order_id,
        transaction_id: cf_payment_id,
        payment_currency,
        payment_completion_time,
      };
      
      const formData2 = new FormData();

      for (const key in paymentDetails) {
        if (key === "imageBlob") {
          formData2.append("image", paymentDetails[key], "image.jpg");
        } else {
          formData2.append(key, paymentDetails[key]);
        }
      }

      const handlePayments = async () => {
        if (payment_status === "SUCCESS") {
          navigate("/receipt");
          try {
            const addDataResponse = await axios.post(
              `${config.IP_ADDRESS}/addDataInDatabase`,
              formData2, {
              headers: {
                "Content-Type": "multipart/form-data", // axios sets this automatically if omitted
              },
            });
            
            // const showTime = addDataResponse.data;
            // let userSelectedTime =  addDataResponse.data.user.user_selected_time
            let userSelectedTime = addDataResponse.data.user.user_selected_time;
            let userSelectedDate = addDataResponse.data.user.user_selected_date;
            console.log("user_selected_time: ", userSelectedTime )
            dispatch(setPaymentStatus("SUCCESS"));
            const { imageBlob, ...safePaymentDetails } = paymentDetails;
            const { imageBlob: ignored, ...safeUserData } = addDataResponse.data.user;
            dispatch(addUserInfo({ ...safePaymentDetails, ...safeUserData, 
                                  user_selected_time: userSelectedTime,
                                  user_selected_date: userSelectedDate,
                                }));
          } catch (dbError) {
            console.error("Error adding user to DB:", dbError);
          }
        } else {
            dispatch(setPaymentStatus(payment_status));
            const { imageBlob, ...safePaymentDetails } = paymentDetails;
            dispatch(addUserInfo(safePaymentDetails));
        }
      };

      handlePayments();
    } catch (error) {
      console.error("Error verifying payment:", error);
      alert("An error occurred while verifying payment.");
    }
  };

  const handleClick222 = async (event) => {
    const data = await handleSubmit(event);

    if (!data) return;

    let sessionId = data.payment_session_id;
    orderId = data.order_id;

    if (sessionId) {
      let checkoutOptions = {
        paymentSessionId: sessionId,
        redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then((res) => {
        verifyPayment(orderId);
      });
    }
  }
  
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
        <p>This app only works on mobile devices. Please open it on your phone.</p>
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
    <div className="main">
      <div className="camera">
        {isImageVisible && !isImageCanceled ? (
          <>
            <img src={imageDataUrl} alt="Captured" className="img-captured" />
            <div className="btn">
              <button onClick={handleCancel}>Retake Photo / फोटो पुन्हा घ्या </button>
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
                  transform: facingMode === "user" ? "scaleX(-1)" : "scaleX(1)",
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
                Take Picture / फोटो काढा <span style={{ color: "red"}}>*</span>
              </button>
            </div>
          </>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
        {isImageCaptured && (
          <p className="showText">Image captured successfully</p>
        )}
      </div>

      <div className="info">
        <div className="form">
          <form
            ref={formRef}
            id="dataForm"
            onChange={checkFormCompletion}
            onSubmit={(event) => handleClick222(event)}
          >
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
              WhatsApp Number / मोबाईल नंबर <span style={{ color: "red" }}>*</span>
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
            <label htmlFor="slogan">Select Slogan  / स्लोगन निवडा </label>
            <br />
            <br />
            <select
              id="slogan"
              name="slogan"
              // defaultValue="21"
              required
            >
              {/* <option value="गणपती बाप्पा मोरया, मंगलमूर्ती मोरया!">गणपती बाप्पा मोरया, मंगलमूर्ती मोरया!</option>
              <option value="जय देव जय देव, जय मंगलमूर्ती!">जय देव जय देव, जय मंगलमूर्ती!</option>
              <option value="एक दोन तीन चार, गणपतींचा जयजयकार!">एक दोन तीन चार, गणपतींचा जयजयकार!</option> */}

              <option value="ॐ श्री गुरुदेव दत्त">ॐ श्री गुरुदेव दत्त</option>
              <option value="दत्त दिगंबर नमः शिवाय">दत्त दिगंबर नमः शिवाय</option>
              <option value="ॐ दत्त दिगंबराय नमः">ॐ दत्त दिगंबराय नमः</option>
              {/* <option value="जय देवी महालक्ष्मी!">जय देवी महालक्ष्मी!</option> */}
            </select><br />
            <br />
            <label htmlFor="order_amount">
              Select Amount / रक्कम निवडा <span style={{ color: "red" }}>*</span>
            </label>
            <br />
            <br />
            <select
              id="order_amount"
              name="order_amount"
              defaultValue="11"
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

            {loading && <div id="loader"></div>}

            <p style={{ color: "#d1c9c9", fontStyle: "italic" }}>
              "Please fill out all required fields marked with an asterisk (*)
              before submitting." / "सबमिट करण्यापूर्वी कृपया तारांकित (*) चिन्हांकित केलेली सर्व आवश्यक फील्ड भरा."
            </p>

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

      {["PENDING", "FAILED", "USER_DROPPED"].includes(addPaymentResponseInState) &&
        imageBlobS &&
        <AddLogsInDatabase imageBlob={imageBlobS} />
      }

    </div>
  );
};

export default SentFormData;
