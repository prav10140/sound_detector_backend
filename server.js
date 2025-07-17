const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const twilio = require("twilio");
require("dotenv").config();

const app = express();

// ─── CORS SETUP ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: "https://safe-ride-mu.vercel.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.options("/api/sound-data", (req, res) => {
  res.sendStatus(204);
});

// ─── BODY PARSER ───────────────────────────────────────────────────────────────
app.use(bodyParser.json());

// ─── TWILIO SETUP ─────────────────────────────────────────────────────────────
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
const TO   = `whatsapp:${process.env.RECEIVER_WHATSAPP_NUMBER}`;

// ─── IN‑MEMORY DATA STORE ─────────────────────────────────────────────────────
let soundData = [];

// ─── POST /api/sound-data ─────────────────────────────────────────────────────
app.post("/api/sound-data", async (req, res) => {
  const { level, deviceId } = req.body;

  if (typeof level !== "string") {
    return res.status(400).json({ error: "Invalid sound level data" });
  }

  const newData = {
    id: Date.now().toString(),
    level,
    deviceId: deviceId || "unknown",
    timestamp: Date.now(),
  };

  soundData.push(newData);
  if (soundData.length > 1000) soundData = soundData.slice(-1000);

  const levelMap = {
    SOS: "SOS ALERT ! Warning",
    Accident: "Acident ALERT ! Warning",
    Safe: "Now I am Safe",
  };

  const alertText = levelMap[level] || `Unknown Level: ${level}`;
  const alertMsg = `🚨 Alert from Helmet (${deviceId}): ${alertText}`;

  try {
    await client.messages.create({
      from: FROM,
      to: TO,
      body: alertMsg,
    });
    console.log("✅ WhatsApp alert sent:", alertMsg);
  } catch (err) {
    console.error("❌ Twilio error:", err.message);
  }

  return res.status(200).json({ success: true, id: newData.id });
});


// ─── GET /api/sound-data ──────────────────────────────────────────────────────
app.get("/api/sound-data", (req, res) => {
  return res.status(200).json(soundData.slice(-50));
});

// ─── EXPORT FOR VERCEL ────────────────────────────────────────────────────────
module.exports = app;

