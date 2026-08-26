const DEFAULTS = {
  title: "GFG - BVCOE",
  description: "GeeksforGeeks Student Chapter at BVCOE",
  image: "/gfgLogo.png",
};

const META_KEYS = [
  { attr: "property", key: "og:title" },
  { attr: "property", key: "og:description" },
  { attr: "property", key: "og:image" },
  { attr: "property", key: "og:url" },
  { attr: "name", key: "twitter:title" },
  { attr: "name", key: "twitter:description" },
  { attr: "name", key: "twitter:image" },
  { attr: "name", key: "description" },
];

function upsertMeta(attr, key, content) {
  if (!content) return;

  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function toAbsoluteUrl(value) {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, window.location.origin).href;
}

export function setPageMeta({ title, description, image, url } = {}) {
  if (title) document.title = title;

  const resolvedImage = toAbsoluteUrl(image || DEFAULTS.image);
  const resolvedUrl = url || window.location.href;

  upsertMeta("property", "og:title", title || DEFAULTS.title);
  upsertMeta("property", "og:description", description || DEFAULTS.description);
  upsertMeta("property", "og:image", resolvedImage);
  upsertMeta("property", "og:url", resolvedUrl);
  upsertMeta("name", "twitter:title", title || DEFAULTS.title);
  upsertMeta("name", "twitter:description", description || DEFAULTS.description);
  upsertMeta("name", "twitter:image", resolvedImage);
  upsertMeta("name", "description", description || DEFAULTS.description);
}

export function resetPageMeta() {
  setPageMeta(DEFAULTS);
}
