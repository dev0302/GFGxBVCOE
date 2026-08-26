import { getApiBase, getSiteUrl, renderOgPage } from "./og-utils.js";

export default async function handler(req, res) {
  const siteUrl = getSiteUrl(req);
  const slug = String(req.query.slug || "").trim();

  const defaults = {
    title: "GFG BVCOE Blog",
    description: "Stories, insights, and updates from the GFG-BVCOE community.",
    image: `${siteUrl}/gfg_web_og.png`,
    url: slug ? `${siteUrl}/blog/post/${encodeURIComponent(slug)}` : `${siteUrl}/blog`,
    type: "article",
  };

  let og = { ...defaults };
  const apiBase = getApiBase();

  try {
    if (apiBase && slug) {
      const response = await fetch(
        `${apiBase}/api/v1/blog/og-meta/${encodeURIComponent(slug)}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data.og) {
          og = {
            title: data.og.title || defaults.title,
            description: data.og.description || defaults.description,
            image: data.og.image || defaults.image,
            url: data.og.url || defaults.url,
            type: data.og.type || defaults.type,
          };
        }
      }
    }
  } catch (error) {
    console.error("og-blog-post metadata fetch failed:", error);
  }

  const fallbackPath = slug ? `/blog/post/${encodeURIComponent(slug)}` : "/blog";
  const { html } = renderOgPage(req, og, { fallbackPath });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.status(200).send(html);
}
