import React from "react";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";
import "../assets/css/receipt.css";

export const Receipt = () => {
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.payment.userInfo);
  const userData = userInfo?.[0]; 

  console.log('userData: ', userData)

  const redirectToHome = () => navigate("/");

  const downloadPDF = () => {
    if (!userData) return;

    const doc = new jsPDF();

    doc.setTextColor("#fc0303");
    doc.setFontSize(18);
    doc.text("Datta Mandir", 105, 20, null, null, "center");

    doc.setFontSize(10);
    doc.text("Payment Receipt", 105, 35, null, null, "center");

    const entries = [
      { label: "Your image will be displayed at this time", value: userData.user_selected_time },
      { label: "Order ID", value: userData.order_id },
      { label: "Transaction ID", value: userData.transaction_id },
      { label: "Amount", value: userData.order_amount },
      { label: "Currency", value: userData.payment_currency },
      { label: "Status", value: userData.payment_status },
      { label: "Completed At", value: userData.payment_completion_time },
    ];

    let startY = 50;
    const cellHeight = 10;

    entries.forEach((item, index) => {
      doc.setFillColor(78, 78, 77);
      doc.rect(20, startY + index * cellHeight, 170, cellHeight, "F");

      doc.setTextColor(255, 255, 255);
      doc.text(`${item.label}:`, 25, startY + 7 + index * cellHeight);
      doc.text(`${item.value}`, 95, startY + 7 + index * cellHeight);
    });

    const footerY = startY + entries.length * cellHeight + 20;
    doc.setTextColor(200, 200, 200);
    doc.text("Powered by", 75, footerY);
    doc.setTextColor(41, 128, 185);
    doc.textWithLink("Eye Like Systems", 110, footerY, {
      url: "https://eyelikesystems.com",
    });

    doc.save("receipt.pdf");
  };

  return (
    <div className="receipt-container">
      <button onClick={redirectToHome} className="btnRedirectToHome">
        Back To Home
      </button>

      <div className="receipt-card">
        <h1 style={{ color: "#fc0303", marginBottom: "10px" }}>Datta Mandir</h1>
        <h4 style={{ color: "#ffffff", marginBottom: "30px" }}>
          Payment Receipt
        </h4>

        {!userData ? (
          <p style={{ color: "#ccc" }}>No data available</p>
        ) : (
          <>
            <div>
              <table className="responsive-table">
                <tbody>
                  {[
                    // ["Your image will be displayed at this time", userData.user_selected_time ]
                    ["Order ID", userData.order_id],
                    ["Transaction ID", userData.transaction_id],
                    ["Amount", userData.order_amount],
                    ["Currency", userData.payment_currency],
                    ["Status", userData.payment_status],
                    ["Completed At", userData.payment_completion_time],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td data-label={label}>{label}</td>
                      <td data-label={label}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={downloadPDF} className="btnRedirectToHome" style={{ marginTop: "20px" }}>
              Download PDF
            </button>
          </>
        )}

        <div style={{ marginTop: "20px" }}>
          <span style={{ color: "#888" }}>Powered by </span>
          <a
            href="https://eyelikesystems.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#3498db",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Eye Like Systems
          </a>
        </div>
      </div>
    </div>
  );
};
