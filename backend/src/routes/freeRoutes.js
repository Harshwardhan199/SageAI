const express = require("express");
const router = express.Router();

const { tempChat, tempFeedback} = require("../controllers/freeController");

router.post("/chat", tempChat); 
router.post("/feedback", tempFeedback); 

module.exports = router;