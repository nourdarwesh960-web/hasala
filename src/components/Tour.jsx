import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';
const TOUR_STEPS = [
  { key: 'welcome',    titleKey: 'tour.welcome',    descKey: 'tour.welcomeDesc',    selector: null },
  { key: 'balance',    titleKey: 'tour.balance',    descKey: 'tour.balanceDesc',    selector: '[data-tour="balance"]' },
  { key: 'surplus',    titleKey: 'tour.surplus',    descKey: 'tour.surplusDesc',    selector: '[data-tour="surplus"]',    optional: true },
  { key: 'upcoming',   titleKey: 'tour.upcoming',   descKey: 'tour.upcomingDesc',   selector: '[data-tour="upcoming"]',   optional: true },
  { key: 'categories', titleKey: 'tour.categories', descKey: 'tour.categoriesDesc', selector: '[data-tour="categories"]', optional: true },
  { key: 'goals',      titleKey: 'tour.goals',      descKey: 'tour.goalsDesc',      selector: '[data-tour="goals"]',      optional: true },
  { key: 'chat',       titleKey: 'tour.chat',       descKey: 'tour.chatDesc',       selector: '[data-tour="chat"]' },
];
export function Tour() {
  const { t, state, update } = useApp();
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);
  const availableSteps = TOUR_STEPS.filter((s) => {
    if (!s.optional) return true;
    if (!s.selector) return true;
    if (typeof document === 'undefined') return false;
    return !!document.querySelector(s.selector);
  });
  useEffect(() => {
    if (!state.onboarded) return;
    if (state.tourDone) return;
    const timer = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(timer);
  }, [state.onboarded, state.tourDone]);
  const currentStep = availableSteps[stepIdx];
  useEffect(() => {
    if (!visible || !currentStep) return;
    if (!currentStep.selector) {
      setRect(null);
      return;
    }
    const findElement = () => {
      const el = document.querySelector(currentStep.selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setRect(null);
      }
    };
    findElement();
    const timer = setTimeout(findElement, 350);
    window.addEventListener('resize', findElement);
    window.addEventListener('scroll', findElement, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', findElement);
      window.removeEventListener('scroll', findElement, true);
    };
  }, [visible, currentStep, stepIdx]);
  const finish = () => {
    setVisible(false);
    update((s) => ({ tourDone: true }));
  };
  const skip = () => {
    setVisible(false);
    update((s) => ({ tourDone: true }));
  };
  const next = () => {
    if (stepIdx >= availableSteps.length - 1) finish();
    else setStepIdx((i) => i + 1);
  };
  const prev = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };
  if (!visible || !currentStep) return null;
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === availableSteps.length - 1;
  const tooltipStyle = () => {
    if (!rect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(440px, calc(100vw - 32px))' };
    }
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const isMobile = vw < 640;
    if (isMobile) {
      const spaceBelow = vh - (rect.top + rect.height);
      if (spaceBelow > 280) {
        return { top: rect.top + rect.height + 16, left: 16, right: 16 };
      } else {
        return { bottom: vh - rect.top + 16, left: 16, right: 16 };
      }
    }
    const tooltipWidth = 400;
    const spaceRight = vw - (rect.left + rect.width);
    if (spaceRight > tooltipWidth + 40) {
      return {
        top: Math.max(16, Math.min(rect.top, vh - 340)),
        left: rect.left + rect.width + 20,
        width: tooltipWidth,
      };
    }
    return {
      top: Math.max(16, Math.min(rect.top, vh - 340)),
      left: Math.max(16, rect.left - tooltipWidth - 20),
      width: tooltipWidth,
    };
  };
  const style = tooltipStyle();
  return (
    <>
      <div
        className="fixed inset-0 z-[200] anim-fade"
        style={{
          background: rect ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(4px)',
        }}
      />
      {rect && (
        <div
          className="fixed z-[201] pointer-events-none rounded-2xl"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 4px rgba(46, 213, 150, 0.8), 0 0 0 9999px rgba(0,0,0,0.7), 0 0 40px rgba(46, 213, 150, 0.5)',
            transition: 'all 0.35s cubic-bezier(.22,1,.36,1)',
          }}
        />
      )}
      <div
        className="fixed z-[202] bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden anim-scale"
        style={{ ...style, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(46,213,150,0.25)' }}
      >
        <div className="px-5 py-4 border-b border-line"
          style={{ background: 'linear-gradient(135deg, rgba(14,159,110,.15) 0%, rgba(124,58,237,.1) 100%)' }}>
          <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1">
            {t('tour.step', { n: stepIdx + 1, t: availableSteps.length })}
          </div>
          <h3 className="text-[16px] font-extrabold text-ink leading-tight">{t(currentStep.titleKey)}</h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-[13.5px] leading-relaxed text-muted">{t(currentStep.descKey)}</p>
        </div>
        <div className="px-5 pb-3 flex items-center gap-1.5">
          {availableSteps.map((_, i) => (
            <div key={i} className={'h-1.5 rounded-full transition-all duration-300 ' +
              (i === stepIdx ? 'w-6 bg-accent' : i < stepIdx ? 'w-1.5 bg-accent/50' : 'w-1.5 bg-line')} />
          ))}
        </div>
        <div className="px-5 pb-5 space-y-2">
          <div className="flex gap-2">
            {!isFirst && (
              <button onClick={prev}
                className="press h-11 px-4 rounded-xl border border-line text-[13px] font-bold text-muted hover:text-ink hover:bg-surface2 transition shrink-0 flex items-center gap-1.5">
                <Icon name="chevronRight" size={14} sw={2.4} className="flip" />
                <span>{t('tour.prev')}</span>
              </button>
            )}
            <button onClick={next}
              className="press grow h-11 rounded-xl bg-accent text-white dark:text-[#04150E] font-extrabold text-[13.5px] flex items-center justify-center gap-2 shadow-lg shadow-accent/25">
              <span>{isLast ? t('tour.done') : t('tour.next')}</span>
              <Icon name="chevronRight" size={15} sw={2.6} className="flip" />
            </button>
          </div>
          <button onClick={skip}
            className="press w-full h-10 rounded-xl text-[12.5px] font-semibold text-muted hover:text-ink hover:bg-surface2 transition flex items-center justify-center gap-1.5">
            <span>{t('tour.skip')}</span>
            <Icon name="x" size={13} sw={2.4} />
          </button>
        </div>
      </div>
    </>
  );
}