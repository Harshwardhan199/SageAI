const jwt = require("jsonwebtoken");
const axios = require("axios");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const User = require("../models/User");
const SessionStore = require("../services/redis/sessionStore");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    const sessionId = uuidv4();

    const accessToken = jwt.sign(
      { userId: newUser._id, username: newUser.username, email: newUser.email, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: newUser._id, sessionId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
    );

    const session = await SessionStore.createSession(sessionId, newUser._id.toString(), {
      userAgent: req.headers["user-agent"] || "unknown",
      ip: req.ip
    });
    if (!session) {
      return res.status(503).json({ error: "Authentication session service is unavailable" });
    }

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return res.status(201).json({
      message: "Signup successful",
      user: { username: newUser.username, email: newUser.email },
      data: { username: newUser.username, email: newUser.email },
      accessToken
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ error: "User not found" });
    }

    const isBcryptHash = typeof existingUser.password === "string" && /^\$2[aby]\$/.test(existingUser.password);
    let isMatch = false;

    if (isBcryptHash) {
      isMatch = await bcrypt.compare(password, existingUser.password);
    } else {
      // Legacy plaintext password check
      if (password === existingUser.password) {
        isMatch = true;
        // Transparent in-place migration to bcrypt
        try {
          existingUser.password = await bcrypt.hash(password, 10);
          await existingUser.save();
          console.log(`[Auth] Transparently upgraded legacy password for user: ${existingUser._id}`);
        } catch (upgradeErr) {
          console.error("[Auth] Failed to upgrade legacy password:", upgradeErr.message);
        }
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const sessionId = uuidv4();

    const accessToken = jwt.sign(
      { userId: existingUser._id, username: existingUser.username, email: existingUser.email, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: existingUser._id, sessionId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
    );

    const session = await SessionStore.createSession(sessionId, existingUser._id.toString(), {
      userAgent: req.headers["user-agent"] || "unknown",
      ip: req.ip
    });
    if (!session) {
      return res.status(503).json({ error: "Authentication session service is unavailable" });
    }

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      message: "Login successful",
      user: { username: existingUser.username, email: existingUser.email },
      data: { username: existingUser.username, email: existingUser.email },
      accessToken
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const googleSignIn = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) return res.status(400).json({ message: "Authorization code required" });

    let data;
    try {
      const response = await axios.post(
        "https://oauth2.googleapis.com/token",
        new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: "postmessage",
          grant_type: "authorization_code",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      data = response.data;
    } catch (err) {
      console.error("Google token exchange error:", err.response?.data || err.message);
      return res.status(400).json({ message: "Google authentication failed" });
    }

    const { access_token } = data;
    const userInfo = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { sub: googleId, email, name } = userInfo.data;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username: name,
        email,
        authProvider: "google",
        googleId
      });
    }

    const sessionId = uuidv4();

    const accessToken = jwt.sign(
      { userId: user._id, username: user.username, email: user.email, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, sessionId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
    );

    const session = await SessionStore.createSession(sessionId, user._id.toString(), {
      userAgent: req.headers["user-agent"] || "unknown",
      ip: req.ip
    });
    if (!session) {
      return res.status(503).json({ error: "Authentication session service is unavailable" });
    }

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      message: "Google login successful",
      user: { username: user.username, email: user.email },
      data: { username: user.username, email: user.email },
      accessToken
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ message: "Google login failed" });
  }
};

const currentUser = async (req, res) => {
  const refToken = req.cookies.refreshToken;

  if (!refToken) {
    return res.status(204).send();
  }

  return res.status(200).send();
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(200).json({ authenticated: false });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(200).json({ authenticated: false });
    }

    const { userId, sessionId } = decoded;

    if (!sessionId || !userId) {
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(200).json({ authenticated: false });
    }

    const session = await SessionStore.getSession(sessionId);
    if (!session) {
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(200).json({ authenticated: false });
    }

    const userFromDB = await User.findById(userId).select("username email");
    if (!userFromDB) {
      await SessionStore.deleteSession(sessionId, userId);
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(200).json({ authenticated: false });
    }

    await SessionStore.touchSession(sessionId);

    const accessToken = jwt.sign(
      { userId: userFromDB._id, username: userFromDB.username, email: userFromDB.email, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );

    const newRefreshToken = jwt.sign(
      { userId: userFromDB._id, sessionId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
    );

    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      authenticated: true,
      user: { username: userFromDB.username, email: userFromDB.email },
      accessToken
    });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(200).json({ message: "No active session" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(200).json({ message: "Logged out" });
    }

    if (decoded && decoded.sessionId) {
      await SessionStore.deleteSession(decoded.sessionId, decoded.userId);
    }

    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    return res.status(200).json({ message: "Logged out" });
  }
};

module.exports = { signup, login, googleSignIn, currentUser, refresh, logout };
