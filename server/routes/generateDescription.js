require("dotenv").config();
const express = require("express");
const { chromium } = require("playwright");
const Groq = require("groq-sdk");

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Clean text helper
 */
function cleanText(text = "") {
  return text
    .replace(/\s+/g, " ")
    .replace(/[^\x00-\x7F]/g, "")
    .trim();
}

/**
 * Scrape page (JS supported)
 */
async function scrapePage(url) {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    // 🚀 block heavy stuff (faster)
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (["image", "stylesheet", "font"].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      const getText = (selector, limit = 10) =>
        Array.from(document.querySelectorAll(selector))
          .map((el) => el.innerText)
          .filter(Boolean)
          .slice(0, limit);

      return {
        title: document.title,
        headings: getText("h1, h2, h3", 10),
        paragraphs: getText("p", 15),
      };
    });

    return {
      title: cleanText(data.title),
      headings: data.headings.map(cleanText),
      paragraphs: data.paragraphs.map(cleanText),
    };
  } catch (err) {
    console.error("Scraping error:", err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

/**
 * MAIN ROUTE
 */
router.post("/generate-content", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // 🔥 1. Scrape
    const scraped = await scrapePage(url);

    if (
      !scraped.title &&
      scraped.headings.length === 0 &&
      scraped.paragraphs.length === 0
    ) {
      return res.status(400).json({
        error: "Could not extract meaningful content",
      });
    }

    // 🔥 2. Build context
    const context = `
Title: ${scraped.title}

Headings: ${scraped.headings.join(", ")}

Content: ${scraped.paragraphs.join(" ").slice(0, 1200)}
`;

    // 🔥 3. Generate BOTH title + description
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You generate:
1. A SHORT, stylish, catchy title (max 6 words, no emojis spam, clean)
2. A clear 2-sentence description

Rules:
- Use ONLY provided content
- Do NOT hallucinate
- Title should feel like a modern UI card heading
- Keep it concise and impactful

Return JSON ONLY in this format:
{
  "title": "",
  "description": ""
}
`,
        },
        {
          role: "user",
          content: context,
        },
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    let raw =
      completion.choices[0]?.message?.content?.trim() || "{}";

    // 🧠 Safe JSON parse
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // fallback if model messes up JSON
      parsed = {
        title: scraped.title.slice(0, 60) || "Event",
        description: raw,
      };
    }

    // ✅ Clean final output
    const title = cleanText(parsed.title || "Event");
    const description = cleanText(parsed.description || "No description");

    return res.json({
      title,
      description,
      debug: {
        scrapedTitle: scraped.title,
        headings: scraped.headings,
      },
    });
  } catch (err) {
    console.error("ERROR:", err.message);

    res.status(500).json({
      error: "Failed to generate content",
      details: err.message,
    });
  }
});

module.exports = router;