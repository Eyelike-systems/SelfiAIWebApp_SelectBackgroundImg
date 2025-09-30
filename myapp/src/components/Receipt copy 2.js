import { useSelector, useDispatch } from "react-redux";
import { setPaymentStatus, addUserInfo } from "../redux/slices/paymentSlice";
import { useNavigate } from "react-router-dom";
import "../assets/css/receipt.css";

export const Receipt = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.payment.userInfo);
  const userData = userInfo?.[0];
  var completionText = null;
  console.log("USERDATA: ", userData);

  const redirectToHome = () => {
    dispatch(setPaymentStatus(""));
    dispatch(addUserInfo(""));
    navigate("/");
  };

  return (
    <div className="receipt-container">
      <button onClick={redirectToHome} className="btnRedirectToHome">
        Back To Home
      </button>

      <div className="receipt-card">
        {[
          [
            "Your image will be displayed at this time: ",
            userData?.payment_completion_time
          ],
        ]}
        <br></br>
        <br></br>
        <p style={{ color: "#fff", marginBottom: "10px" }}>
          For receipt{" "}
          <span
            onClick={() => navigate("/receiptDownload", { state: userData })}
            style={{ color: "red", cursor: "pointer", textDecoration: "none" }}
          >
            click here
          </span>
        </p>

      </div>
    </div>
  );
};
