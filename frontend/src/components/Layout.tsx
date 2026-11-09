import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Gavel, LayoutDashboard, LogOut, Receipt, Sprout, Store, Wheat } from 'lucide-react';
import type { ReactNode } from 'react';
import { notificationService } from '../api';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '../hooks/useQuery';
import type { Role } from '../types';
import { Loading } from './ui';

interface Item { to: string; label: string; icon: ReactNode; end?: boolean; badge?: boolean }

const NAV: Record<Role, Item[]> = {
  Farmer: [
    { to: '/farmer', label: 'Dashboard', icon: <LayoutDashboard size={19} />, end: true },
    { to: '/farmer/listings', label: 'My listings', icon: <Sprout size={19} /> },
    { to: '/farmer/transactions', label: 'Sales', icon: <Receipt size={19} /> },
    { to: '/farmer/notifications', label: 'Notifications', icon: <Bell size={19} />, badge: true },
  ],
  Buyer: [
    { to: '/buyer', label: 'Dashboard', icon: <LayoutDashboard size={19} />, end: true },
    { to: '/buyer/browse', label: 'Browse harvests', icon: <Store size={19} /> },
    { to: '/buyer/bids', label: 'My bids', icon: <Gavel size={19} /> },
    { to: '/buyer/transactions', label: 'Purchases', icon: <Receipt size={19} /> },
    { to: '/buyer/notifications', label: 'Notifications', icon: <Bell size={19} />, badge: true },
  ],
};

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark"><Wheat size={20} strokeWidth={2.4} /></span>
      <span className="brand-name">Farmbid</span>
    </div>
  );
}

/** Wraps every signed-in screen. Sends people to the right dashboard for their role. */
export function AppShell({ role }: { role: Role }) {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const unread = useQuery(() => notificationService.unreadCount(), [user?.userId]);

  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'Farmer' ? '/farmer' : '/buyer'} replace />;

  const count = unread.data ?? 0;
  const items = NAV[role];
  const out = () => {
    logout();
    navigate('/login', { replace: true });
  };
  const initials = user.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <div className="app">
      <aside className="sidebar">
        <Brand />
        <nav className="nav" aria-label="Main">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end}>
              {i.icon}
              {i.label}
              {i.badge && count > 0 && <span className="count">{count}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="usercard">
            <span className="avatar">{initials}</span>
            <div>
              <div className="name">{user.fullName}</div>
              <div className="role">{role === 'Farmer' ? user.farmName ?? 'Farmer' : user.buyerType ?? 'Buyer'}</div>
            </div>
          </div>
          <button className="btn ghost" onClick={out}><LogOut size={18} /> Log out</button>
        </div>
      </aside>

      <div className="main">
        <header className="mtop">
          <Brand />
          <button className="btn ghost sm" style={{ color: '#fff' }} onClick={out} aria-label="Log out"><LogOut size={18} /></button>
        </header>
        <main className="page" key={pathname}><Outlet /></main>
        <nav className="tabbar" aria-label="Main">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end}>
              {i.icon}
              <span>{i.label.replace('Browse harvests', 'Browse').replace('My listings', 'Listings')}</span>
              {i.badge && count > 0 && <span className="count">{count}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
