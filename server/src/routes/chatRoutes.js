// routes/chatRoutes.js
const express = require("express");
const router  = express.Router();
const axios   = require("axios");

router.post("/", async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: "GROQ_API_KEY not set in server .env file" });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "messages array required" });
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",   // current active Groq model
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: `You are Eve, a helpful AI assistant for Intelearn — a coding education platform.
Help students with coding problems, contest strategy, learning paths, and platform features like Practice, Contests, Compiler, and Courses.
Be concise, friendly, and encouraging. Use emojis occasionally. Keep responses under 3 paragraphs unless code is needed.`
          },
          ...messages
        ]
      },
      {
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        timeout: 30000
      }
    );

    const text = response.data.choices?.[0]?.message?.content || "Sorry, no response.";
    res.json({ reply: text });

  } catch (err) {
    const errData = err.response?.data;
    const status  = err.response?.status;
    console.error("❌ Chat error:", status, JSON.stringify(errData || err.message));
    res.status(500).json({ message: errData?.error?.message || err.message || "Chat failed" });
  }
});

module.exports = router;