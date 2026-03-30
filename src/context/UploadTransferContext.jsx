import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useSocketContext } from "./SocketProvider";
import { useGlobalModal } from "./GlobalModalProvider";

const UploadTransferContext = createContext(null);

export function UploadTransferProvider({ children }) {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocketContext();
  const { openModal, closeModal } = useGlobalModal();

  const [incomingRequest, setIncomingRequest] = useState(null);
  const [progressItems, setProgressItems] = useState([]);
  const [sharedImages, setSharedImages] = useState([]);
  const [localAddFilesHandler, setLocalAddFilesHandler] = useState(null);
  const [outgoingWait, setOutgoingWait] = useState(null);

  useEffect(() => {
    if (!socket || !user?._id) return;

    const onReceiveRequest = (payload) => {
      setIncomingRequest(payload || null);
      openModal({ type: "incoming-upload-request" });
    };
    const onProgress = (payload = {}) => {
      if (!payload.fileId) return;
      setOutgoingWait((prev) =>
        prev && prev.requestId === payload.requestId ? null : prev
      );
      setProgressItems((prev) => {
        const i = prev.findIndex((x) => x.fileId === payload.fileId);
        if (i === -1) return [...prev, { ...payload, progress: payload.progress || 0 }];
        const copy = [...prev];
        copy[i] = { ...copy[i], ...payload, progress: payload.progress || 0 };
        return copy;
      });
    };
    const onComplete = (payload = {}) => {
      if (!payload.requestId) return;
      setProgressItems((prev) =>
        prev.map((x) => (x.requestId === payload.requestId ? { ...x, progress: 100 } : x))
      );
    };
    const onImageAdded = (payload = {}) => {
      if (!payload.fileId) return;
      setOutgoingWait((prev) =>
        prev && prev.requestId === payload.requestId ? null : prev
      );
      setSharedImages((prev) => (prev.some((x) => x.fileId === payload.fileId) ? prev : [...prev, payload]));
    };
    const onImageRemoved = (payload = {}) => {
      if (!payload.fileId) return;
      setSharedImages((prev) => prev.filter((x) => x.fileId !== payload.fileId));
      setProgressItems((prev) => prev.filter((x) => x.fileId !== payload.fileId));
    };
    const onImagesSync = (payload = {}) => {
      if (Array.isArray(payload.images)) setSharedImages(payload.images);
    };
    const onRequestOpened = (payload = {}) => {
      if (!payload.requestId) return;
      setOutgoingWait((prev) =>
        prev && prev.requestId === payload.requestId ? { ...prev, opened: true } : prev
      );
    };
    const onRequestClosed = (payload = {}) => {
      if (!payload.requestId) return;
      setOutgoingWait((prev) =>
        prev && prev.requestId === payload.requestId ? null : prev
      );
    };

    socket.on("receive-upload-request", onReceiveRequest);
    socket.on("upload-progress", onProgress);
    socket.on("upload-complete", onComplete);
    socket.on("new-image-added", onImageAdded);
    socket.on("image-added", onImageAdded);
    socket.on("image-removed", onImageRemoved);
    socket.on("images-sync", onImagesSync);
    socket.on("upload-request-opened", onRequestOpened);
    socket.on("upload-request-closed", onRequestClosed);

    return () => {
      socket.off("receive-upload-request", onReceiveRequest);
      socket.off("upload-progress", onProgress);
      socket.off("upload-complete", onComplete);
      socket.off("new-image-added", onImageAdded);
      socket.off("image-added", onImageAdded);
      socket.off("image-removed", onImageRemoved);
      socket.off("images-sync", onImagesSync);
      socket.off("upload-request-opened", onRequestOpened);
      socket.off("upload-request-closed", onRequestClosed);
    };
  }, [socket, openModal, user?._id]);

  const sendUploadRequest = useCallback(
    ({ receiverId, receiverName, requestId, eventMeta }) => {
      if (!socket || !receiverId || !requestId) return;
      setOutgoingWait({
        requestId,
        receiverId,
        receiverName: receiverName || "user",
        opened: false,
      });
      socket.emit("send-upload-request", { receiverId, requestId, eventMeta: eventMeta || null });
    },
    [socket]
  );

  const emitRequestOpened = useCallback(
    ({ targetUserId, requestId }) => {
      if (!socket || !targetUserId || !requestId) return;
      socket.emit("upload-request-opened", { targetUserId, requestId });
    },
    [socket]
  );

  const emitRequestClosed = useCallback(
    ({ targetUserId, requestId }) => {
      if (!socket || !targetUserId || !requestId) return;
      socket.emit("upload-request-closed", { targetUserId, requestId });
    },
    [socket]
  );

  const emitProgress = useCallback(
    ({ targetUserId, requestId, fileId, name, progress }) => {
      if (!socket || !targetUserId) return;
      socket.emit("upload-progress", { targetUserId, requestId, fileId, name, progress });
    },
    [socket]
  );

  const emitComplete = useCallback(
    ({ targetUserId, requestId, total }) => {
      if (!socket || !targetUserId) return;
      socket.emit("upload-complete", { targetUserId, requestId, total });
    },
    [socket]
  );

  const emitImageAdded = useCallback(
    (payload) => {
      if (!socket || !payload?.targetUserId) return;
      socket.emit("new-image-added", payload);
    },
    [socket]
  );

  const emitImageRemoved = useCallback(
    (payload) => {
      if (!socket || !payload?.targetUserId) return;
      socket.emit("image-removed", payload);
    },
    [socket]
  );

  const syncImages = useCallback(
    ({ targetUserId, images }) => {
      if (!socket || !targetUserId) return;
      socket.emit("images-sync", { targetUserId, images });
    },
    [socket]
  );

  const closeIncomingRequest = useCallback(() => {
    setIncomingRequest(null);
    closeModal();
  }, [closeModal]);

  const registerLocalAddFilesHandler = useCallback((handler) => {
    setLocalAddFilesHandler(() => (typeof handler === "function" ? handler : null));
    return () => setLocalAddFilesHandler(null);
  }, []);

  const value = useMemo(
    () => ({
      incomingRequest,
      onlineUsers,
      outgoingWait,
      progressItems,
      sharedImages,
      setSharedImages,
      setProgressItems,
      sendUploadRequest,
      emitProgress,
      emitComplete,
      emitImageAdded,
      emitImageRemoved,
      syncImages,
      emitRequestOpened,
      emitRequestClosed,
      closeIncomingRequest,
      localAddFilesHandler,
      registerLocalAddFilesHandler,
    }),
    [
      incomingRequest,
      onlineUsers,
      outgoingWait,
      progressItems,
      sharedImages,
      sendUploadRequest,
      emitProgress,
      emitComplete,
      emitImageAdded,
      emitImageRemoved,
      syncImages,
      emitRequestOpened,
      emitRequestClosed,
      closeIncomingRequest,
      localAddFilesHandler,
      registerLocalAddFilesHandler,
    ]
  );

  return <UploadTransferContext.Provider value={value}>{children}</UploadTransferContext.Provider>;
}

export function useUploadTransfer() {
  const ctx = useContext(UploadTransferContext);
  if (!ctx) throw new Error("useUploadTransfer must be used within UploadTransferProvider");
  return ctx;
}

