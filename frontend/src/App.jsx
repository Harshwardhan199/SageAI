import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./context/AuthContext";
import LoadingOverlay from "./components/common/LoadingOverlay";

import Home from "./components/home/Home";
import LoginSignUp from "./components/LoginSignUp";

function App() {
  const { loading } = useAuth();

  return (
    <>
      {/* Routes always render — no layout shifts or remounting */}
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/loginSignUp" element={<LoginSignUp />} />
        </Routes>
      </Router>

      {/* Global loading overlay — appears on top while auth is initializing */}
      <LoadingOverlay visible={loading} message="Initializing..." />

      {/* Toast notifications render independently */}
      <ToastContainer position="top-center" autoClose={3000} />
    </>
  );
}

export default App;
