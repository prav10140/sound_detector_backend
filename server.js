const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const ALERT_EMAIL = process.env.ALERT_EMAIL;
const BREVO_API_KEY = process.env.BREVO_API_KEY;  // Store your API key in .env

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store sound data
let soundData = [];

// Ensure Brevo API Key exists
if (!BREVO_API_KEY || !ALERT_EMAIL) {
  console.error("❌ Missing BREVO_API_KEY or ALERT_EMAIL in .env file!");
  process.exit(1);
}

// Function to send email alerts using Brevo API
const sendEmailAlert = async (level) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Sound Detector", email: "sounddetector7@gmail.com" }, // Update sender email
        to: [{ email: ALERT_EMAIL }],
        subject: "🚨 High Sound Level Alert!",
        htmlContent: `<p><strong>Warning!</strong> A high sound level of <b>${level} dB</b> was detected.</p>`
      },
      {
        headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" }
      }
    );

    console.log("✅ Email alert sent successfully:", response.data);
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

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
