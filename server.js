// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const twilio = require("twilio");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const RECEIVER_WHATSAPP_NUMBER = process.env.RECEIVER_WHATSAPP_NUMBER;

// Twilio client
const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store sound data
let soundData = [];

// Function to send WhatsApp alert
const sendWhatsAppAlert = async (level) => {
  try {
    const message = await client.messages.create({
      body: `🚨 High Sound Level Detected: ${level} dB`,
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${RECEIVER_WHATSAPP_NUMBER}`
    });

    console.log("✅ WhatsApp alert sent successfully:", message.sid);
  } catch (error) {
    console.error("❌ Error sending WhatsApp message:", error);
  }
};

// API endpoint to receive sound data
app.post("/api/sound-data", async (req, res) => {
  const { level, deviceId } = req.body;

  if (typeof level !== "number") {
    return res.status(400).json({ error: "Invalid sound level data" });
  }

  const newData = {
    id: Date.now().toString(),
    level,
    deviceId: deviceId || "unknown",
    timestamp: Date.now()
  };

  soundData.push(newData);
  if (soundData.length > 1000) {
    soundData = soundData.slice(-1000);
  }

  if (level > 50) {
  console.log(`📩 Sending WhatsApp alert for sound level: ${level} dB`);
  await sendWhatsAppAlert(level);
} else {
  console.log(`🔈 Sound level ${level} dB – below threshold, not sending WhatsApp alert.`);
}


  res.status(200).json({ success: true, id: newData.id });
});

// API endpoint to get sound data
app.get("/api/sound-data", (req, res) => {
  res.status(200).json(soundData.slice(-50));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
