import fs from "node:fs";
import path from "node:path";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildMetaTags({ title, description, image, url, type = "website" }) {
  return `
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:type" content="${escapeHtml(type)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta name="description" content="${escapeHtml(description)}" />`;
}

export function getSiteUrl(req) {
  const configured = process.env.FRONTEND_URL || process.env.VITE_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}

export function toAbsoluteUrl(siteUrl, value) {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith("/") ? "" : "/"}${value}`;
}

export function stripExistingMeta(html) {
  return html.replace(
    /<meta\s+(?:property="og:[^"]*"|name="(?:twitter:[^"]*|description)")[^>]*>\s*/gi,
    "",
  );
}

export function getApiBase() {
  return (process.env.VITE_API_BASE_URL || process.env.API_URL || "").replace(/\/$/, "");
}

export function renderOgPage(req, og, { fallbackPath = "/blog" } = {}) {
  const siteUrl = getSiteUrl(req);
  const resolved = {
    ...og,
    image: toAbsoluteUrl(siteUrl, og.image),
    url: toAbsoluteUrl(siteUrl, og.url),
  };

  const metaTags = buildMetaTags(resolved);
  let html;

  try {
    const indexPath = path.join(process.cwd(), "dist", "index.html");
    html = fs.readFileSync(indexPath, "utf8");
    html = stripExistingMeta(html);
    html = html.replace(
      /<title>.*?<\/title>/i,
      `<title>${escapeHtml(resolved.title)}</title>`,
    );
    html = html.replace("</head>", `${metaTags}\n</head>`);
  } catch {
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(resolved.title)}</title>${metaTags}
  <meta http-equiv="refresh" content="0;url=${escapeHtml(fallbackPath)}" />
</head>
<body></body>
</html>`;
  }

  return { html, resolved };
}
