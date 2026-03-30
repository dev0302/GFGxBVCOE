import { useCallback } from "react";
import UploadRequestModal from "./realtimeUpload/UploadRequestModal";
import { useUploadTransfer } from "../context/UploadTransferContext";
import { useEffect } from "react";

export default function IncomingUploadModal({ onLocalAddFiles }) {
  const {
    incomingRequest,
    closeIncomingRequest,
    emitProgress,
    emitComplete,
    emitImageAdded,
    emitRequestOpened,
    emitRequestClosed,
    localAddFilesHandler,
  } = useUploadTransfer();

  useEffect(() => {
    if (!incomingRequest?.senderId || !incomingRequest?.requestId) return;
    emitRequestOpened({
      targetUserId: incomingRequest.senderId,
      requestId: incomingRequest.requestId,
    });
  }, [incomingRequest?.senderId, incomingRequest?.requestId, emitRequestOpened]);

  const handleEmitProgress = useCallback(
    (payload) => {
      if (!incomingRequest?.senderId) return;
      emitProgress({ ...payload, targetUserId: incomingRequest.senderId });
    },
    [incomingRequest?.senderId, emitProgress]
  );

  const handleEmitComplete = useCallback(
    (payload) => {
      if (!incomingRequest?.senderId) return;
      emitComplete({ ...payload, targetUserId: incomingRequest.senderId });
    },
    [incomingRequest?.senderId, emitComplete]
  );

  const handleEmitImageAdded = useCallback(
    (payload) => {
      if (!incomingRequest?.senderId) return;
      emitImageAdded({ ...payload, targetUserId: incomingRequest.senderId });
    },
    [incomingRequest?.senderId, emitImageAdded]
  );

  return (
    <UploadRequestModal
      open={Boolean(incomingRequest)}
      request={incomingRequest}
      onClose={() => {
        if (incomingRequest?.senderId && incomingRequest?.requestId) {
          emitRequestClosed({
            targetUserId: incomingRequest.senderId,
            requestId: incomingRequest.requestId,
          });
        }
        closeIncomingRequest();
      }}
      onLocalAddFiles={onLocalAddFiles || localAddFilesHandler}
      onEmitProgress={handleEmitProgress}
      onEmitComplete={handleEmitComplete}
      onEmitNewImage={handleEmitImageAdded}
    />
  );
}

