import type { AppNotification } from '../types';
import { currentUserId, read, write } from './mockDb';

export const notificationService = {
  /** GET /api/notifications */
  async list(): Promise<AppNotification[]> {
    const me = currentUserId();
    return read()
      .notifications.filter((n) => n.userId === me)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** GET /api/notifications/unread-count */
  async unreadCount(): Promise<number> {
    const me = currentUserId();
    return read().notifications.filter((n) => n.userId === me && !n.isRead).length;
  },

  /** POST /api/notifications/:id/read  (MarkAsRead) */
  async markAsRead(id: number): Promise<void> {
    const db = read();
    const n = db.notifications.find((x) => x.notificationId === id);
    if (n && !n.isRead) {
      n.isRead = true;
      write(db);
    }
  },

  /** POST /api/notifications/read-all */
  async markAllAsRead(): Promise<void> {
    const db = read();
    const me = currentUserId();
    db.notifications.filter((n) => n.userId === me).forEach((n) => (n.isRead = true));
    write(db);
  },
};
