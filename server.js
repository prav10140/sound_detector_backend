const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const twilio = require("twilio");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Twilio client setup
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
const TO   = `whatsapp:${process.env.RECEIVER_WHATSAPP_NUMBER}`;

// In-memory data store
let soundData = [];

// POST /api/sound-data
app.post("/api/sound-data", async (req, res) => {
  const { level, deviceId } = req.body;
  if (typeof level !== 'number') {
    return res.status(400).json({ error: 'Invalid sound level data' });
  }

  const newData = {
    id: Date.now().toString(),
    level,
    deviceId: deviceId || 'unknown',
    timestamp: Date.now(),
  };
  soundData.push(newData);
  if (soundData.length > 1000) soundData = soundData.slice(-1000);

  if (level > 50) {
    try {
      await client.messages.create({
        from: FROM,
        to: TO,
        body: `🚨 High Sound Level Detected: ${level} dB`,
      });
      console.log('✅ WhatsApp alert sent for level', level);
    } catch (err) {
      console.error('❌ Twilio error:', err.message);
    }
  } else {
    console.log('🔈 Level is below threshold:', level);
  }

  return res.status(200).json({ success: true, id: newData.id });
});

// GET /api/sound-data
app.get("/api/sound-data", (req, res) => {
  return res.status(200).json(soundData.slice(-50));
});

module.exports = app;
