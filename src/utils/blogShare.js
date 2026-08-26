const LINKEDIN_POST_LIMIT = 3000;
const COMPOSE_URL_SAFE = 1600;

export function getBlogPostUrl(post) {
  const slug = post?.slug || "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/blog/post/${encodeURIComponent(slug)}`;
}

function mapLetters(text, upperStart, lowerStart, digits) {
  return Array.from(text)
    .map((ch) => {
      const code = ch.codePointAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(upperStart + (code - 65));
      if (code >= 97 && code <= 122) {
        // Mathematical italic 'h' is a hole in the alphabet block.
        if (lowerStart === 0x1d44e && ch === "h") return "ℎ";
        return String.fromCodePoint(lowerStart + (code - 97));
      }
      if (digits && code >= 48 && code <= 57) return digits[code - 48];
      return ch;
    })
    .join("");
}

export function toLinkedInBold(text) {
  return mapLetters(
    String(text || ""),
    0x1d400,
    0x1d41a,
    ["𝟎", "𝟏", "𝟐", "𝟑", "𝟒", "𝟓", "𝟔", "𝟕", "𝟖", "𝟗"],
  );
}

export function toLinkedInItalic(text) {
  return mapLetters(String(text || ""), 0x1d434, 0x1d44e);
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function serializeNode(node) {
  if (!node) return "";
  if (node.nodeType === Node.TEXT_NODE) {
    return decodeEntities(node.textContent || "").replace(/[ \t]+/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map(serializeNode).join("");

  switch (tag) {
    case "br":
      return "\n";
    case "p":
    case "div":
    case "section":
      return children.trim() ? `${children.trim()}\n\n` : "";
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return children.trim() ? `${toLinkedInBold(children.trim())}\n\n` : "";
    case "strong":
    case "b":
      return toLinkedInBold(children);
    case "em":
    case "i":
      return toLinkedInItalic(children);
    case "blockquote":
      return children.trim()
        ? `${children
            .trim()
            .split("\n")
            .map((line) => (line.trim() ? `“ ${line.trim()}` : ""))
            .join("\n")}\n\n`
        : "";
    case "li":
      return `• ${children.trim()}\n`;
    case "ul":
    case "ol":
      return `${children.trim()}\n\n`;
    case "a": {
      const href = node.getAttribute("href") || "";
      const label = children.trim();
      if (!href || href === label) return label;
      return label ? `${label} (${href})` : href;
    }
    case "pre":
    case "code":
      return children;
    case "img":
    case "figure":
    case "script":
    case "style":
      return "";
    default:
      return children;
  }
}

export function htmlToLinkedInText(html) {
  if (!html || typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  const text = serializeNode(doc.body)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
}

export function buildLinkedInShareText(post, url) {
  const title = String(post?.title || "GFG × BVCOE Journal").trim();
  const summary = String(post?.summary || "").trim();
  const body = htmlToLinkedInText(post?.content);
  const tags = (Array.isArray(post?.tags) ? post.tags : [])
    .map((tag) => String(tag).replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((tag) => `#${tag.replace(/\s+/g, "")}`)
    .join(" ");

  const parts = [toLinkedInBold(title)];
  if (summary) parts.push(summary);
  if (body && body !== summary) parts.push(body);
  if (tags) parts.push(tags);
  parts.push(`Read the full story on GFG × BVCOE Journal:\n${url}`);

  let text = parts.filter(Boolean).join("\n\n");
  if (text.length > LINKEDIN_POST_LIMIT) {
    const suffix = `\n\nRead the full story on GFG × BVCOE Journal:\n${url}`;
    const keep = Math.max(0, LINKEDIN_POST_LIMIT - suffix.length - 1);
    text = `${text.slice(0, keep).trim()}…${suffix}`;
  }
  return text;
}

export async function copyTextToClipboard(text) {
  const value = String(text || "");
  if (!value) throw new Error("Nothing to copy");

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
}

export async function copyBlogPostLink(post) {
  const url = getBlogPostUrl(post);
  await copyTextToClipboard(url);
  return url;
}

function linkedInComposeUrl(text) {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
}

function linkedInAppUrl(text) {
  return `linkedin://feed/?shareActive=true&text=${encodeURIComponent(text)}`;
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent || "");
}

function isIOS() {
  const ua = navigator.userAgent || "";
  return (
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function pageWentToBackground() {
  return document.hidden || document.visibilityState === "hidden";
}

function openWebUrl(webUrl) {
  const opened = window.open(webUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(webUrl);
  }
}

function linkedInAndroidIntentUrl(text, webUrl) {
  const hostAndPath = `www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
  return (
    `intent://${hostAndPath}#Intent;scheme=https;package=com.linkedin.android;` +
    `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`
  );
}

function tryLinkedInAppThenWeb(appUrl, webUrl, { replaceCurrentTab = false } = {}) {
  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      document.removeEventListener("visibilitychange", onLeave);
      window.removeEventListener("pagehide", onLeave);
      resolve();
    };

    const onLeave = () => {
      if (pageWentToBackground()) finish();
    };

    document.addEventListener("visibilitychange", onLeave);
    window.addEventListener("pagehide", onLeave);

    // Custom scheme is the reliable way to invoke the installed LinkedIn app
    // on Windows/macOS/iOS. Chromium typically stays on this page if no handler exists.
    window.location.assign(appUrl);

    window.setTimeout(() => {
      if (pageWentToBackground()) {
        finish();
        return;
      }
      if (replaceCurrentTab) {
        window.location.assign(webUrl);
      } else {
        openWebUrl(webUrl);
      }
      finish();
    }, 1400);
  });
}

export async function sharePostToLinkedIn(post) {
  const url = getBlogPostUrl(post);
  const text = buildLinkedInShareText(post, url);

  const encodedLength = encodeURIComponent(text).length;
  const composeText =
    encodedLength > COMPOSE_URL_SAFE
      ? `${toLinkedInBold(post?.title || "GFG × BVCOE Journal")}\n\n${url}`
      : text;

  const webUrl = linkedInComposeUrl(composeText);
  // Start copy in the same user-gesture turn so the app protocol is not blocked.
  const copyPromise = copyTextToClipboard(text).catch(() => {});

  if (isAndroid()) {
    window.location.assign(linkedInAndroidIntentUrl(composeText, webUrl));
    await copyPromise;
    return { url, text };
  }

  if (isIOS()) {
    await tryLinkedInAppThenWeb(linkedInAppUrl(composeText), webUrl, {
      replaceCurrentTab: true,
    });
    await copyPromise;
    return { url, text };
  }

  await tryLinkedInAppThenWeb(linkedInAppUrl(composeText), webUrl);
  await copyPromise;
  return { url, text };
}
