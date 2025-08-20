const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  console.log("Checking authenticity of user using accessToken");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 

    console.log("Decoded ->", JSON.stringify(decoded, null, 2));
  
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.invalidAccessTokens.includes(token)){
      return res.status(403).json({ error: "Expired token" });
    }
    console.log("Middleware passed");

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
