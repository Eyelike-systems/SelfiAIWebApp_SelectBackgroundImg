import React from "react";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";

export const ReceiptTest = () => {
  let navigate = useNavigate();
  const userInfo = useSelector((state) => state.payment.userInfo);

  const userData = {
    order_id: "1564123",
    transaction_id: "asdsdf45453",
    order_amount: 50,
    payment_currency: "INR",
    payment_status: "SUCCESS",
    payment_completion_time: "16:50 PM",
  };

  const redirectToHome = () => {
    navigate("/");
  };

  // const downloadPDF = () => {
  //   const doc = new jsPDF();
  //   doc.setFontSize(18);
  //   doc.text("Shree Ram Mandir Trust", 105, 20, null, null, "center");
  //   doc.setFontSize(16);
  //   doc.text("Payment Receipt", 105, 35, null, null, "center");

  //   const entries = [
  //     { label: "Order ID", value: userData.order_id },
  //     { label: "Transaction ID", value: userData.transaction_id },
  //     { label: "Amount", value: userData.order_amount },
  //     { label: "Currency", value: userData.payment_currency },
  //     { label: "Status", value: userData.payment_status },
  //     { label: "Completed At", value: userData.payment_completion_time },
  //   ];

  //   entries.forEach((item, index) => {
  //     doc.text(`${item.label}: ${item.value}`, 20, 50 + index * 10);
  //   });

  //   doc.setFontSize(12);
  //   doc.text("Powered by Eye Like Systems", 105, 140, null, null, "center");
  //   doc.save("receipt.pdf");
  // };

  const downloadPDF = () => {
  const doc = new jsPDF();

  // Header styles
  doc.setTextColor("#fc0303"); // yellow
  doc.setFontSize(18);
  doc.text("Datta Mandir", 105, 20, null, null, "center");

  doc.setFontSize(10);
  doc.text("Payment Receipt", 105, 35, null, null, "center");

  const entries = [
    { label: "Order ID", value: userData.order_id },
    { label: "Transaction ID", value: userData.transaction_id },
    { label: "Amount", value: userData.order_amount },
    { label: "Currency", value: userData.payment_currency },
    { label: "Status", value: userData.payment_status },
    { label: "Completed At", value: userData.payment_completion_time },
  ];

  // Table start position
  let startY = 50;
  const cellHeight = 10;

  entries.forEach((item, index) => {
    // Background color
    doc.setFillColor(78, 78, 77); // dark row background
    doc.rect(20, startY + index * cellHeight, 170, cellHeight, 'F'); // filled rectangle

    doc.setTextColor(255, 255, 255); // white text
    doc.text(`${item.label}:`, 25, startY + 7 + index * cellHeight);
    doc.text(`${item.value}`, 95, startY + 7 + index * cellHeight);
  });

  // Powered by text with link
  const footerY = startY + entries.length * cellHeight + 20; 
  doc.setTextColor(200, 200, 200); // light gray
  doc.text("Powered by", 75, footerY);

  doc.setTextColor(41, 128, 185); // blue
  doc.textWithLink("Eye Like Systems", 110, footerY, {
    url: "https://eyelikesystems.com",
  });

  doc.save("receipt.pdf");
};


  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      backgroundColor: "rgb(78, 78, 77)",
      color: "#ffffff",
      minHeight: "100vh",
      padding: "30px"
    }}>
      {/* ORIGINAL BACK TO HOME BUTTON - UNTOUCHED */}
      <button onClick={redirectToHome} className="btnRedirectToHome">
        Back To Home
      </button>

      <div style={{
        maxWidth: "600px",
        margin: "30px auto",
        backgroundColor: "#1e1e1e",
        padding: "30px",
        borderRadius: "10px",
        backgroundColor: "rgb(53, 53, 53)",
        textAlign: "center"
      }}>
        <h1 style={{ color: "#fc0303", marginBottom: "10px" }}>Datta Mandir</h1>
        <h4 style={{ color: "#ffffff", marginBottom: "30px" }}>Payment Receipt</h4>

        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "30px"
        }}>
          <tbody>
            {[
              ["Order ID", userData.order_id],
              ["Transaction ID", userData.transaction_id],
              ["Amount", userData.order_amount],
              ["Currency", userData.payment_currency],
              ["Status", userData.payment_status],
              ["Completed At", userData.payment_completion_time],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={cellStyle}><strong>{label}</strong></td>
                <td style={cellStyle}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={downloadPDF}
          className="btnRedirectToHome"
        >
          Download PDF
        </button>

        <div style={{ marginTop: "20px" }}>
          <span style={{ color: "#888" }}>Powered by </span>
          <a
            href="https://eyelikesystems.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#3498db",
              textDecoration: "none",
              fontWeight: "bold"
            }}
          >
            Eye Like Systems
          </a>
        </div>
      </div>
    </div>
  );
};

const cellStyle = {
  border: "1px solid #666",
  padding: "10px",
  textAlign: "left",
  color: "#fff",
};
