import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { AuthHero } from './Login';
import { ErrorBanner } from '../components/ui';

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); setNotice(null);
    if (!email.trim() || !/^\d{6}$/.test(code.trim())) { setError('Enter your email and the 6-digit code.'); return; }
    setBusy(true);
    try {
      await authService.verifyEmail(email, code);
      navigate('/login', { state: { registered: true, email: email.trim() } });
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not verify this email.'); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    setError(null); setNotice(null);
    if (!email.trim()) { setError('Enter your email first.'); return; }
    setBusy(true);
    try { await authService.resendVerification(email); setNotice('A new verification code has been sent.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not resend the code.'); }
    finally { setBusy(false); }
  };

  return <div className="auth"><AuthHero /><div className="auth-form"><div className="auth-card stack-lg" style={{ gap: 20 }}>
    <div><h2>Verify your email</h2><p className="muted" style={{ marginTop: 6 }}>Enter the six-digit code we sent before you log in.</p></div>
    {error && <ErrorBanner message={error} />}{notice && <div className="banner success" role="status">{notice}</div>}
    <form className="stack" onSubmit={verify} noValidate>
      <div className="field"><label htmlFor="email">Email</label><input id="email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className="field"><label htmlFor="code">Verification code</label><input id="code" className="input" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} /></div>
      <button className="btn primary block" disabled={busy}>{busy && <span className="spinner" />} Verify email</button>
    </form>
    <button className="btn secondary block" onClick={resend} disabled={busy}>Resend code</button>
    <p className="muted">Already verified? <Link to="/login">Log in</Link></p>
  </div></div></div>;
}
