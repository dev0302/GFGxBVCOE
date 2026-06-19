let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

function emitLeadershipUpdate(payload = {}) {
  if (!ioInstance) return;
  ioInstance.emit("leadership-transition-update", {
    ...payload,
    at: Date.now(),
  });
}

module.exports = { setIo, emitLeadershipUpdate };
