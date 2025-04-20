// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const ALERT_EMAIL = process.env.ALERT_EMAIL;
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store recent sound data
let soundData = [];

if (!BREVO_API_KEY || !ALERT_EMAIL) {
  console.error("❌ Missing BREVO_API_KEY or ALERT_EMAIL in .env file!");
  process.exit(1);
}

// Send email using Brevo API
const sendEmailAlert = async (level) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Sound Detector", email: "sounddetector7@8961821.brevosend.com" },
        to: [{ email: ALERT_EMAIL }],
        subject: "🚨 Sound Level Alert",
        htmlContent: `<p>⚠️ Detected sound level: <strong>${level} dB</strong></p>`
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("✅ Email sent:", response.data);
  } catch (error) {
    console.error("❌ Email error:", error.response?.data || error.message);
  }
};

// API endpoint to receive data
app.post("/api/sound-data", async (req, res) => {
  const { level, deviceId } = req.body;
  if (typeof level !== "number") {
    return res.status(400).json({ error: "Invalid sound level" });
  }

  const data = {
    id: Date.now().toString(),
    level,
    deviceId: deviceId || "unknown",
    timestamp: Date.now()
  };

  soundData.push(data);
  if (soundData.length > 1000) soundData = soundData.slice(-1000);

  if (level > 0) {
    console.log(`📢 Sound detected: ${level} dB - Sending email...`);
    await sendEmailAlert(level);
  } else {
    console.log("🔇 Level is 0 dB – skipping email.");
  }

  res.status(200).json({ success: true, id: data.id });
});

// API to fetch recent data
app.get("/api/sound-data", (req, res) => {
  res.status(200).json(soundData.slice(-50));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
