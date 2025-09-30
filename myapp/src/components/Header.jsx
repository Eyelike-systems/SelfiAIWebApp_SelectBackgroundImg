import { useNavigate } from 'react-router-dom'; // Import useNavigate
import logo from '../assets/images/eyelikesystemsLogo.jpg'
import {useDispatch } from "react-redux";
import {resetUserAllInfo } from "../redux/slices/paymentSlice";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Initialize useNavigate

  const handleNavigation = () => {
    dispatch(resetUserAllInfo());
    navigate('/'); // Navigate to the main page
  };

  return (
    <div className="title"> 
    {/* //#5e5c5c */}
      <img
        className="logo"
        src={logo}
        alt="logo"
        onClick={handleNavigation} // Add click handler to navigate
        style={{ cursor: 'pointer' }} // Optional: change cursor to pointer for better UX
      />
      <div className="title-text" onClick={handleNavigation} style={{ cursor: 'pointer' }}>
        <h2>Eye Like Systems</h2>
      </div>
    </div>
  );
};

export default Header;
