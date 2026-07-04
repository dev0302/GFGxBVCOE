let ioInstance = null;
let emitToUserFn = null;

function setIo(io) {
  ioInstance = io;
}

function setEmitToUser(fn) {
  emitToUserFn = fn;
}

function emitLeadershipUpdate(payload = {}) {
  if (!ioInstance) return;
  ioInstance.emit("leadership-transition-update", {
    ...payload,
    at: Date.now(),
  });
}

function emitTenureEnded(userId, payload = {}) {
  if (!emitToUserFn || !userId) return;
  emitToUserFn(String(userId), "tenure-ended", {
    ...payload,
    at: Date.now(),
  });
}

module.exports = { setIo, setEmitToUser, emitLeadershipUpdate, emitTenureEnded };
