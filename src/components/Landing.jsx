import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';
import { ThemeToggle } from './ThemeToggle';
function Coin({ size = 40, hue = '#F59E0B' }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full" style={{ background: hue }} />
      <div className="absolute inset-[3px] rounded-full" style={{ background: hue + 'CC' }} />
      <div className="absolute inset-[6px] rounded-full border-2" style={{ borderColor: hue + 'FF', background: 'transparent' }} />
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-white font-extrabold" style={{ fontSize: size * 0.42, lineHeight: 1 }}>$</div>
      </div>
    </div>
  );
}
function Gem({ size = 36, hue = '#0891B2' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <polygon points="20,2 34,14 34,26 20,38 6,26 6,14" fill={hue} />
      <polygon points="20,2 34,14 26,20 14,20 6,14" fill={hue} opacity="0.7" />
      <polygon points="14,20 26,20 20,38" fill={hue} opacity="0.5" />
      <polygon points="20,2 26,20 14,20" fill="white" opacity="0.25" />
    </svg>
  );
}
export function Landing({ onStart, onLogin, isAuthenticated }) {
  const { t, lang, update } = useApp();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);
  const toggleLang = () => update((s) => ({ settings: { ...s.settings, lang: lang === 'ar' ? 'en' : 'ar' } }));
  const scrollToFeatures = () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  const features = [
    { icon: 'wallet', title: t('landing.f1Title'), desc: t('landing.f1Desc'), color: '#0E9F6E' },
    { icon: 'target', title: t('landing.f2Title'), desc: t('landing.f2Desc'), color: '#7C3AED' },
    { icon: 'pie', title: t('landing.f3Title'), desc: t('landing.f3Desc'), color: '#2563EB' },
    { icon: 'chart', title: t('landing.f4Title'), desc: t('landing.f4Desc'), color: '#DB2777' },
    { icon: 'repeat', title: t('landing.f5Title'), desc: t('landing.f5Desc'), color: '#EA580C' },
    { icon: 'credit', title: t('landing.f6Title'), desc: t('landing.f6Desc'), color: '#0891B2' },
  ];
  const steps = [
    { n: '1', title: t('landing.s1Title'), desc: t('landing.s1Desc'), icon: 'wallet' },
    { n: '2', title: t('landing.s2Title'), desc: t('landing.s2Desc'), icon: 'list' },
    { n: '3', title: t('landing.s3Title'), desc: t('landing.s3Desc'), icon: 'chart' },
  ];
  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[80px]"
          style={{
            background: 'var(--accent)',
            top: '-100px',
            [lang === 'ar' ? 'right' : 'left']: '-100px',
            transform: 'translate(' + (mouse.x * 30) + 'px, ' + (mouse.y * 30) + 'px)',
          }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.08] blur-[80px]"
          style={{
            background: '#7C3AED',
            bottom: '-100px',
            [lang === 'ar' ? 'left' : 'right']: '-50px',
            transform: 'translate(' + (mouse.x * -20) + 'px, ' + (mouse.y * -20) + 'px)',
          }} />
      </div>
      <header className="relative z-10 flex items-center justify-between p-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-accent grid place-items-center text-white dark:text-[#04150E] float-3d">
            <Icon name="wallet" size={22} sw={1.9} />
          </div>
          <div>
            <div className="text-[16px] font-extrabold leading-none">{t('app.name')}</div>
            <div className="text-[10px] text-muted mt-0.5">{t('app.tagline')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={toggleLang}
            className="press h-9 px-3.5 rounded-xl bg-surface2 border border-line text-[12.5px] font-bold text-muted hover:text-ink transition">
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>
          {isAuthenticated ? (
            <button onClick={onOpenApp}
              className="press h-9 px-4 rounded-xl bg-accent text-white dark:text-[#04150E] text-[12.5px] font-bold flex items-center gap-1.5 shadow-lg shadow-accent/25">
              <Icon name="wallet" size={14} sw={2.4} />
              {lang === 'ar' ? 'افتح الحصالة' : 'Open Hasala'}
            </button>
          ) : (
            <button onClick={onLogin}
              className="press h-9 px-4 rounded-xl bg-surface2 border border-line text-[12.5px] font-bold text-ink hover:border-accent transition">
              {lang === 'ar' ? 'تسجيل دخول' : 'Login Now'}
            </button>
          )}
        </div>
      </header>
      <section className="relative z-10 px-5 pt-6 sm:pt-10 pb-16 sm:pb-20 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div className="anim-rise">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accentSoft text-accent text-[12px] font-bold mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {t('landing.badge')}
            </div>
            <h1 className="text-[40px] sm:text-[52px] lg:text-[64px] font-extrabold leading-[1.05] tracking-tight mb-5">
              {t('landing.heroLine1')}
              <br />
              <span className="bg-gradient-to-r from-accent to-[#7C3AED] bg-clip-text text-transparent">
                {t('landing.heroLine2')}
              </span>
            </h1>
            <p className="text-[15px] sm:text-[17px] text-muted leading-relaxed mb-8 max-w-lg">
              {t('landing.heroSub')}
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onStart}
                className="press group h-12 sm:h-14 px-6 sm:px-7 rounded-2xl bg-accent text-white dark:text-[#04150E] font-extrabold text-[14px] sm:text-[15px] flex items-center gap-2 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/40 transition-all shine-sweep">
                {isAuthenticated
                  ? (lang === 'ar' ? 'افتح الحصالة' : 'Open Hasala')
                  : t('landing.ctaPrimary')}
                <Icon name="arrowRight" size={18} sw={2.4} className="flip group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={scrollToFeatures}
                className="press h-12 sm:h-14 px-5 sm:px-6 rounded-2xl bg-surface border border-line font-bold text-[13px] sm:text-[14px] text-ink flex items-center gap-2 hover:bg-surface2 transition tilt-3d">
                {t('landing.ctaSecondary')}
              </button>
            </div>
            <div className="flex items-center gap-6 mt-8 pt-6 border-t border-line/60">
              <div>
                <div className="text-[20px] font-extrabold num">100%</div>
                <div className="text-[11px] text-muted">{t('landing.stat1')}</div>
              </div>
              <div>
                <div className="text-[20px] font-extrabold num">6+</div>
                <div className="text-[11px] text-muted">{t('landing.stat2')}</div>
              </div>
              <div>
                <div className="text-[20px] font-extrabold num">∞</div>
                <div className="text-[11px] text-muted">{t('landing.stat3')}</div>
              </div>
            </div>
          </div>
          <div className="relative h-[400px] sm:h-[520px] flex items-center justify-center"
            style={{ perspective: '1200px' }}>
            <div className="absolute w-[300px] sm:w-[380px] h-[300px] sm:h-[380px] rounded-full opacity-30 blur-[70px] bg-accent pointer-events-none" />
            <div className="absolute w-[220px] sm:w-[260px] h-[220px] sm:h-[260px] rounded-full opacity-20 blur-[60px] bg-[#7C3AED] pointer-events-none"
              style={{ transform: 'translate(60px, 40px)' }} />
            <div className="relative z-20 landing-piggy select-none"
              style={{
                transform: 'translate(' + (mouse.x * 15) + 'px, ' + (mouse.y * 15) + 'px)',
                filter: 'drop-shadow(0 30px 60px rgba(0,0,0,.35))',
              }}>
              <img
                src="/mascot.png"
                alt="El-Hasala Mascot"
                draggable="false"
                className="w-[280px] sm:w-[380px] lg:w-[440px] h-auto"
              />
            </div>
            <div className="absolute landing-coin-1" style={{ top: '6%', left: '6%' }}>
              <Coin size={52} hue="#F59E0B" />
            </div>
            <div className="absolute landing-coin-2" style={{ top: '14%', right: '4%' }}>
              <Gem size={44} hue="#0891B2" />
            </div>
            <div className="absolute landing-coin-3" style={{ bottom: '12%', left: '4%' }}>
              <Coin size={40} hue="#0E9F6E" />
            </div>
            <div className="absolute landing-coin-4" style={{ bottom: '20%', right: '6%' }}>
              <Coin size={36} hue="#DB2777" />
            </div>
            <div className="absolute landing-coin-5" style={{ top: '48%', left: '-2%' }}>
              <Gem size={30} hue="#7C3AED" />
            </div>
            <div className="absolute landing-coin-6" style={{ top: '58%', right: '-2%' }}>
              <Coin size={34} hue="#EA580C" />
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="relative z-10 px-5 py-16 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface2 text-muted text-[12px] font-bold mb-4">
            <Icon name="sparkles" size={13} className="text-accent" />
            {t('landing.features')}
          </div>
          <h2 className="text-[30px] sm:text-[40px] font-extrabold leading-tight mb-3">
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-[14px] sm:text-[15px] text-muted max-w-xl mx-auto">
            {t('landing.featuresSub')}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i}
              className="group relative p-6 rounded-3xl border border-line bg-surface overflow-hidden tilt-3d shine-sweep"
              style={{ animation: 'riseIn .5s ' + (i * 0.08) + 's both cubic-bezier(.22,1,.36,1)' }}>
              <div className="absolute -top-16 -end-16 w-40 h-40 rounded-full opacity-[0.08] pointer-events-none transition-opacity group-hover:opacity-[0.18]"
                style={{ background: f.color }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl grid place-items-center mb-5 float-3d"
                  style={{ background: f.color + '1A', color: f.color }}>
                  <Icon name={f.icon} size={26} sw={2} />
                </div>
                <h3 className="text-[17px] font-extrabold mb-2">{f.title}</h3>
                <p className="text-[13.5px] text-muted leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="relative z-10 px-5 py-16 sm:py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface2 text-muted text-[12px] font-bold mb-4">
            <Icon name="sparkles" size={13} className="text-accent" />
            {t('landing.how')}
          </div>
          <h2 className="text-[30px] sm:text-[40px] font-extrabold leading-tight">
            {t('landing.howTitle')}
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="relative text-center"
              style={{ animation: 'riseIn .5s ' + (i * 0.15) + 's both cubic-bezier(.22,1,.36,1)' }}>
              <div className="relative inline-block mb-5">
                <div className="w-20 h-20 rounded-3xl bg-surface2 border border-line grid place-items-center text-accent float-3d">
                  <Icon name={s.icon} size={34} sw={1.9} />
                </div>
                <div className="absolute -top-2 -end-2 w-8 h-8 rounded-full bg-accent text-white dark:text-[#04150E] grid place-items-center text-[14px] font-extrabold shadow-lg">
                  {s.n}
                </div>
              </div>
              <h3 className="text-[17px] font-extrabold mb-2">{s.title}</h3>
              <p className="text-[13.5px] text-muted leading-relaxed max-w-[240px] mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="relative z-10 px-5 py-16 sm:py-20 max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-[32px] p-8 sm:p-14 text-center hero-3d shine-sweep"
          style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)' }}>
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute landing-coin-1" style={{ top: '10%', left: '10%' }}>
              <Coin size={52} hue="#FFFFFF" />
            </div>
            <div className="absolute landing-coin-2" style={{ bottom: '12%', right: '14%' }}>
              <Gem size={40} hue="#FFFFFF" />
            </div>
            <div className="absolute landing-coin-3" style={{ top: '20%', right: '10%' }}>
              <Coin size={44} hue="#FFFFFF" />
            </div>
          </div>
          <div className="relative">
            <div className="w-[120px] h-[120px] mx-auto mb-2 float-3d">
              <img src="/mascot.png" alt="Mascot" draggable="false"
                className="w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,.35)) brightness(1.05)' }} />
            </div>
            <h2 className="text-[28px] sm:text-[40px] font-extrabold text-white leading-tight mb-4">
              {t('landing.finalTitle')}
            </h2>
            <p className="text-[15px] sm:text-[16px] text-white/90 mb-8 max-w-md mx-auto">
              {t('landing.finalSub')}
            </p>
            <button onClick={onStart}
              className="press group h-12 sm:h-14 px-7 sm:px-8 rounded-2xl bg-white text-[14px] sm:text-[15px] font-extrabold text-ink inline-flex items-center gap-2 hover:shadow-2xl transition-all">
              {isAuthenticated
                ? (lang === 'ar' ? 'افتح الحصالة' : 'Open Hasala')
                : t('landing.startNow')}
              <Icon name="arrowRight" size={18} sw={2.4} className="flip group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
      <footer className="relative z-10 px-5 py-10 text-center text-[12px] text-muted">
        {t('landing.footer')}
      </footer>
    </div>
  );
}