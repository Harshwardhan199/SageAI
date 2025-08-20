const User = require("../models/User");

exports.getCurrentUser = async (req, res) => {
  try {
    console.log(`Getting User`);
    const user = await User.findById(req.user.userId).select("username email");

    console.log(`UserID : ${req.user.userId}`);

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ username: user.username, email: user.email });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
