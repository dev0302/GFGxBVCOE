import fs from "node:fs";
import path from "node:path";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMetaTags({ title, description, image, url }) {
  return `
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta name="description" content="${escapeHtml(description)}" />`;
}

function getSiteUrl(req) {
  const configured = process.env.FRONTEND_URL || process.env.VITE_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}

function toAbsoluteUrl(siteUrl, value) {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith("/") ? "" : "/"}${value}`;
}

function stripExistingMeta(html) {
  return html.replace(
    /<meta\s+(?:property="og:[^"]*"|name="(?:twitter:[^"]*|description)")[^>]*>\s*/gi,
    "",
  );
}

export default async function handler(req, res) {
  const siteUrl = getSiteUrl(req);
  const apiBase = (process.env.VITE_API_BASE_URL || process.env.API_URL || "").replace(
    /\/$/,
    "",
  );

  const defaults = {
    title: "GFG BVCOE Blog",
    description: "Stories, insights, and updates from the GFG-BVCOE community.",
    image: `${siteUrl}/gfg_web_og.png`,
    url: `${siteUrl}/blog`,
  };

  let og = { ...defaults };

  try {
    if (apiBase) {
      const response = await fetch(`${apiBase}/api/v1/blog/og-meta`);
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data.og) {
          og = {
            title: data.og.title || defaults.title,
            description: data.og.description || defaults.description,
            image: data.og.image || defaults.image,
            url: data.og.url || defaults.url,
          };
        }
      }
    }
  } catch (error) {
    console.error("og-blog metadata fetch failed:", error);
  }

  og.image = toAbsoluteUrl(siteUrl, og.image);
  og.url = toAbsoluteUrl(siteUrl, og.url);

  const metaTags = buildMetaTags(og);
  let html;

  try {
    const indexPath = path.join(process.cwd(), "dist", "index.html");
    html = fs.readFileSync(indexPath, "utf8");
    html = stripExistingMeta(html);
    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(og.title)}</title>`);
    html = html.replace("</head>", `${metaTags}\n</head>`);
  } catch {
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(og.title)}</title>${metaTags}
  <meta http-equiv="refresh" content="0;url=/blog" />
</head>
<body></body>
</html>`;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.status(200).send(html);
}
