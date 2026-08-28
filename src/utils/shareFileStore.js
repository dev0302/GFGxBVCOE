// Temporary storage for Share Target file — bridges SW POST -> React GET.
// IndexedDB so the File/Blob survives the 303 redirect.

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

function isFileLike(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.name === "string" &&
    typeof value.size === "number" &&
    typeof value.type === "string" &&
    typeof value.arrayBuffer === "function"
  );
}
function isBlobLike(value) {
  return value && typeof value === "object" && typeof value.size === "number" && typeof value.arrayBuffer === "function";
}

export async function getShareFile(id) {
  if (!id) return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      db.close();
      const rec = req.result;
      if (!rec) return resolve(null);
      // Stored by SW as {name,type,size,blob,createdAt}
      // Normalise to File for downstream uploadVaultDocument
      // Use duck typing + globalThis checks to avoid `instanceof` on non-callable RHS (e.g. shadowed `File` import)
      const blob = rec.blob;
      const GlobalFile = typeof globalThis !== "undefined" ? globalThis.File : undefined;
      const GlobalBlob = typeof globalThis !== "undefined" ? globalThis.Blob : undefined;
      const isFileInstance = GlobalFile ? (() => { try { return blob instanceof GlobalFile; } catch { return isFileLike(blob); } })() : isFileLike(blob);
      if (isFileInstance) return resolve(rec);
      const isBlobInstance = GlobalBlob ? (() => { try { return blob instanceof GlobalBlob; } catch { return isBlobLike(blob); } })() : isBlobLike(blob);
      if (isBlobInstance) {
        const FileCtor = GlobalFile;
        const file = FileCtor
          ? new FileCtor([blob], rec.name || blob.name || "shared-file", {
              type: rec.type || blob.type || "application/octet-stream",
              lastModified: rec.lastModified || Date.now(),
            })
          : blob;
        return resolve({ ...rec, blob: file });
      }
      // Fallback: record itself is a File/Blob directly
      const recIsFile = GlobalFile ? (() => { try { return rec instanceof GlobalFile; } catch { return isFileLike(rec); } })() : isFileLike(rec);
      const recIsBlob = GlobalBlob ? (() => { try { return rec instanceof GlobalBlob; } catch { return isBlobLike(rec); } })() : isBlobLike(rec);
      if (recIsFile || recIsBlob) return resolve({ blob: rec, name: rec.name });
      resolve(rec);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function deleteShareFile(id) {
  if (!id) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function clearStaleShareFiles(ttlMs = 30 * 60 * 1000) {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const keysReq = store.getAllKeys();
    const valsReq = store.getAll();
    const [keys, vals] = await Promise.all([
      new Promise((res) => {
        keysReq.onsuccess = () => res(keysReq.result || []);
      }),
      new Promise((res) => {
        valsReq.onsuccess = () => res(valsReq.result || []);
      }),
    ]);
    const now = Date.now();
    keys.forEach((k, i) => {
      const rec = vals[i];
      if (rec && rec.createdAt && now - rec.createdAt > ttlMs) {
        store.delete(k);
      }
    });
    await new Promise((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}
