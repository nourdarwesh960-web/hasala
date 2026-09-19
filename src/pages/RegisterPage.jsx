import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { register } from '../lib/auth';
import { resizeImage } from '../lib/utils';
import { Icon } from '../components/Icon';
import '../styles/auth.css';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function RegisterPage({ onSwitchToLogin, onSuccess, onBack }) {
  const { t, lang, update, state } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [btnState, setBtnState] = useState('idle');
  const cardRef = useRef(null);
  const isDark = state.settings.theme === 'dark' ||
    (state.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  // Parallax
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const card = cardRef.current;
    if (!card) return;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let trx = 0, tryy = 0, crx = 0, cryy = 0;
    let raf = null;
    const loop = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      crx += (trx - crx) * 0.1; cryy += (tryy - cryy) * 0.1;
      card.style.setProperty('--rx', crx.toFixed(2) + 'deg');
      card.style.setProperty('--ry', cryy.toFixed(2) + 'deg');
      raf = (Math.abs(tx - cx) < 0.0005 && Math.abs(ty - cy) < 0.0005) ? null : requestAnimationFrame(loop);
    };
    const onMove = (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tx = nx; ty = ny; trx = -ny * 7; tryy = nx * 9;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);
  // Fireflies + stars
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const field = document.querySelector('.auth-fireflies');
    if (field) {
      field.innerHTML = '';
      for (let i = 0; i < 18; i++) {
        const f = document.createElement('span');
        f.className = 'auth-firefly';
        const s = 2 + Math.random() * 3;
        f.style.width = f.style.height = s + 'px';
        f.style.left = (Math.random() * 100) + '%';
        f.style.top = (Math.random() * 96) + '%';
        f.style.setProperty('--dur', (6 + Math.random() * 8) + 's');
        f.style.setProperty('--dx', ((Math.random() * 2 - 1) * 42) + 'px');
        f.style.setProperty('--dy', ((Math.random() * 2 - 1) * 42) + 'px');
        f.style.animationDelay = (-Math.random() * 10) + 's, ' + (-Math.random() * 3) + 's';
        field.appendChild(f);
      }
    }
    const sky = document.querySelector('.auth-stars');
    if (sky) {
      sky.innerHTML = '';
      for (let i = 0; i < 30; i++) {
        const s = document.createElement('span');
        s.className = 'auth-star';
        s.style.left = (Math.random() * 100) + '%';
        s.style.top = (Math.random() * 56) + '%';
        s.style.setProperty('--tw', (3 + Math.random() * 5) + 's');
        s.style.animationDelay = (-Math.random() * 6) + 's';
        sky.appendChild(s);
      }
    }
  }, []);
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file, 200);
      setPhoto(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };
  // ═══ التحقق من قوة الباسورد ═══
  const checkPassword = (pw) => {
    const checks = {
      length: pw.length >= 8,
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    let strength = 'weak';
    if (passed >= 5 && pw.length >= 10) strength = 'strong';
    else if (passed >= 4) strength = 'medium';
    return { checks, strength, passed };
  };
  const pwCheck = checkPassword(password);
  // ═══ التحقق من الحقول ═══
  const validate = () => {
    const errs = {};
    // الإيميل
    if (!email.trim()) {
      errs.email = lang === 'ar' ? 'اكتب الإيميل' : 'Email is required';
    } else if (!email.trim().toLowerCase().endsWith('@gmail.com')) {
      errs.email = lang === 'ar' ? 'لازم يكون إيميل Gmail (@gmail.com)' : 'Must be a Gmail address (@gmail.com)';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errs.email = lang === 'ar' ? 'اكتب إيميل صحيح' : 'Please enter a valid email address.';
    }
    // الباسورد
    if (!password) {
      errs.password = lang === 'ar' ? 'اكتب الباسورد' : 'Password is required';
    } else if (password.length < 8) {
      errs.password = lang === 'ar' ? 'الباسورد لازم يكون 8 حروف على الأقل' : 'Password must be at least 8 characters.';
    } else if (!pwCheck.checks.upper) {
      errs.password = lang === 'ar' ? 'لازم حرف كبير (A-Z)' : 'Must include uppercase letter (A-Z)';
    } else if (!pwCheck.checks.lower) {
      errs.password = lang === 'ar' ? 'لازم حرف صغير (a-z)' : 'Must include lowercase letter (a-z)';
    } else if (!pwCheck.checks.number) {
      errs.password = lang === 'ar' ? 'لازم رقم (0-9)' : 'Must include a number (0-9)';
    } else if (!pwCheck.checks.special) {
      errs.password = lang === 'ar' ? 'لازم رمز خاص (!@#$%)' : 'Must include special char (!@#$%)';
    }
    // تأكيد الباسورد
    if (!confirmPassword) {
      errs.confirmPassword = lang === 'ar' ? 'أكّد الباسورد' : 'Confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = lang === 'ar' ? 'الباسورد مش متطابق' : 'Passwords do not match.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const errorMsg = (code) => {
    const map = {
      'email_exists': 'auth.err.email_exists',
      'weak_password': 'auth.err.weak_password',
      'missing_fields': 'auth.err.missing_fields',
      'network': 'auth.err.network',
    };
    return t(map[code] || 'auth.err.unknown');
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (btnState !== 'idle') return;
    setError('');
    setStatus('');
    if (!validate()) return;
    setBtnState('loading');
    setStatus(lang === 'ar' ? 'بنجهز حسابك...' : 'Creating your account...');
    const result = await register({
      email: email.trim(),
      password,
      name: name.trim(),
      photo,
    });
    if (!result.ok) {
      setBtnState('idle');
      setStatus('');
      setError(errorMsg(result.error));
      return;
    }
    setBtnState('success');
    setStatus(t('auth.accountCreated'));
    setTimeout(() => {
      if (onSuccess) onSuccess(result.session);
    }, 900);
  };
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
          <Icon name={lang === 'ar' ? 'chevronRight' : 'chevronLeft'} size={18} sw={2} />
        </button>
      )}
      <button
        className="auth-lang-btn"
        onClick={() => update((s) => ({ settings: { ...s.settings, lang: lang === 'ar' ? 'en' : 'ar' } }))}
      >
        {lang === 'ar' ? 'EN' : 'ع'}
      </button>
      <div className="auth-stage">
        <form className="auth-card" ref={cardRef} onSubmit={handleSubmit} noValidate autoComplete="off">
          <span className="auth-sheen" aria-hidden="true" />
          <div className="auth-head">
            <div className="auth-logo">
              <Icon name="wallet" size={26} sw={2.2} />
            </div>
            <h1>{lang === 'ar' ? 'أنشئ حسابك' : 'Create account'}</h1>
            <p className="sub">{t('auth.registerSub')}</p>
          </div>
          {/* Photo */}
          <div className="auth-photo-wrap">
            <label className="auth-photo-label">
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhoto}
              />
              <div className="auth-photo-preview">
                {photo ? (
                  <img src={photo} alt="preview" />
                ) : (
                  <Icon name="plus" size={20} className="text-accent" />
                )}
              </div>
              <span className="auth-photo-badge">+</span>
            </label>
            <div style={{ flex: 1 }}>
              <div className={'auth-field' + (fieldErrors.name ? ' has-error' : '')}>
                <input
                  type="text"
                  id="reg-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder=" "
                  autoComplete="off"
                  name="hasala-reg-name"
                />
                <label htmlFor="reg-name">{t('auth.name')}</label>
              </div>
            </div>
          </div>
          {/* Email */}
          <div className={'auth-field' + (fieldErrors.email ? ' has-error' : '')}>
            <input
              type="email"
              id="reg-email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: '' })); }}
              placeholder="you@gmail.com"
              autoComplete="off"
              name="hasala-reg-email"
              inputMode="email"
              required
            />
            <label htmlFor="reg-email">{t('auth.email')}</label>
          </div>
          {fieldErrors.email && (
            <p className="auth-field-error">{fieldErrors.email}</p>
          )}
          {/* Password */}
          <div className={'auth-field' + (fieldErrors.password ? ' has-error' : '')}>
            <input
              type={showPw ? 'text' : 'password'}
              id="reg-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: '' })); }}
              placeholder=" "
              autoComplete="new-password"
              name="hasala-reg-password"
              className="has-icon"
              required
              minLength={8}
            />
            <label htmlFor="reg-password">{t('auth.password')}</label>
            <button
              type="button"
              className="auth-reveal"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPw ? (
                <Icon name="eyeOff" size={20} sw={1.8} />
              ) : (
                <Icon name="eye" size={20} sw={1.8} />
              )}
            </button>
          </div>
          {password && (
            <div className="auth-pw-strength">
              <div className="auth-pw-bars">
                <span className={'auth-pw-bar ' + (pwCheck.passed >= 1 ? 'on' : '')} />
                <span className={'auth-pw-bar ' + (pwCheck.passed >= 2 ? 'on' : '')} />
                <span className={'auth-pw-bar ' + (pwCheck.passed >= 3 ? 'on' : '')} />
                <span className={'auth-pw-bar ' + (pwCheck.passed >= 4 ? 'on' : '')} />
                <span className={'auth-pw-bar ' + (pwCheck.passed >= 5 ? 'on' : '')} />
              </div>
              <span className={'auth-pw-label ' + pwCheck.strength}>
                {pwCheck.strength === 'strong'
                  ? (lang === 'ar' ? 'قوي جدًا 💪' : 'Strong 💪')
                  : pwCheck.strength === 'medium'
                    ? (lang === 'ar' ? 'متوسط' : 'Medium')
                    : (lang === 'ar' ? 'ضعيف' : 'Weak')}
              </span>
            </div>
          )}
          {password && (
            <ul className="auth-pw-rules">
              <li className={pwCheck.checks.length ? 'ok' : ''}>
                {lang === 'ar' ? '8 حروف على الأقل' : '8+ characters'}
              </li>
              <li className={pwCheck.checks.upper ? 'ok' : ''}>
                {lang === 'ar' ? 'حرف كبير (A-Z)' : 'Uppercase (A-Z)'}
              </li>
              <li className={pwCheck.checks.lower ? 'ok' : ''}>
                {lang === 'ar' ? 'حرف صغير (a-z)' : 'Lowercase (a-z)'}
              </li>
              <li className={pwCheck.checks.number ? 'ok' : ''}>
                {lang === 'ar' ? 'رقم (0-9)' : 'Number (0-9)'}
              </li>
              <li className={pwCheck.checks.special ? 'ok' : ''}>
                {lang === 'ar' ? 'رمز خاص (!@#$)' : 'Special (!@#$)'}
              </li>
            </ul>
          )}
          {fieldErrors.password && (
            <p className="auth-field-error">{fieldErrors.password}</p>
          )}
          {/* Confirm Password */}
          <div className={'auth-field' + (fieldErrors.confirmPassword ? ' has-error' : '')}>
            <input
              type={showConfirm ? 'text' : 'password'}
              id="reg-confirm"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((f) => ({ ...f, confirmPassword: '' })); }}
              placeholder=" "
              autoComplete="new-password"
              name="hasala-reg-confirm"
              className="has-icon"
              required
            />
            <label htmlFor="reg-confirm">{lang === 'ar' ? 'تأكيد الباسورد' : 'Confirm Password'}</label>
            <button
              type="button"
              className="auth-reveal"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showConfirm ? (
                <Icon name="eyeOff" size={20} sw={1.8} />
              ) : (
                <Icon name="eye" size={20} sw={1.8} />
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="auth-field-error">{fieldErrors.confirmPassword}</p>
          )}
          <p style={{ fontSize: '0.72rem', opacity: 0.55, textAlign: 'center', marginTop: -4 }}>
            {t('auth.encryptNote')}
          </p>
          <button
            type="submit"
            className={'auth-btn' + (btnState !== 'idle' ? ' is-' + btnState : '')}
            disabled={btnState !== 'idle'}
          >
            <span className="auth-btn-label">{t('auth.register')}</span>
            <span className="auth-btn-spinner" aria-hidden="true" />
            <Icon name="check" size={18} sw={2.6} className="auth-btn-check" />
          </button>
          {error && <p className="auth-status error">{error}</p>}
          {!error && status && <p className="auth-status info">{status}</p>}
          <p className="auth-foot">
            {t('auth.haveAccount')}{' '}
            <a
              href="#"
              className="auth-link"
              onClick={(e) => { e.preventDefault(); onSwitchToLogin?.(); }}
            >
              {t('auth.goLogin')}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}


