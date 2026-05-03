const { sendWhatsAppMessage } = require("../services/whatsapp.service");

const sendWhatsApp = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const result = await sendWhatsAppMessage(name, phone);

    res.json({
      success: true,
      message: "WhatsApp sent",
      code: result.code,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { sendWhatsApp };