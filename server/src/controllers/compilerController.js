const axios = require("axios");

exports.runCode = async (req, res) => {
  try {
    const { language, code, input } = req.body;

    if (!language || !code) {
      return res.status(400).json({ message: "language and code are required" });
    }

    const response = await axios.post(
      `${process.env.JUDGE0_URL}/submissions`,
      {
        language_id: parseInt(language),
        source_code: code,        // plain text — consistent with submit
        stdin:       input || ""  // plain text
      },
      {
        params: { wait: "true", base64_encoded: "false" },
        headers: {
          "Content-Type":    "application/json",
          "X-RapidAPI-Key":  process.env.JUDGE0_KEY,
          "X-RapidAPI-Host": process.env.JUDGE0_HOST || "judge0-ce.p.rapidapi.com"
        },
        timeout: 20000
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Judge0 Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Code execution failed", error: error.response?.data });
  }
};