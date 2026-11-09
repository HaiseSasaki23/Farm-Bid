import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, CircleCheck, CircleX, Gavel, Receipt, Sprout } from 'lucide-react';
import type { ReactNode } from 'react';
import { notificationService } from '../api';
import { useQuery } from '../hooks/useQuery';
import { timeAgo } from '../lib/format';
import type { NotificationType } from '../types';
import { Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';

const LOOK: Record<NotificationType, { icon: ReactNode; tone: string }> = {
  NewBid: { icon: <Gavel size={18} />, tone: 'amber' },
  BidAccepted: { icon: <CircleCheck size={18} />, tone: '' },
  BidRejected: { icon: <CircleX size={18} />, tone: 'red' },
  BidCancelled: { icon: <CircleX size={18} />, tone: 'red' },
  TransactionUpdate: { icon: <Receipt size={18} />, tone: 'blue' },
  ListingUpdate: { icon: <Sprout size={18} />, tone: 'blue' },
};

export function Notifications() {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(() => notificationService.list(), []);
  const unread = data?.filter((n) => !n.isRead).length ?? 0;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'You are all caught up.'}
        actions={
          unread > 0 && (
            <button className="btn secondary" onClick={() => notificationService.markAllAsRead()}>
              <CheckCheck size={18} /> Mark all as read
            </button>
          )
        }
      />
      {error && <ErrorBanner message={error} />}
      {loading && !data ? (
        <Loading />
      ) : data && data.length === 0 ? (
        <div className="card">
          <Empty icon={<Bell size={24} />} title="No notifications yet">
            New bids, accepted offers, and sale updates will show up here.
          </Empty>
        </div>
      ) : (
        <div className="card divided">
          {data?.map((n) => {
            const look = LOOK[n.type];
            return (
              <button
                key={n.notificationId}
                className={`notif ${n.isRead ? 'read' : ''}`}
                onClick={async () => {
                  await notificationService.markAsRead(n.notificationId);
                  if (n.link) navigate(n.link);
                }}
              >
                <span className={`ico ${look.tone}`}>{look.icon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="strong" style={{ display: 'block' }}>{n.title}</span>
                  <span className="muted">{n.message}</span>
                  <span className="small faint" style={{ display: 'block', marginTop: 2 }}>{timeAgo(n.createdAt)}</span>
                </span>
                {!n.isRead && <span className="dot" aria-label="Unread" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
