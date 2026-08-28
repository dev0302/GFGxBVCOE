// GFG BVCOE minimal PWA service worker — Share-to-Vault only
// No caching, no offline shell. Only intercepts POST /share-target.

const DB_NAME = "gfg-share-pending-db";
const STORE_NAME = "pending";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(id, file) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        // Store minimal envelope so we preserve name/type/size across serialization
        const record = {
          name: file.name || "shared-file",
          type: file.type || "application/octet-stream",
          size: file.size || 0,
          lastModified: file.lastModified || Date.now(),
          blob: file,
          createdAt: Date.now(),
        };
        const putReq = store.put(record, id);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      // Opportunistic cleanup of stale entries (>30 min)
      try {
        const db = await openDb();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const getAllReq = store.getAll();
        const getAllKeysReq = store.getAllKeys();
        const [all, keys] = await Promise.all([
          new Promise((res) => {
            getAllReq.onsuccess = () => res(getAllReq.result || []);
          }),
          new Promise((res) => {
            getAllKeysReq.onsuccess = () => res(getAllKeysReq.result || []);
          }),
        ]);
        const now = Date.now();
        const TTL = 30 * 60 * 1000;
        keys.forEach((k, i) => {
          const rec = all[i];
          if (rec && rec.createdAt && now - rec.createdAt > TTL) {
            store.delete(k);
          }
        });
        await new Promise((res, rej) => {
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        });
        db.close();
      } catch {
        // ignore cleanup errors
      }
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isShareTargetPost =
    event.request.method === "POST" && url.pathname === "/share-target";

  if (!isShareTargetPost) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const formData = await event.request.formData();
        // Primary param name per manifest
        let file = formData.get("vaultFile");
        // Fallbacks: some browsers/OS may use different field name
        // Use duck typing to avoid `instanceof File` on non-callable RHS
        const isFileLike = (v) => v && typeof v === "object" && typeof v.name === "string" && typeof v.size === "number" && typeof v.arrayBuffer === "function";
        if (!file || (typeof file === "string" && !file)) {
          // Try any File in the formData
          for (const [, value] of formData.entries()) {
            if (isFileLike(value) && value.size > 0) {
              file = value;
              break;
            }
          }
        }
        // Handle FileList / multiple — V1 supports one, keep first
        if (Array.isArray(file)) file = file[0];

        if (!file || !isFileLike(file) || file.size === 0) {
          return Response.redirect("/?share_error=no_file", 303);
        }

        const id =
          (self.crypto && self.crypto.randomUUID
            ? self.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

        await idbPut(id, file);

        return Response.redirect(`/share-target?id=${encodeURIComponent(id)}`, 303);
      } catch {
        return Response.redirect("/?share_error=sw_error", 303);
      }
    })()
  );
});
