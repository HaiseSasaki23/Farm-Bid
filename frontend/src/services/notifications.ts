import type { AppNotification } from '../types';

// Notifications have no backend endpoint yet. Returning an empty read-only
// collection prevents the UI from showing fabricated local notifications.
export const notificationService = {
  async list(): Promise<AppNotification[]> { return []; },
  async unreadCount(): Promise<number> { return 0; },
  async markAsRead(_id: number): Promise<void> { throw new Error('Notifications are not supported by the backend yet.'); },
  async markAllAsRead(): Promise<void> { throw new Error('Notifications are not supported by the backend yet.'); },
};
