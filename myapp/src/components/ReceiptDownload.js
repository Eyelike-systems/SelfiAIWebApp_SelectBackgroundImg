import { useDispatch } from "react-redux";
import { resetUserAllInfo } from "../redux/slices/paymentSlice";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";
import "../assets/css/receipt.css";
import Logo from '../assets/images/eyelikesystemsLogo.jpg'
import { useLocation } from "react-router-dom";

export const ReceiptDownload = ({}) => {
    const location = useLocation();
    const passedUserData = location.state;

    console.log("passedUserData: ", passedUserData)

  const navigate = useNavigate();
  const dispatch = useDispatch();

    //   const userInfo = useSelector((state) => state.payment.userInfo);
    //   const userData = userInfo?.[0];
  const userData = passedUserData;
//   var completionText = userData.payment_completion_time || "Payment not completed";
  console.log("USERDATA: ", userData)

  const redirectToHome = () => {
    dispatch(resetUserAllInfo());
    navigate("/");
  }

  const downloadPDF = () => {
    if (!userData) return;

    const doc = new jsPDF();

    doc.setTextColor("#fc0303");
    doc.setFontSize(18);
    // doc.text("Datta Mandir", 105, 20, null, null, "center");

    doc.setFontSize(10);
    doc.text("Payment Receipt", 105, 35, null, null, "center");

    // Add fallback text if completion_time is null/undefined
    const displayTimeText = userData.payment_completion_time
      ? userData.user_selected_time
      : "Your image will not be displayed due to payment issue";

    
    const entries = [
      // { label: "Your image will be displayed at this time", value: displayTimeText },
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
    // Load image and add to PDF
    const img = new Image();
    img.src = Logo;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const logoBase64 = canvas.toDataURL("image/jpeg");

      // Note line
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text("*Note: We don't send any marketing links or offers.", 20, footerY);

      // Powered by + logo + company name
      const poweredByX = 20;
      const poweredByY = footerY + 15;

      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text("Powered by", poweredByX, poweredByY);

      // Add logo right after "Powered by" text
      const logoX = poweredByX + 45; // shift logo right after text
      const logoWidth = 15;
      const logoHeight = 10;
      doc.addImage(logoBase64, "JPEG", logoX, poweredByY - logoHeight + 2, logoWidth, logoHeight);

      // Add company name right after logo
      const textX = logoX + logoWidth + 3;
      doc.setTextColor(41, 128, 185);
      doc.textWithLink("Eye Like Systems LLP", textX, poweredByY, {
        url: "https://eyelikesystems.com",
      });

      doc.save("receipt.pdf");
    };
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
          <div className="loader"></div> // 👈 Loader shown while data is null
        ) : (
          <>
            <div>
              <table className="responsive-table">
                <tbody>
                  {[
                    // [ "Your image will be displayed at this time",
                    //   userData.payment_completion_time
                    //     ? userData.user_selected_time
                    //     : "Your image will not be displayed due to payment issue",
                    // ],
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

        {/* <div style={{ marginTop: "20px" }}>
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
        </div> */}
      </div>
    </div>
  );
};
