const express = require("express");

const router = express.Router();
const DEFAULT_FOLDER_ID = "1NEn6_PHgncHmb0hHVJZQ-7hbU1rV6pQ7";
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

router.get("/", async (req, res) => {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FILMS_FOLDER_ID || DEFAULT_FOLDER_ID;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      message: "The films gallery needs its Google Drive API key configured on the server.",
    });
  }

  const requestedPageSize = Number.parseInt(req.query.pageSize, 10);
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(Math.max(requestedPageSize, 1), 100)
    : 24;
  const pageToken = typeof req.query.pageToken === "string" ? req.query.pageToken : "";
  const cacheKey = `${folderId}:${pageSize}:${pageToken}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json(cached.data);
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: `'${folderId}' in parents and trashed = false and mimeType contains 'video/'`,
    pageSize: String(pageSize),
    orderBy: "name",
    fields: "nextPageToken,files(id,name,mimeType,thumbnailLink,size,videoMediaMetadata(durationMillis))",
  });
  if (pageToken) params.set("pageToken", pageToken);

  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
    if (!response.ok) {
      const status = response.status === 429 ? 503 : response.status === 403 ? 503 : 502;
      return res.status(status).json({
        success: false,
        message: "We couldn't load the films right now. Please try again shortly.",
      });
    }

    const data = await response.json();
    const result = {
      success: true,
      files: (data.files || []).map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        thumbnailUrl: file.thumbnailLink || `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w800`,
        duration: file.videoMediaMetadata?.durationMillis || null,
        size: file.size || null,
      })),
      nextPageToken: data.nextPageToken || null,
    };
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= Date.now()) cache.delete(key);
    }
    if (cache.size >= 100) cache.delete(cache.keys().next().value);
    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json(result);
  } catch {
    return res.status(502).json({
      success: false,
      message: "We couldn't load the films right now. Please try again shortly.",
    });
  }
});

module.exports = router;
