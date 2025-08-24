const express = require("express");
const router = express.Router();
const { signup, login, googleSignIn, currentUser, refresh, logout } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);

router.post("/google", googleSignIn);

router.post("/logout", logout);

router.post("/currentUser", currentUser);
router.post("/refresh", refresh);

module.exports = router;
