import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function LoginSignup() {
  const navigate = useNavigate();

  const [loginMode, setLoginMode] = useState(false);

  const { setAccessToken, setUser } = useAuth();

  const handleSignUp = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await axios.post("http://localhost:5000/api/auth/signup", data);

      setAccessToken(res.data.accessToken);
      setUser(res.data.user);

      navigate("/");
    }
    catch (error) {
      console.error("Error signing up:", error);
    }

  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", data, { withCredentials: true });

      setAccessToken(res.data.accessToken);
      setUser(res.data.user);

      navigate("/");
    }
    catch (error) {
      console.error("Error logging in:", error);
    }

  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#141414]">

      {/* {Main Container} */}
      <div className={`relative w-[850px] h-[550px] bg-black m-5 rounded-4xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-600 ease-in-out`}>

        {/* LOGIN FORM */}
        <div className={`absolute w-1/2 h-full bg-black flex items-center text-center p-10 z-[1] transition-all duration-600 ease-in-out ${loginMode ? "right-1/2 opacity-100 pointer-events-auto" : "right-0 opacity-0 pointer-events-none"}`}>

          <form className="w-full" onSubmit={handleLogin}>
            <h1 className="text-4xl text-white font-bold -mt-2 mb-2">Sign In</h1>

            {/* <input type="text" name="fakeuser1" autoComplete="username" style={{ display: "none" }} />
            <input type="password" name="fakepass1" autoComplete="current-password" style={{ display: "none" }} /> */}

            <div className="relative my-7">
              <input
                type="text"
                name="email"
                placeholder="Username or Email"
                autoComplete="off"
                className="w-full py-[13px] pr-[50px] pl-5 bg-[#3a3a3a] rounded-lg text-lg text-white font-medium placeholder-[#7f8c8d] outline-none"
              />


              <i className="bx bxs-user absolute right-5 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
            </div>

            <div className="relative my-7">
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                className="w-full py-[13px] pr-[50px] pl-5 bg-[#3a3a3a] rounded-lg text-lg text-white placeholder-[#7f8c8d] outline-none"
              />
              <i className="bx bxs-lock-alt absolute right-5 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
            </div>

            <div className="-mt-4 mb-4">
              <a href="#" className="text-sm text-white">
                Reset Password ?
              </a>
            </div>

            <button className="w-full h-12 bg-blue-500 rounded-lg shadow-md text-white font-semibold text-lg">Sign In</button>

            <p className="text-[#bdc3c7] mt-4">or sign in with</p>

            <div className="flex justify-center mt-2 text-white">
              {/* {["google", "facebook", "github", "linkedin"].map((icon) => (
                <a
                  key={icon}
                  className="inline-flex p-2 border-2 border-[#7f8c8d] rounded-lg text-2xl mx-2"
                >
                  <i className={`bx bxl-${icon}`}></i>
                </a>
              ))} */}
              <a className="inline-flex p-2 border-2 border-[#7f8c8d] rounded-lg text-2xl mx-2"><i className="bx bxl-google" onClick={handleGoogleLogin}></i></a>
            </div>
          </form>

        </div>

        {/* REGISTER FORM */}
        <div className={`absolute right-0 w-1/2 h-full bg-black flex items-center text-center p-10 z-[1] transition-all duration-600 ease-in-out ${loginMode ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"}`}>

          <form className="w-full" onSubmit={handleSignUp}>
            <h1 className="text-4xl text-white font-bold -mt-2 mb-2">Sign Up</h1>

            <div className="relative my-7">
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                className="w-full py-[13px] pr-[50px] pl-5 bg-[#3a3a3a] rounded-lg text-lg text-white placeholder-[#7f8c8d] outline-none"
              />
              <i className="bx bxs-user absolute right-5 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
            </div>

            <div className="relative my-7">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                className="w-full py-[13px] pr-[50px] pl-5 bg-[#3a3a3a] rounded-lg text-lg text-white placeholder-[#7f8c8d] outline-none"
              />
              <i className="bx bxs-envelope absolute right-5 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
            </div>

            <div className="relative my-7">
              <input
                type="password"
                name="password"
                placeholder="Create Password"
                required
                className="w-full py-[13px] pr-[50px] pl-5 bg-[#3a3a3a] rounded-lg text-lg text-white placeholder-[#7f8c8d] outline-none"
              />
              <i className="bx bxs-lock-alt absolute right-5 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
            </div>

            <button className="w-full h-12 bg-blue-500 rounded-lg shadow-md text-white font-semibold text-lg">Sign Up</button>

            <p className="text-[#bdc3c7] mt-4">or sign up with</p>

            <div className="flex justify-center mt-2 text-white">
              {["google", "facebook", "github", "linkedin-square"].map((icon) => (
                <a
                  key={icon}
                  className="inline-flex p-2 border-2 border-[#7f8c8d] rounded-lg text-2xl mx-2"
                >
                  <i className={`bx bxl-${icon}`}></i>
                </a>
              ))}
            </div>

          </form>

        </div>

        {/* TOGGLE BOX */}
        <div className="absolute w-full h-full overflow-hidden">

          {/* BLUE SLIDING BACKGROUND */}
          <div className={`absolute w-[300%] h-full bg-[#3B82F6] rounded-[150px] z-2 transition-all duration-1000 ease-in-out ${loginMode ? "left-[50%] " : "left-[-250%]"}`}></div>

          {/* LEFT PANEL */}
          <div
            className={`absolute flex flex-col justify-center items-center w-1/2 h-full text-white z-3 transition-all duration-800 ease-in-out ${loginMode ? "left-[-50%] " : "left-0"}`}>
            <h1 className="text-4xl font-bold">Good to See You !</h1>
            <p className="mb-5">Already have an account? LogIn</p>
            <button
              className="w-40 h-12 bg-transparent border-2 border-white text-white font-semibold rounded-lg"
              onClick={() => setLoginMode(true)}
            >
              Sign In
            </button>
          </div>

          {/* RIGHT PANEL */}
          <div
            className={`absolute flex flex-col justify-center items-center w-1/2 h-full text-white z-[3] transition-all duration-800 ease-in-out ${loginMode ? "right-0" : "right-[-50%]"}`}>
            <h1 className="text-4xl font-bold">Welcome !</h1>
            <p className="mb-5">Don't have an account? Create New</p>
            <button
              className="w-40 h-12 bg-transparent border-2 border-white text-white font-semibold rounded-lg"
              onClick={() => setLoginMode(false)}
            >
              Sign Up
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
