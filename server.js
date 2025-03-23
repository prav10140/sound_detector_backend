const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios"); // For making API requests to Resend
require("dotenv").config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;
const RESEND_API_KEY = process.env.RESEND_API_KEY; // Get API key from environment variables
const ALERT_EMAIL = process.env.ALERT_EMAIL; // Alert recipient email

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store sound data in memory (in a real app, use a database)
let soundData = [];

// Function to send email alerts
const sendEmailAlert = async (level) => {
  try {
    await axios.post(
      "https://api.resend.com/emails",
      {
        from: "alerts@yourdomain.com", // Replace with a verified sender domain from Resend
        to: ALERT_EMAIL,
        subject: "🚨 High Sound Level Alert!",
        text: `Warning! A high sound level of ${level} dB was detected.`
      },
      {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` }
      }
    );
    console.log("Email alert sent successfully.");
  } catch (error) {
    console.error("Error sending email:", error.response?.data || error.message);
  }
};

// API endpoint to receive sound data from ESP32
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

  // Add to data store
  soundData.push(newData);

  // Keep only the last 1000 readings
  if (soundData.length > 1000) {
    soundData = soundData.slice(-1000);
  }

  // Send email alert if sound level exceeds 85 dB
  if (level > 85) {
    console.log(`ALERT: High sound level detected: ${level} dB`);
    await sendEmailAlert(level);
  }

  res.status(200).json({ success: true, id: newData.id });
});

// API endpoint to get sound data
app.get("/api/sound-data", (req, res) => {
  // Return the most recent data (last 50 readings)
  const recentData = soundData.slice(-50);
  res.status(200).json(recentData);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
