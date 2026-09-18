import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { login } from '../lib/auth';
import { Icon } from '../components/Icon';
import '../styles/auth.css';
export function LoginPage({ onSuccess, onSwitchToRegister, onBack }) {
  const { lang, update, state } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [btnState, setBtnState] = useState('idle');
  const cardRef = useRef(null);
  const isDark =
    state.settings.theme === 'dark' ||
    (state.settings.theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  // =========================
  // PARALLAX
  // =========================
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const card = cardRef.current;
    if (!card) return;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let trx = 0;
    let tryy = 0;
    let crx = 0;
    let cryy = 0;
    let raf = null;
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      crx += (trx - crx) * 0.1;
      cryy += (tryy - cryy) * 0.1;
      card.style.setProperty('--rx', crx.toFixed(2) + 'deg');
      card.style.setProperty('--ry', cryy.toFixed(2) + 'deg');
      if (
        Math.abs(tx - cx) < 0.0005 &&
        Math.abs(ty - cy) < 0.0005
      ) {
        raf = null;
      } else {
        raf = requestAnimationFrame(loop);
      }
    };
    const onMove = (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tx = nx;
      ty = ny;
      trx = -ny * 7;
      tryy = nx * 9;
      const r = card.getBoundingClientRect();
      card.style.setProperty(
        '--mx',
        ((e.clientX - r.left) / r.width) * 100 + '%'
      );
      card.style.setProperty(
        '--my',
        ((e.clientY - r.top) / r.height) * 100 + '%'
      );
      if (!raf) {
        raf = requestAnimationFrame(loop);
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  // =========================
  // FIREFLIES + STARS
  // =========================
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const field = document.querySelector('.auth-fireflies');
    if (field) {
      field.innerHTML = '';
      for (let i = 0; i < 18; i++) {
        const f = document.createElement('span');
        f.className = 'auth-firefly';
        const s = 2 + Math.random() * 3;
        f.style.width = s + 'px';
        f.style.height = s + 'px';
        f.style.left = Math.random() * 100 + '%';
        f.style.top = Math.random() * 96 + '%';
        f.style.setProperty(
          '--dur',
          6 + Math.random() * 8 + 's'
        );
        f.style.setProperty(
          '--dx',
          (Math.random() * 2 - 1) * 42 + 'px'
        );
        f.style.setProperty(
          '--dy',
          (Math.random() * 2 - 1) * 42 + 'px'
        );
        f.style.animationDelay =
          -Math.random() * 10 + 's, ' +
          -Math.random() * 3 + 's';
        field.appendChild(f);
      }
    }
    const sky = document.querySelector('.auth-stars');
    if (sky) {
      sky.innerHTML = '';
      for (let i = 0; i < 30; i++) {
        const s = document.createElement('span');
        s.className = 'auth-star';
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 56 + '%';
        s.style.setProperty(
          '--tw',
          3 + Math.random() * 5 + 's'
        );
        s.style.animationDelay =
          -Math.random() * 6 + 's';
        sky.appendChild(s);
      }
    }
  }, []);
  // =========================
  // NORMAL LOGIN
  // =========================
  async function handleSubmit(e) {
    e.preventDefault();
    if (btnState !== 'idle') return;
    setError('');
    setStatus('');
    if (!email.trim() || !password) {
      setError(
        lang === 'ar'
          ? 'اكتب الإيميل والباسورد الأول.'
          : 'Please enter your email and password.'
      );
      return;
    }
    setBtnState('loading');
    const result = await login({
      email: email.trim(),
      password,
      remember,
    });
    if (!result.ok) {
      setBtnState('idle');
      let message;
      switch (result.error) {
        case 'user_not_found':
          message =
            lang === 'ar'
              ? 'الإيميل ده مش مسجل.'
              : 'This email is not registered.';
          break;
        case 'wrong_password':
          message =
            lang === 'ar'
              ? 'الباسورد غلط.'
              : 'Incorrect password.';
          break;
        case 'network':
          message =
            lang === 'ar'
              ? 'حصلت مشكلة في الاتصال بالسيرفر.'
              : 'A network error occurred.';
          break;
        default:
          message =
            lang === 'ar'
              ? 'حصل خطأ أثناء تسجيل الدخول.'
              : 'Login failed.';
      }
      setError(message);
      return;
    }
    setBtnState('success');
    setStatus(
      lang === 'ar'
        ? 'تم تسجيل الدخول بنجاح ✓'
        : 'Logged in successfully ✓'
    );
    setTimeout(() => {
      onSuccess?.(result.session);
    }, 700);
  }
  return (
    <div className={'auth-scene' + (isDark ? ' dark' : '')}>
      <div className="auth-bg" />
      <div className="auth-aurora" aria-hidden="true">
        <span className="band b1" />
        <span className="band b2" />
      </div>
      <div className="auth-stars" aria-hidden="true" />
      <div className="auth-fireflies" aria-hidden="true" />
      {onBack && (
        <button
          className="auth-back-btn"
          onClick={onBack}
          aria-label={lang === 'ar' ? 'رجوع' : 'Back'}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d={
                lang === 'ar'
                  ? 'M9 18l6-6-6-6'
                  : 'M15 18l-6-6 6-6'
              }
            />
          </svg>
        </button>
      )}
      <button
        className="auth-lang-btn"
        onClick={() =>
          update((s) => ({
            settings: {
              ...s.settings,
              lang: lang === 'ar' ? 'en' : 'ar',
            },
          }))
        }
      >
        {lang === 'ar' ? 'EN' : 'ع'}
      </button>
      <div className="auth-stage">
        <form
          className="auth-card"
          ref={cardRef}
          onSubmit={handleSubmit}
          noValidate
          autoComplete="off"
        >
          <span className="auth-sheen" aria-hidden="true" />
          <div className="auth-head">
            <div className="auth-logo">
              <Icon name="wallet" size={26} sw={2.2} />
            </div>
            <h1>
              {lang === 'ar'
                ? 'أهلاً بيك 👋'
                : 'Welcome back 👋'}
            </h1>
            <p className="sub">
              {lang === 'ar'
                ? 'سجّل دخولك عشان تكمل رحلتك المالية'
                : 'Sign in to continue your financial journey'}
            </p>
          </div>
          <div className="auth-field">
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder=" "
              autoComplete="email"
              name="hasala-login-email"
              required
              disabled={btnState !== 'idle'}
            />
            <label htmlFor="login-email">
              {lang === 'ar'
                ? 'البريد الإلكتروني'
                : 'Email'}
            </label>
          </div>
          <div className="auth-field">
            <input
              type={showPw ? 'text' : 'password'}
              id="login-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder=" "
              autoComplete="current-password"
              name="hasala-login-password"
              className="has-icon"
              required
              disabled={btnState !== 'idle'}
            />
            <label htmlFor="login-password">
              {lang === 'ar'
                ? 'كلمة المرور'
                : 'Password'}
            </label>
            <button
              type="button"
              className="auth-reveal"
              onClick={() => setShowPw((v) => !v)}
              aria-label={
                showPw
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              {showPw ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.6 6.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.2 6.3A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4-.9" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <div className="auth-row">
            <label className="auth-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) =>
                  setRemember(e.target.checked)
                }
              />
              <span className="auth-check-box" />
              <span>
                {lang === 'ar'
                  ? 'تذكرني'
                  : 'Remember me'}
              </span>
            </label>
            <button
              type="button"
              className="auth-link"
              style={{
                background: 'none',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={() =>
                alert(
                  lang === 'ar'
                    ? 'ميزة استعادة كلمة المرور هنضيفها قريبًا.'
                    : 'Password recovery will be added soon.'
                )
              }
            >
              {lang === 'ar'
                ? 'نسيت كلمة المرور؟'
                : 'Forgot password?'}
            </button>
          </div>
          {error && (
            <p className="auth-status error">
              {error}
            </p>
          )}
          {!error && status && (
            <p className="auth-status info">
              {status}
            </p>
          )}
          <button
            type="submit"
            className={
              'auth-btn' +
              (btnState !== 'idle'
                ? ' is-' + btnState
                : '')
            }
            disabled={btnState !== 'idle'}
          >
            <span className="auth-btn-label">
              {lang === 'ar'
                ? 'تسجيل الدخول'
                : 'Sign in'}
            </span>
            <span
              className="auth-btn-spinner"
              aria-hidden="true"
            />
            <svg
              className="auth-btn-check"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
          <p className="auth-foot">
            {lang === 'ar'
              ? 'لسه معندكش حساب؟'
              : "Don't have an account?"}{' '}
            <a
              href="#"
              className="auth-link"
              onClick={(e) => {
                e.preventDefault();
                onSwitchToRegister?.();
              }}
            >
              {lang === 'ar'
                ? 'إنشاء حساب'
                : 'Create account'}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
export default LoginPage;
