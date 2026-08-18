const cheerio = require("cheerio");

const PROFANITY_LIST = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "pussy", "slut", "whore",
  "dumbass", "jackass", "crap", "piss"
];

/**
 * Checks if a string contains profanity words
 */
function containsProfanity(text) {
  if (!text || typeof text !== "string") return false;
  // Normalize text: lowercase and strip punctuation (e.g. f*ck or s.h.i.t)
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  
  for (const word of PROFANITY_LIST) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(normalized) || normalized.includes(word)) {
      return true;
    }
  }
  return false;
}

/**
 * Sanitizes HTML content on the backend to prevent XSS attacks
 */
function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";
  // Load HTML without wraps
  const $ = cheerio.load(html, null, false);
  
  // Remove dangerous elements
  $("script, iframe, object, embed, link, style, iframe, frame, frameset").remove();
  
  // Strip inline javascript and on* event handlers
  $("*").each((_, elem) => {
    if (elem.attribs) {
      Object.keys(elem.attribs).forEach((attr) => {
        // Remove event listeners
        if (attr.toLowerCase().startsWith("on")) {
          $(elem).removeAttr(attr);
        }
        // Remove javascript: links
        const val = elem.attribs[attr] || "";
        if (val.trim().toLowerCase().startsWith("javascript:")) {
          $(elem).removeAttr(attr);
        }
      });
    }
  });
  
  return $.html();
}

/**
 * Calculates quality audit checklist and score based on Scribble guidelines
 */
function calculateQualityAudit(html) {
  if (!html || typeof html !== "string") {
    return { hasCode: false, hasHeadings: false, shortParagraphs: false, score: 0 };
  }
  
  const $ = cheerio.load(html);
  
  const hasCode = $("pre, code").length > 0;
  const hasHeadings = $("h1, h2, h3, h4, h5, h6").length > 0;
  
  // A scannable paragraph shouldn't exceed 100 words (approx. 4 lines of text)
  let shortParagraphs = true;
  $("p").each((_, elem) => {
    const text = $(elem).text().trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount > 100) {
      shortParagraphs = false;
    }
  });

  // Calculate score out of 100
  let score = 40; // Base score
  if (hasCode) score += 25;
  if (hasHeadings) score += 25;
  if (shortParagraphs) score += 10;

  return {
    hasCode,
    hasHeadings,
    shortParagraphs,
    score
  };
}

module.exports = {
  containsProfanity,
  sanitizeHtml,
  calculateQualityAudit
};
