import "./assets/css/styles.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SentFormData from "./components/Form";
import PageNotFound from "./components/PageNotFound/PageNotFound";
import { Receipt } from "./components/Receipt";
import Header from "./components/Header";
import { ReceiptTest } from "./components/ReceiptTest";
import { ReceiptDownload } from "./components/ReceiptDownload";
// import SentFormData from "./components/SentFormData";
function App() {
  return (
    <>
      <Router>
        <Header />
        <Routes>
          <Route exact path="/" element={<SentFormData />} />
          <Route exact path="/receipt" element={<Receipt />} />
          <Route exact path="/receiptDownload" element={<ReceiptDownload />} />
          {/* <Route exact path="/receiptTest" element={<ReceiptTest />} /> */}
          {/* Catch-all route for 404 page */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
    </>
  ); 
}

export default App;
