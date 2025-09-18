const express = require("express");
const router = express.Router();

const { tempChat } = require("../controllers/freeController");

router.post("/chat", tempChat); 

module.exports = router;