import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { resetDemoData } from '../api';
import { useAuth } from '../context/AuthContext';
import { Brand } from '../components/Layout';
import { ErrorBanner, PriceTag } from '../components/ui';

export function AuthHero() {
  return (
    <section className="auth-hero on-dark">
      <Brand />
      <div>
        <h1> Harvests. Bid. Prosper.</h1>
        <p>Farmers list what they grew. Buyers name their price. The best offer wins, with no middleman taking a cut.</p>
      </div>
      <div className="ticker" aria-hidden="true">
        <div className="tick"><div><b>Rice (Jasmine)</b><span>Nueva Ecija · 500 kg</span></div><PriceTag amount={46.5} unit="kg" /></div>
        <div className="tick"><div><b>Mango (Carabao)</b><span>Guimaras · 300 kg</span></div><PriceTag amount={90} unit="kg" /></div>
        <div className="tick"><div><b>Tomato</b><span>Benguet · 200 kg</span></div><PriceTag amount={38} unit="kg" /></div>
      </div>
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
            <h2>Log in</h2>
            <p className="muted" style={{ marginTop: 6 }}>Use the account you registered as a farmer or buyer.</p>
          </div>
          {notice?.registered && (
            <div className="banner success" role="status"><CheckCircle2 size={18} /><span>Account created. Log in to continue.</span></div>
          )}
          {error && <ErrorBanner message={error} />}
          <form className="stack" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="pw">Password</label>
              <div className="input-affix">
                <input id="pw" type={show ? 'text' : 'password'} autoComplete="current-password" className="input" style={{ paddingLeft: 12 }} value={password} onChange={(e) => setPassword(e.target.value)} />
                <span className="affix-end">
                  <button type="button" className="btn ghost icon" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </div>
            </div>
            <button className="btn primary block" disabled={busy}>{busy && <span className="spinner" />} Log in</button>
          </form>
          <p className="muted">New here? <Link to="/register">Create an account</Link></p>

          <div className="demo-box">
            <div className="small strong">Demo accounts</div>
            <div className="small muted">Password for both is demo1234. Data is stored in this browser only.</div>
            <div className="row">
              <button className="btn secondary sm" onClick={() => fill('farmer@demo.com')}>Fill farmer</button>
              <button className="btn secondary sm" onClick={() => fill('buyer@demo.com')}>Fill buyer</button>
              <button className="btn ghost sm" onClick={() => { resetDemoData(); fill(''); setPassword(''); }}>Reset demo data</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
