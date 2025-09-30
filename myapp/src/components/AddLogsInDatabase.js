import React, { useEffect, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import config from "../config";
import { useNavigate } from "react-router-dom";

const AddLogsInDatabase = ({ imageBlob }) => {
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.payment.userInfo);
  const hasSentData = useRef(false);

  useEffect(() => {
    const sendData = async () => {
      if (!userInfo || userInfo.length === 0 || hasSentData.current) return;

      if (!(imageBlob instanceof Blob)) {
        console.error("imageBlob is not a valid Blob:", imageBlob);
        return;
      }

      hasSentData.current = true;

      const formData = new FormData();
      formData.append("order_amount", userInfo[0].order_amount);
      formData.append("customer_phone", userInfo[0].customer_phone);
      formData.append("customer_name", userInfo[0].customer_name);
      formData.append("customer_email", userInfo[0].customer_email);
      formData.append("image", imageBlob, "image.jpg");
      formData.append("user_selected_time", userInfo[0].user_selected_time);
      formData.append("user_selected_date", userInfo[0].user_selected_date);
      formData.append("payment_status", userInfo[0].payment_status);
      formData.append("order_id", userInfo[0].order_id);
      formData.append("transaction_id", userInfo[0].transaction_id);
      formData.append("payment_currency", userInfo[0].payment_currency);
      formData.append("payment_completion_time", userInfo[0].payment_completion_time);

      try {
        await axios.post(`${config.IP_ADDRESS}/addDataInDatabase`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("User data added successfully");        
        // Redirect after successful database insert
        navigate("/receipt");
      } catch (error) {
        console.error("Error adding user to the database:", error);
      }
    };

    sendData();
  }, [userInfo, imageBlob]);

  return null;
};

export default AddLogsInDatabase;