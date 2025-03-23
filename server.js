const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_EMAIL = process.env.ALERT_EMAIL;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store sound data
let soundData = [];

// Function to send email alerts
const sendEmailAlert = async (level) => {
  try {
    await axios.post(
      "https://api.resend.com/emails",
      {
        from: "sounddetector7@gmail.com", // Verified sender email
        to: ALERT_EMAIL, // 🔹 Ensure this is set in your .env file
        subject: "🚨 High Sound Level Alert!",
        text: `Warning! A high sound level of ${level} dB was detected.`
      },
      {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` }
      }
    );
    console.log("✅ Email alert sent successfully.");
  } catch (error) {
    console.error("❌ Error sending email:", error.response?.data || error.message);
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

  // Send email if sound level is high
  if (level > 85) {
    console.log(`⚠️ ALERT: High sound level detected: ${level} dB`);
    await sendEmailAlert(level);
  }

  res.status(200).json({ success: true, id: newData.id });
});

// API endpoint to get sound data
app.get("/api/sound-data", (req, res) => {
  res.status(200).json(soundData.slice(-50));
});

// 🔹 Simulate random sound data every 5 seconds (For Testing)
setInterval(async () => {
  const randomLevel = Math.floor(Math.random() * 60) + 40; // Random level between 40-100 dB
  console.log(`🔊 Generated sound level: ${randomLevel} dB`);

  await axios.post("http://localhost:5000/api/sound-data", { level: randomLevel, deviceId: "test-device" })
    .catch(err => console.error("Error sending test data:", err.message));
}, 5000);

// Export the app for Vercel
module.exports = app;
