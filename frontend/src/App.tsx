import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppShell } from './components/Layout';
import { Empty, Loading } from './components/ui';
import { SearchX } from 'lucide-react';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Notifications } from './pages/Notifications';
import { Transactions } from './pages/Transactions';
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { MyListings } from './pages/farmer/MyListings';
import { ListingBids } from './pages/farmer/ListingBids';
import { BuyerDashboard } from './pages/buyer/BuyerDashboard';
import { Browse } from './pages/buyer/Browse';
import { ListingDetail } from './pages/buyer/ListingDetail';
import { MyBids } from './pages/buyer/MyBids';

function Home() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'Farmer' ? '/farmer' : '/buyer'} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/farmer" element={<AppShell role="Farmer" />}>
        <Route index element={<FarmerDashboard />} />
        <Route path="listings" element={<MyListings />} />
        <Route path="listings/:id/bids" element={<ListingBids />} />
        <Route path="transactions" element={<Transactions role="Farmer" />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="/buyer" element={<AppShell role="Buyer" />}>
        <Route index element={<BuyerDashboard />} />
        <Route path="browse" element={<Browse />} />
        <Route path="listings/:id" element={<ListingDetail />} />
        <Route path="bids" element={<MyBids />} />
        <Route path="transactions" element={<Transactions role="Buyer" />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route
        path="*"
        element={
          <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
            <Empty icon={<SearchX size={26} />} title="We can't find that page">
              The link may be old or mistyped.
              <br />
              <Link to="/">Go to your dashboard</Link>
            </Empty>
          </div>
        }
      />
    </Routes>
  );
}
