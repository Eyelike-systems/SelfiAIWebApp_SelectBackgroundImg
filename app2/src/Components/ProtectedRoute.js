// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // or use a context/store
  return token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
