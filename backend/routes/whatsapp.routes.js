const express = require("express");
const router = express.Router();

const { sendWhatsApp } = require("../controllers/whatsapp.controller");

router.post("/send", sendWhatsApp);

module.exports = router;