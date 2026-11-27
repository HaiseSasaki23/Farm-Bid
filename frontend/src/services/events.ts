// Tiny client cache invalidation bus. It carries no application data; it only
// tells active screens that the backend changed after a successful write.

const listeners = new Set<() => void>();

export function emitChange() {
  listeners.forEach((l) => l());
  channel?.postMessage('changed');
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('farmbid-api-changes');
if (channel) channel.onmessage = () => listeners.forEach((l) => l());
