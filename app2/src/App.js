// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PageNotFound from './Components/PageNotFound/PageNotFound';
// import DashboardWithSSE from './Components/DashboardWithSSEWithADD';
import DashboardWithSSE from './Components/DashboardWithSSE';
import Login from './pages/Login';
import ProtectedRoute from './Components/ProtectedRoute';
import AnimatedImage from './Components/animation/Gif';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Default route goes to dashboard which is protected */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/ani" element={<AnimatedImage />} />

        {/* Protect dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardWithSSE />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
