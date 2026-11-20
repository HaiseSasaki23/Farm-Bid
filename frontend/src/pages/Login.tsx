import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, Handshake, ShieldCheck, Leaf, Mail, Lock, LogIn, Users, Tractor, ShoppingCart, RotateCcw } from 'lucide-react';
import { resetDemoData } from '../api';
import { useAuth } from '../context/AuthContext';
import { Brand } from '../components/Layout';
import { ErrorBanner } from '../components/ui';

export function AuthHero() {
  return (
    <section className="auth-hero on-dark">
      <Brand />
      <div>
        <h1>Harvests. Bid. <em>Prosper.</em></h1>
        <p>Farmers list what they grow. Buyers name their price. The best offer wins, with no middleman taking a cut.</p>
      </div>
      <ul className="auth-perks">
        <li><span className="ico"><Handshake size={20} /></span><div><b>Fair bidding</b><small>Get the best price</small></div></li>
        <li><span className="ico"><ShieldCheck size={20} /></span><div><b>Trusted platform</b><small>Safe and secure</small></div></li>
        <li><span className="ico"><Leaf size={20} /></span><div><b>Support farmers</b><small>Grow together</small></div></li>
      </ul>
    </section>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const notice = (loc.state as { registered?: boolean; email?: string } | null) ?? null;

  const [email, setEmail] = useState(notice?.email ?? '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'Farmer' ? '/farmer' : '/buyer'} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      const u = await login(email, password);
      navigate(u.role === 'Farmer' ? '/farmer' : '/buyer', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const fill = (e: string) => {
    setEmail(e);
    setPassword('demo1234');
    setError(null);
  };

  return (
    <div className="auth">
      <AuthHero />
      <div className="auth-form">
        <div className="auth-card stack-lg" style={{ gap: 22 }}>
          <div>
            <span className="auth-logo" aria-hidden="true"><Leaf size={26} /></span>
            <h2>Log in</h2>
            <p className="muted" style={{ marginTop: 6 }}>Use the account you registered as a farmer or buyer.</p>
          </div>
          {notice?.registered && (
            <div className="banner success" role="status"><CheckCircle2 size={18} /><span>Account created. Log in to continue.</span></div>
          )}
          {error && <ErrorBanner message={error} />}
          <form className="stack" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="email"><Mail size={16} /> Email</label>
              <input id="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="pw"><Lock size={16} /> Password</label>
              <div className="input-affix">
                <input id="pw" type={show ? 'text' : 'password'} autoComplete="current-password" className="input" style={{ paddingLeft: 18 }} value={password} onChange={(e) => setPassword(e.target.value)} />
                <span className="affix-end">
                  <button type="button" className="btn ghost icon" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </div>
            </div>
            <button className="btn primary block" disabled={busy}>{busy ? <span className="spinner" /> : <LogIn size={18} />} Log in</button>
          </form>
          <p className="muted">New here? <Link to="/register">Create an account</Link></p>

          <div className="demo-box">
            <div className="small strong"><Users size={15} /> Demo accounts</div>
            <div className="small muted">Password for both is demo1234. Data is stored in this browser only.</div>
            <div className="row">
              <button className="btn secondary sm" onClick={() => fill('farmer@demo.com')}><Tractor size={15} /> Fill farmer</button>
              <button className="btn secondary sm" onClick={() => fill('buyer@demo.com')}><ShoppingCart size={15} /> Fill buyer</button>
              <button className="btn ghost sm" onClick={() => { resetDemoData(); fill(''); setPassword(''); }}><RotateCcw size={15} /> Reset demo data</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}