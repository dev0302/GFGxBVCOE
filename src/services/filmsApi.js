const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function getFilms({ pageToken, signal } = {}) {
  const params = new URLSearchParams({ pageSize: "24" });
  if (pageToken) params.set("pageToken", pageToken);

  const response = await fetch(`${API_BASE}/api/v1/films?${params}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "We couldn't load the films right now.");
  }
  return data;
}
