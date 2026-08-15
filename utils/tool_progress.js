// Lightweight bridge for progress emitted inside tools and consumed by the UI.
const listeners = new Set();

function subscribeProgress(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitProgress(progress) {
  for (const listener of listeners) {
    listener(progress);
  }
}

module.exports = {
  subscribeProgress,
  emitProgress
};
