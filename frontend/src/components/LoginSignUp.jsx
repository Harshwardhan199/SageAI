import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { config } from "../config";

export default function LoginSignup() {
  const navigate = useNavigate();

  const { updateAccessToken, setUser } = useAuth();

  const [loginMode, setLoginMode] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const username = data.username;
      const email = data.email;
      const password = data.password;

      const res = await axios.post(`${config.BACKEND_URL}/api/auth/signup`, {
        username,
        email,
        password,
      });

      updateAccessToken(res.data.accessToken);
      setUser(res.data.user);

      navigate("/");
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const email = data.email;
      const password = data.password;

      const res = await axios.post(
        `${config.BACKEND_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true },
      );

      updateAccessToken(res.data.accessToken);
      setUser(res.data.user);

      navigate("/");
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  const handleGoogleLogin = async (e) => {
    e.preventDefault();

    if (!window.google) {
      console.error("Google Identity Services SDK not loaded");
      return;
    }

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: config.GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: async (response) => {
        try {
          const { code } = response;

          const res = await axios.post(
            `${config.BACKEND_URL}/api/auth/google`,
            { code },
            { withCredentials: true },
          );

          updateAccessToken(res.data.accessToken);

          setUser(res.data.data);

          navigate("/");
        } catch (err) {
          console.error("Google login error:", err);
        }
      },
    });

    client.requestCode();
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#141414] p-4 text-white">
      {/* {Main Container} */}
      <div
        className={`relative w-full max-w-md md:max-w-[850px] h-[550px] bg-black rounded-3xl md:rounded-4xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-600 ease-in-out`}
      >
        {/* LOGIN FORM */}
        <div
          className={`absolute w-full md:w-1/2 h-full bg-black flex items-center text-center p-6 sm:p-10 z-[1] transition-all duration-600 ease-in-out ${
            loginMode
              ? "left-0 opacity-100 pointer-events-auto"
              : "left-full md:left-0 opacity-0 pointer-events-none"
          }`}
        >
          <form className="w-full" onSubmit={handleLogin}>
            <h1 className="text-3xl sm:text-4xl text-white font-bold -mt-2 mb-2">
              Sign In
            </h1>

            <div className="relative my-6 sm:my-7">
              <input
                type="text"
                name="email"
                placeholder="Email"
                autoComplete="off"
                required
                className="w-full py-[11px] sm:py-[13px] pr-[50px] pl-5 bg-[#3a3a3a] rounded-lg text-base sm:text-lg text-white font-medium placeholder-[#7f8c8d] outline-none"
              />
              <i className="bx bxs-user absolute right-5 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
            </div>

            <div className="relative my-6 sm:my-7">
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                className="w-full py-[11px] sm:py-[13px] pr-[50px] pl-5 bg-[#3a3a3a] rounded-lg text-base sm:text-lg text-white placeholder-[#7f8c8d] outline-none"
              />
              <i className="bx bxs-lock-alt absolute right-5 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
            </div>

            <div className="-mt-4 mb-4">
              <a href="#" className="text-xs sm:text-sm text-white">
                Reset Password ?
              </a>
            </div>

            <button className="w-full h-11 sm:h-12 bg-blue-500 rounded-lg shadow-md text-white font-semibold text-base sm:text-lg cursor-pointer hover:bg-blue-600 transition-colors">
              Sign In
            </button>

            <p className="text-[#bdc3c7] mt-4 text-xs sm:text-sm">or sign in with</p>

            <div className="flex justify-center mt-2 text-white">
              <div
                className="inline-flex items-center justify-center gap-2 w-full p-2 border-2 border-[#7f8c8d] rounded-lg text-xl sm:text-2xl mx-2 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={handleGoogleLogin}
              >
                <div className="bx bxl-google"></div>
                <div className="text-sm sm:text-xl overflow-hidden whitespace-nowrap font-medium">
                  SignIn with Google
                </div>
              </div>
            </div>

            {/* Mobile View Toggle Link */}
            <div className="mt-6 text-xs sm:text-sm text-[#bdc3c7] md:hidden">
              Don't have an account?{" "}
              <button
                type="button"
                className="text-blue-400 font-bold underline cursor-pointer"
                onClick={() => setLoginMode(false)}
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>

        {/* REGISTER FORM */}
        <div
          className={`absolute w-full md:w-1/2 h-full bg-black flex items-center text-center p-6 sm:p-10 z-[1] transition-all duration-600 ease-in-out ${
            !loginMode
              ? "right-0 opacity-100 pointer-events-auto"
              : "right-full md:right-0 opacity-0 pointer-events-none"
          }`}
        >
          <form className="w-full" onSubmit={handleSignUp}>
            <h1 className="text-3xl sm:text-4xl text-white font-bold -mt-2 mb-2">
              Sign Up
            </h1>

            <div className="relative my-5 sm:my-6">
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                className="w-full py-[11px] sm:py-[13px] pr-[50px] pl-5 bg-[#3a3a3a] rounded-lg text-base sm:text-lg text-white placeholder-[#7f8c8d] outline-none"
              />
              <i className="bx bxs-user absolute right-5 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
            </div>

            <div className="relative my-5 sm:my-6">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                className="w-full py-[11px] sm:py-[13px] pr-[50px] pl-5 bg-[#3a3a3a] rounded-lg text-base sm:text-lg text-white placeholder-[#7f8c8d] outline-none"
              />
              <i className="bx bxs-envelope absolute right-5 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
            </div>

            <div className="relative my-5 sm:my-6">
              <input
                type="password"
                name="password"
                placeholder="Create Password"
                required
                className="w-full py-[11px] sm:py-[13px] pr-[50px] pl-5 bg-[#3a3a3a] rounded-lg text-base sm:text-lg text-white placeholder-[#7f8c8d] outline-none"
              />
              <i className="bx bxs-lock-alt absolute right-5 top-1/2 -translate-y-1/2 text-xl text-gray-500"></i>
            </div>

            <button className="w-full h-11 sm:h-12 bg-blue-500 rounded-lg shadow-md text-white font-semibold text-base sm:text-lg cursor-pointer hover:bg-blue-600 transition-colors">
              Sign Up
            </button>

            <p className="text-[#bdc3c7] mt-3 text-xs sm:text-sm">or sign up with</p>

            <div className="flex justify-center mt-2 text-white">
              <div
                className="inline-flex items-center justify-center gap-2 w-full p-2 border-2 border-[#7f8c8d] rounded-lg text-xl sm:text-2xl mx-2 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={handleGoogleLogin}
              >
                <div className="bx bxl-google"></div>
                <div className="text-sm sm:text-xl overflow-hidden whitespace-nowrap font-medium">
                  SignIn with Google
                </div>
              </div>
            </div>

            {/* Mobile View Toggle Link */}
            <div className="mt-5 text-xs sm:text-sm text-[#bdc3c7] md:hidden">
              Already have an account?{" "}
              <button
                type="button"
                className="text-blue-400 font-bold underline cursor-pointer"
                onClick={() => setLoginMode(true)}
              >
                Sign In
              </button>
            </div>
          </form>
        </div>

        {/* TOGGLE BOX */}
        <div className="absolute w-full h-full overflow-hidden hidden md:block">
          {/* BLUE SLIDING BACKGROUND */}
          <div
            className={`absolute w-[300%] h-full bg-[#3B82F6] rounded-[150px] z-2 transition-all duration-1000 ease-in-out ${loginMode ? "left-[50%] " : "left-[-250%]"}`}
          ></div>

          {/* LEFT PANEL */}
          <div
            className={`absolute flex flex-col justify-center items-center w-1/2 h-full text-white z-3 transition-all duration-800 ease-in-out ${loginMode ? "left-[-50%] " : "left-0"}`}
          >
            <h1 className="text-4xl font-bold">Good to See You !</h1>
            <p className="mb-5">Already have an account? LogIn</p>
            <button
              className="w-40 h-12 bg-transparent border-2 border-white text-white font-semibold rounded-lg cursor-pointer hover:bg-white hover:text-blue-500 transition-all"
              onClick={() => setLoginMode(true)}
            >
              Sign In
            </button>
          </div>

          {/* RIGHT PANEL */}
          <div
            className={`absolute flex flex-col justify-center items-center w-1/2 h-full text-white z-[3] transition-all duration-800 ease-in-out ${loginMode ? "right-0" : "right-[-50%]"}`}
          >
            <h1 className="text-4xl font-bold">Welcome !</h1>
            <p className="mb-5">Don't have an account? Create New</p>
            <button
              className="w-40 h-12 bg-transparent border-2 border-white text-white font-semibold rounded-lg cursor-pointer hover:bg-white hover:text-blue-500 transition-all"
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
