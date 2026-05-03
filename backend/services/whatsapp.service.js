const axios = require("axios");

const ACCESS_TOKEN = "EAAWoaPYP6bMBRapHbUWWL7zhLe7JZBNbLz5L0yWtaT6Oqq1GZChJRtxo30cREXgJNKfSOjZA97UCgRkHXEFiFkr5Dn1XhsRUdWQxDTrRnVXiSxDc45MHbaqAYXvM5mMZB3ByG0JGabEP2iT7kaNrmgEbhnwIcMIiAiVPPJkVd7rcGbv35vJAf3t3sMZBoob44uqZBEaRp483VTIipSe3lQYfRfIrSPBp2rOuZBHOoTePngbgnlAM0OS3HZAb5YSkGnv6p02cLj2sImatKkIASH8nDQZDZD"; // ❗ no space
const PHONE_NUMBER_ID = "1048540535015313";

const sendWhatsAppMessage = async (name, phone) => {
  try {
    const code = Math.floor(1000 + Math.random() * 9000);

    // 📱 Clean phone number
    const cleanPhone = phone.replace(/\D/g, "");

    // 🔥 TEMPLATE SWITCH (smart logic)
    const TEMPLATE_NAME = "hello_world"; 
    // 👉 baad me change: "invite_user"

    const TEMPLATE_PAYLOAD =
      TEMPLATE_NAME === "invite_user"
        ? {
            name: "invite_user",
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: name }
                ]
              }
            ]
          }
        : {
            name: "hello_world",
            language: { code: "en_US" }
          };

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: `91${cleanPhone}`,
        type: "template",
        template: TEMPLATE_PAYLOAD
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN.trim()}`, // 🔥 safe
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ WhatsApp sent:", response.data);

    return { success: true, code };

  } catch (error) {
  console.log("❌ FULL ERROR:", JSON.stringify(error.response?.data, null, 2));
  throw new Error("WhatsApp send failed");
}

};

module.exports = { sendWhatsAppMessage };