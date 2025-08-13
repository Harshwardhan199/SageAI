import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
    </>
  )
}

export default App