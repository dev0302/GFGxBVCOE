const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/format-event", async (req, res) => {
  try {
    const { rawData } = req.body;

    if (!rawData) {
      return res.status(400).json({
        success: false,
        message: "No data provided",
      });
    }

    const prompt = `
You are a strict JSON generator.

Convert the given event data into a COMPLETE JSON object with the following fields.

RULES:
- You MUST include ALL fields listed below.
- If any field is missing or unclear, GENERATE a reasonable value.
- DO NOT leave any field undefined or null.
- DO NOT omit any field.
- ALWAYS return valid JSON only.
- NO explanations, NO markdown.

REQUIRED JSON FORMAT:

{
  "title": string,
  "date": string (YYYY-MM-DD),
  "time": string,
  "location": string,
  "category": string,
  "description": string,
  "modalDescription": string,
  "targetAudience": string,
  "agenda": [string],
  "prerequisites": [string]
}

EXTRA RULES:
- If speakers are not present, create at least 1 dummy speaker.
- If agenda is missing, create 3–5 logical agenda points.
- If prerequisites are missing, create 2–3 reasonable items.
- Keep descriptions meaningful and clean.

DATA:
${JSON.stringify(rawData)}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    let text = completion.choices[0]?.message?.content || "";

    // clean markdown
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    // console.log("FULL RESPONSE:", completion);
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("AI JSON parse failed:", text);
      return res.status(500).json({
        success: false,
        message: "Invalid AI response",
      });
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({
      success: false,
      message: "AI processing failed",
    });
  }
});

module.exports = router;