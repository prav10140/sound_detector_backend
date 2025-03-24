const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const ALERT_EMAIL = process.env.ALERT_EMAIL;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store sound data
let soundData = [];

// Configure Nodemailer with Brevo SMTP
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Function to send email alerts
const sendEmailAlert = async (level) => {
  try {
    const mailOptions = {
      from: SMTP_USER,
      to: ALERT_EMAIL,
      subject: "🚨 High Sound Level Alert!",
      text: `Warning! A high sound level of ${level} dB was detected.`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email alert sent successfully.");
  } catch (error) {
    console.error("❌ Error sending email:", error);
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
    timestamp: Date.now(),
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

// Export the app for Vercel
module.exports = app;
