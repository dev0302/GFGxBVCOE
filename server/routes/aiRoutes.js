const express = require("express");
const Groq = require("groq-sdk");
const { auth, requireRegisteredUser } = require("../middlewares/AuthZ");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function repairJsonStringNewlines(text) {
  let inString = false;
  let escaped = false;
  let result = "";

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString && char === "\n") {
      result += "\\n";
      continue;
    }

    if (inString && char === "\r") {
      result += "\\r";
      continue;
    }

    if (inString && char === "\t") {
      result += "\\t";
      continue;
    }

    result += char;
  }

  return result;
}

function parseGroqJson(text) {
  const cleaned = String(text || "").replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Groq often returns multiline strings with literal newlines — repair and retry.
    try {
      return JSON.parse(repairJsonStringNewlines(cleaned));
    } catch (repairError) {
      const titleMatch = cleaned.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const subjectMatch = cleaned.match(/"subject"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const descriptionMatch = cleaned.match(/"description"\s*:\s*"([\s\S]*?)"\s*\}?$/);

      if (titleMatch && subjectMatch && descriptionMatch) {
        const unescape = (value) =>
          value
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t")
            .replace(/\\"/g, '"');

        return {
          title: unescape(titleMatch[1]),
          subject: unescape(subjectMatch[1]),
          description: unescape(descriptionMatch[1]),
        };
      }

      throw repairError;
    }
  }
}

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
      model: "openai/gpt-oss-20b",
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

router.post("/generate-email", auth, requireRegisteredUser, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "AI service is not configured",
      });
    }

    const systemPrompt = `You are an expert email copywriter for GFG BVCOE, a college GeeksforGeeks student chapter.
Given a raw prompt describing what the email should communicate, generate professional announcement email content.

RULES:
- Return ONLY valid JSON, no markdown, no explanations.
- title: headline shown inside the email body (max 120 characters).
- subject: inbox subject line (max 160 characters).
- description: full email body in plain text. Use \\n for line breaks inside the JSON string (do not use literal line breaks inside JSON values).
- Tone: clear, friendly, professional, suitable for students and society leadership.
- Do not invent specific dates, times, or links unless mentioned in the prompt.

REQUIRED JSON FORMAT:
{
  "title": string,
  "subject": string,
  "description": string
}`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate email content for this prompt:\n\n${String(prompt).trim()}`,
        },
      ],
      temperature: 0.7,
    });

    let parsed;
    try {
      parsed = parseGroqJson(completion.choices[0]?.message?.content || "");
    } catch (e) {
      console.error("Email AI JSON parse failed:", completion.choices[0]?.message?.content || "");
      return res.status(500).json({
        success: false,
        message: "Invalid AI response",
      });
    }

    const title = String(parsed.title || "").trim().slice(0, 120);
    const subject = String(parsed.subject || "").trim().slice(0, 160);
    const description = String(parsed.description || "").trim().slice(0, 5000);

    if (!title || !subject || !description) {
      return res.status(500).json({
        success: false,
        message: "AI response was incomplete",
      });
    }

    res.json({
      success: true,
      data: { title, subject, description },
    });
  } catch (err) {
    console.error("Email AI error:", err);
    res.status(500).json({
      success: false,
      message: "AI processing failed",
    });
  }
});

module.exports = router;