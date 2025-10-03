import "./assets/css/styles.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SentFormData from "./components/Form";
import PageNotFound from "./components/PageNotFound/PageNotFound";
import { Receipt } from "./components/Receipt";
import Header from "./components/Header";
import { ReceiptDownload } from "./components/ReceiptDownload";
import ImagesUploadForm from "./components/UploadImages/ImagesUploadForm";
function App() {
  return (
    <>
      <Router>
        <Header />
        <Routes>
          <Route exact path="/" element={<SentFormData />} />
          <Route exact path="/receipt" element={<Receipt />} />
          <Route exact path="/receipt_download" element={<ReceiptDownload />} />
          <Route exact path="/add_background_images" element={<ImagesUploadForm />} />
          {/* Catch-all route for 404 page */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
    </>
  ); 
}

export default App;
