const cheerio = require("cheerio");

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
  sanitizeHtml,
  calculateQualityAudit
};
