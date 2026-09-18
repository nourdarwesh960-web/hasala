import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { demoState, blankState } from '../lib/demo';
import { Card, Btn, Input, Field } from './ui';
import { resizeImage } from '../lib/utils';
import { logout } from '../lib/auth';
import { Icon } from './Icon';
export function Onboarding() {
  const { state, update, t, lang } = useApp();
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file, 256);
      setPhoto(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };
  const finish = (withDemo) => {
    const profile = { name, photo };
    const next = withDemo
      ? { ...demoState(), profile }
      : { ...blankState(), onboarded: true, profile };
    update(() => next);
  };
  return (
    <div className="min-h-screen bg-bg text-ink grid place-items-center p-5">
      <div className="w-full max-w-md anim-rise">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-accent grid place-items-center text-white dark:text-[#04150E]">
            <Icon name="piggy" size={26} sw={1.9} />
          </div>
          <div>
            <div className="text-[22px] font-extrabold leading-none">{t('app.name')}</div>
            <div className="text-[12px] text-muted mt-1">{t('app.tagline')}</div>
          </div>
        </div>
        <Card className="p-6">
          <h1 className="text-[19px] font-bold mb-1">{t('onb.title')}</h1>
          <p className="text-[14px] text-muted mb-6">{t('onb.sub')}</p>
          <div className="flex items-center gap-4 mb-5">
            <label className="press cursor-pointer relative shrink-0">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <div className="w-20 h-20 rounded-2xl bg-surface2 border-2 border-dashed border-line grid place-items-center overflow-hidden hover:border-accent transition">
                {photo ? (
                  <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <div className="text-accent text-[22px] font-bold">+</div>
                    <div className="text-[9px] text-muted mt-0.5">{lang === 'ar' ? 'صورة' : 'Photo'}</div>
                  </div>
                )}
              </div>
            </label>
            <div className="grow">
              <Field label={t('onb.name')}>
                <Input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثلاً: نور' : 'e.g. Nour'} />
              </Field>
              {photo && (
                <button onClick={() => setPhoto(null)}
                  className="press text-[11px] text-muted hover:text-danger mt-1.5">
                  {lang === 'ar' ? 'شيل الصورة' : 'Remove photo'}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <button onClick={() => finish(true)}
              className="press w-full text-start p-4 rounded-2xl border border-line bg-surface2 hover:border-accent transition flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accentSoft text-accent grid place-items-center shrink-0">
                <Icon name="sparkles" size={20} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[15px]">{t('onb.demo')}</div>
                <div className="text-[12.5px] text-muted mt-0.5">{t('onb.demoSub')}</div>
              </div>
            </button>
            <button onClick={() => finish(false)}
              className="press w-full text-start p-4 rounded-2xl border border-line bg-surface2 hover:border-accent transition flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface text-muted grid place-items-center shrink-0 border border-line">
                <Icon name="plus" size={20} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[15px]">{t('onb.blank')}</div>
                <div className="text-[12.5px] text-muted mt-0.5">{t('onb.blankSub')}</div>
              </div>
            </button>
          </div>
        </Card>
        <div className="flex justify-center mt-6 gap-4">
          <button onClick={() => update({ settings: { ...state.settings, lang: lang === 'ar' ? 'en' : 'ar' } })}
            className="press text-[13px] text-muted hover:text-ink flex items-center gap-2">
            <Icon name="globe" size={15} />
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
          <button onClick={() => { logout(); window.location.reload(); }}
            className="press text-[13px] text-muted hover:text-danger flex items-center gap-2">
            <Icon name="x" size={14} />
            {lang === 'ar' ? 'خروج' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}