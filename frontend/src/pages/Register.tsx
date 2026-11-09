import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api';
import type { Role } from '../types';
import { BUYER_TYPES, PROVINCES } from '../lib/format';
import { ErrorBanner } from '../components/ui';
import { AuthHero } from './Login';

type Errors = Record<string, string>;

export function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('Farmer');
  const [f, setF] = useState({ fullName: '', email: '', password: '', confirm: '', farmName: '', buyerType: BUYER_TYPES[0], location: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const errs: Errors = {};
    if (!f.fullName.trim()) errs.fullName = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) errs.email = 'Enter a valid email, like name@example.com.';
    if (f.password.length < 8) errs.password = 'Use at least 8 characters.';
    if (f.confirm !== f.password) errs.confirm = 'Passwords do not match.';
    if (!f.location.trim()) errs.location = 'Enter your province or city.';
    if (role === 'Farmer' && !f.farmName.trim()) errs.farmName = 'Enter your farm name.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await authService.register({
        fullName: f.fullName, email: f.email, password: f.password, role, location: f.location,
        farmName: role === 'Farmer' ? f.farmName : undefined,
        buyerType: role === 'Buyer' ? f.buyerType : undefined,
      });
      navigate('/login', { state: { registered: true, email: f.email.trim().toLowerCase() } });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not create the account. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const err = (k: string) => (errors[k] ? <span className="error-text">{errors[k]}</span> : null);
  const cls = (k: string) => `input ${errors[k] ? 'invalid' : ''}`;

  return (
    <div className="auth">
      <AuthHero />
      <div className="auth-form">
        <div className="auth-card stack-lg" style={{ gap: 20 }}>
          <div>
            <h2>Create your account</h2>
            <p className="muted" style={{ marginTop: 6 }}>Your role decides what you see after you log in.</p>
          </div>
          {serverError && <ErrorBanner message={serverError} />}
          <form className="stack" onSubmit={submit} noValidate>
            <div className="field">
              <span className="label" id="role-l">I am a</span>
              <div className="seg" role="group" aria-labelledby="role-l">
                <button type="button" aria-pressed={role === 'Farmer'} onClick={() => setRole('Farmer')}><strong>Farmer</strong><span>List harvests, review bids</span></button>
                <button type="button" aria-pressed={role === 'Buyer'} onClick={() => setRole('Buyer')}><strong>Buyer</strong><span>Browse harvests, place bids</span></button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" className={cls('fullName')} autoComplete="name" value={f.fullName} onChange={(e) => set('fullName', e.target.value)} />
              {err('fullName')}
            </div>
            <div className="field">
              <label htmlFor="em">Email</label>
              <input id="em" type="email" autoComplete="email" className={cls('email')} value={f.email} onChange={(e) => set('email', e.target.value)} />
              {err('email')}
            </div>
            {role === 'Farmer' ? (
              <div className="field">
                <label htmlFor="farm">Farm name</label>
                <input id="farm" className={cls('farmName')} value={f.farmName} onChange={(e) => set('farmName', e.target.value)} />
                {err('farmName')}
              </div>
            ) : (
              <div className="field">
                <label htmlFor="bt">Buyer type</label>
                <select id="bt" className="select" value={f.buyerType} onChange={(e) => set('buyerType', e.target.value)}>
                  {BUYER_TYPES.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
            )}
            <div className="field">
              <label htmlFor="lc">Location</label>
              <input id="lc" list="prov" className={cls('location')} value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Province or city" />
              <datalist id="prov">{PROVINCES.map((p) => <option key={p} value={p} />)}</datalist>
              {err('location')}
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="p1">Password</label>
                <input id="p1" type="password" autoComplete="new-password" className={cls('password')} value={f.password} onChange={(e) => set('password', e.target.value)} />
                {err('password')}
              </div>
              <div className="field">
                <label htmlFor="p2">Confirm password</label>
                <input id="p2" type="password" autoComplete="new-password" className={cls('confirm')} value={f.confirm} onChange={(e) => set('confirm', e.target.value)} />
                {err('confirm')}
              </div>
            </div>
            <button className="btn primary block" disabled={busy}>{busy && <span className="spinner" />} Create account</button>
          </form>
          <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}
