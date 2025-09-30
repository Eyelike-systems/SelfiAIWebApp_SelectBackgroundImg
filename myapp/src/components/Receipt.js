import { useSelector, useDispatch } from "react-redux";
import { resetUserAllInfo } from "../redux/slices/paymentSlice";
import { useNavigate } from "react-router-dom";
import "../assets/css/receipt.css";

export const Receipt = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.payment.userInfo);
  const userData = userInfo?.[0];

  const redirectToHome = () => {
    dispatch(resetUserAllInfo());
    navigate("/");
  };

  // Function to format date like 30-June-2025
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const dateObj = new Date(dateStr);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString("default", { month: "long" });
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Function to format time in 12-hour format
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle loading
  if (!userData) {
    return (
      <div className="receipt-container">
        <div className="receipt-card">
          <div className="loader"></div>
          <p style={{ color: "#fff", textAlign: "center", marginTop: "10px" }}>
            Loading your data...
          </p>
        </div>
      </div>
    );
  }

  // Extract values
  const displayDate = formatDate(userData.user_selected_date);
  const displayTime = formatTime(userData.user_selected_time);
  const isSuccess = userData.payment_status === "SUCCESS";
  const failureReason = userData.payment_status;

  return (
    <div className="receipt-container">
      <div className="receipt-card">
        {isSuccess ? (
          <>
            <p style={{ color: "#fff", fontSize: "18px" }}>
              You will get your image on WhatsApp with selected background image.
            </p>
            {/* <p style={{ color: "#fff", fontSize: "18px", fontWeight: "bold" }}>
              {displayDate} at {displayTime}
            </p> */}
            <p style={{ color: "#fff", marginTop: "10px" }}>
              For receipt{" "}
              <span
                onClick={() => navigate("/receiptDownload", { state: userData })}
                style={{ color: "red", cursor: "pointer", textDecoration: "none" }}
              >
                click here
              </span>
            </p>
          </>
        ) : (
          <>
            <p style={{ color: "#fff", fontSize: "16px" }}>
              Payment failed or incomplete.
            </p>
            <p style={{ color: "#fff" }}>
              Status: <strong>{failureReason}</strong>
            </p>
            <button
              onClick={redirectToHome}
              style={{
                marginTop: "15px",
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor: "green",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Retry / Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
};
