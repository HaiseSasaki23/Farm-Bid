import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Gavel, HelpCircle, LayoutDashboard, LogOut, MapPin, Menu, Moon, Plus, Receipt, Sparkles, Sprout, Store, Sun, Wheat, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { notificationService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '../hooks/useQuery';
import { useTheme } from '../hooks/useTheme';
import type { Role } from '../types';
import { Loading } from './ui';
import { Footer } from './Footer';

interface Item { to: string; label: string; icon: ReactNode; end?: boolean; badge?: boolean }

const NAV: Record<Role, Item[]> = {
  Farmer: [
    { to: '/farmer', label: 'Dashboard', icon: <LayoutDashboard size={19} />, end: true },
    { to: '/farmer/listings', label: 'My listings', icon: <Sprout size={19} /> },
    { to: '/farmer/transactions', label: 'Sales', icon: <Receipt size={19} /> },
    { to: '/farmer/insights', label: 'AI insights', icon: <Sparkles size={19} /> },
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
      <span className="brand-name">FarmBid</span>
    </div>
  );
}

/** Wraps every signed-in screen. Sends people to the right dashboard for their role. */
export function AppShell({ role }: { role: Role }) {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const unread = useQuery(() => notificationService.unreadCount(), [user?.userId]);
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close the side menu when the page changes, and with the Esc key.
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    if (!menu) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'Farmer' ? '/farmer' : '/buyer'} replace />;

  const count = unread.data ?? 0;
  const items = NAV[role];
  const out = () => {
    logout();
    navigate('/login', { replace: true });
  };
  const bell = `/${role.toLowerCase()}/notifications`;
  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  const initials = user.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <div className="app">
      <header className="topnav">
        <div className="topnav-in">
          <button className="icon-btn menu-btn" onClick={() => setMenu(true)} aria-label="Open menu" aria-expanded={menu} title="Menu"><Menu size={20} /></button>
          <Brand />
          <nav className="topnav-links" aria-label="Main">
            {items.filter((i) => !i.badge).map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end}>
                {i.icon}
                {i.label}
              </NavLink>
            ))}
          </nav>
          <div className="topnav-tools">
            <NavLink to={bell} className="icon-btn" aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'} title="Notifications">
              <Bell size={19} />
              {count > 0 && <span className="count">{count}</span>}
            </NavLink>
            <button className="icon-btn" onClick={toggle} aria-label={themeLabel} title={themeLabel}>
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <div className="usermenu">
              <span className="avatar">{initials}</span>
              <div className="who">
                <div className="name">{user.fullName}</div>
                <div className="role">{role === 'Farmer' ? user.farmName ?? 'Farmer' : user.buyerType ?? 'Buyer'}</div>
              </div>
              <button className="icon-btn out" onClick={out} aria-label="Log out" title="Log out"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>
      <div className="awning" aria-hidden="true" />

      <div className={`drawer-backdrop${menu ? ' open' : ''}`} onClick={() => setMenu(false)} aria-hidden="true" />
      <aside className={`drawer${menu ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!menu} inert={!menu}>
        <div className="drawer-head">
          <Brand />
          <button ref={closeRef} className="icon-btn" onClick={() => setMenu(false)} aria-label="Close menu"><X size={18} /></button>
        </div>

        <div className="drawer-me">
          <span className="avatar">{initials}</span>
          <div>
            <div className="name">{user.fullName}</div>
            <div className="role">{role === 'Farmer' ? user.farmName ?? 'Farmer' : user.buyerType ?? 'Buyer'}</div>
            {user.location && <div className="loc"><MapPin size={13} /> {user.location}</div>}
          </div>
        </div>

        <div className="drawer-sec">Quick action</div>
        {role === 'Farmer' ? (
          <NavLink className="btn mango block" to="/farmer/listings?new=1"><Plus size={18} /> New listing</NavLink>
        ) : (
          <NavLink className="btn mango block" to="/buyer/browse"><Store size={18} /> Browse harvests</NavLink>
        )}

        <div className="drawer-sec">Settings</div>
        <button className="drawer-row" onClick={toggle} role="switch" aria-checked={theme === 'dark'}>
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          <span>Dark mode</span>
          <span className={`switch${theme === 'dark' ? ' on' : ''}`} aria-hidden="true" />
        </button>

        <div className="drawer-sec">Help</div>
        <details className="drawer-help">
          <summary><HelpCircle size={18} /> How bidding works <ChevronDown size={16} className="chev" /></summary>
          <ol>
            <li>A farmer posts a harvest with a grade and a starting price.</li>
            <li>Buyers place bids. Nobody can bid below the starting price.</li>
            <li>The farmer picks one offer. A sale is created and the other offers are rejected.</li>
            <li>Once the sale is completed, the buyer can rate the farmer.</li>
          </ol>
        </details>

        <div className="drawer-foot">
          <button className="drawer-row" onClick={out}><LogOut size={18} /> <span>Log out</span></button>
        </div>
      </aside>

      <div className="main">
        <header className="mtop">
          <div className="row" style={{ gap: 6 }}>
            <button className="btn ghost sm" style={{ color: '#fff', paddingInline: 8 }} onClick={() => setMenu(true)} aria-label="Open menu"><Menu size={20} /></button>
            <Brand />
          </div>
          <div className="row" style={{ gap: 4 }}>
            <NavLink to={bell} className="btn ghost sm mtop-bell" style={{ color: '#fff' }} aria-label="Notifications">
              <Bell size={18} />
              {count > 0 && <span className="count">{count}</span>}
            </NavLink>
            <button className="btn ghost sm" style={{ color: '#fff' }} onClick={toggle} aria-label={themeLabel}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn ghost sm" style={{ color: '#fff' }} onClick={out} aria-label="Log out"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="page"><Outlet /></main>
        <Footer role={role} />
        <nav className="tabbar" aria-label="Main">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end}>
              {i.icon}
              <span>{i.label.replace('Browse harvests', 'Browse').replace('My listings', 'Listings').replace('AI insights', 'Insights')}</span>
              {i.badge && count > 0 && <span className="count">{count}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
