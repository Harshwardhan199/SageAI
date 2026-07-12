import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./context/AuthContext";

import Home from "./components/home/Home";
import LoginSignUp from "./components/LoginSignUp";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center w-screen h-screen bg-[#141414] text-white text-xl">
          Loading...
        </div>

        <ToastContainer position="top-center" autoClose={3000} />
      </>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/loginSignUp" element={<LoginSignUp />} />
        </Routes>
      </Router>

      <ToastContainer position="top-center" autoClose={3000} />
    </>
  );
}

export default App;
