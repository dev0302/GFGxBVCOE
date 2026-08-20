import { getAuthToken } from "./api";

const BASE = import.meta.env.VITE_API_BASE_URL;
const BLOG_ENDPOINT = "/api/v1/blog";

const request = async (path, options = {}) => {
  const token = getAuthToken();
  const headers = { ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE}${BLOG_ENDPOINT}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Blog request failed");
  }

  return data;
};

const getPostPayload = ({
  title,
  content,
  summary,
  coverImage,
  category,
  tags,
}) => ({
  title,
  content,
  summary,
  coverImage,
  category,
  tags,
});

export async function getPublicPosts() {
  return request("/public");
}

export async function getPostBySlug(slug) {
  return request(`/post/${encodeURIComponent(slug)}`);
}

export async function submitPost(postData) {
  const payload = getPostPayload(postData);

  if (payload.coverImage instanceof File) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key !== "coverImage" && value !== undefined && value !== null) {
        formData.append(
          key,
          Array.isArray(value) ? JSON.stringify(value) : value,
        );
      }
    });
    formData.append("coverImage", payload.coverImage);
    return request("/submit", { method: "POST", body: formData });
  }

  return request("/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPendingPosts() {
  return request("/pending");
}

export async function approvePost(postId, action, feedback = "") {
  return request(`/approve/${encodeURIComponent(postId)}`, {
    method: "POST",
    body: JSON.stringify({ action, feedback }),
  });
}
