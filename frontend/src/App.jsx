import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./components/home";
import LoginSignUp from "./components/loginSignUp.jsx";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/loginSignUp" element={<LoginSignUp />} />
        </Routes>
      </Router>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}

export default App