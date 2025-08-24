const User = require("../models/User");

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("username email");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ username: user.username, email: user.email });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getUserFolders = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    
    res.json({ folderList: folderList });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {getCurrentUser, getUserFolders}; 