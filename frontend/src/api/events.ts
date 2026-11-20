// Tiny change bus so screens refresh after any write, including writes made in
// another browser tab (handy for trying Farmer and Buyer side by side).

const listeners = new Set<() => void>();

export function emitChange() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('bf_')) emitChange();
  });
}
