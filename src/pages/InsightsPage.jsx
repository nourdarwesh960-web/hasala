import { useApp } from '../context/AppContext';
import { Card, EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
export function InsightsPage() {
  const { t, categorizedInsights } = useApp();
  const categories = [
    { key: 'savings',  icon: 'piggy',    color: '#0E9F6E', label: t('ins.cat.savings') },
    { key: 'spending', icon: 'chart',    color: '#2563EB', label: t('ins.cat.spending') },
    { key: 'warnings', icon: 'bell',     color: '#DC2626', label: t('ins.cat.warnings') },
    { key: 'goals',    icon: 'target',   color: '#7C3AED', label: t('ins.cat.goals') },
    { key: 'credit',   icon: 'credit',   color: '#EA580C', label: t('ins.cat.credit') },
    { key: 'upcoming', icon: 'calendar', color: '#0891B2', label: t('ins.cat.upcoming') },
  ];
  const totalCount = Object.values(categorizedInsights).reduce((s, arr) => s + arr.length, 0);
  return (
    <div className="space-y-6 anim-rise">
      <div>
        <h1 className="text-[22px] font-extrabold">{t('ins.centerTitle')}</h1>
        <p className="text-[13px] text-muted mt-1">{t('ins.centerSub')}</p>
      </div>
      {totalCount === 0 ? (
        <EmptyState icon="sparkles" title={t('ins.empty')} />
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {categories.map((cat) => {
            const items = categorizedInsights[cat.key] || [];
            if (items.length === 0) return null;
            return (
              <Card key={cat.key} className="p-5">
                {/* رأس الكارت */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                    style={{ background: cat.color + '1A', color: cat.color }}>
                    <Icon name={cat.icon} size={20} sw={2} />
                  </div>
                  <h2 className="text-[15px] font-bold grow">{cat.label}</h2>
                  <span className="text-[11px] font-bold text-muted bg-surface2 px-2 py-0.5 rounded-full num">
                    {items.length}
                  </span>
                </div>
                {/* قائمة الملاحظات */}
                <div className="space-y-2.5">
                  {items.map((item, i) => {
                    const tones = {
                      good:    { bg: 'bg-accentSoft', fg: 'text-accent' },
                      warn:    { bg: 'bg-warnSoft',   fg: 'text-warn' },
                      bad:     { bg: 'bg-dangerSoft', fg: 'text-danger' },
                      info:    { bg: 'bg-surface2',   fg: 'text-muted' },
                      neutral: { bg: 'bg-surface2',   fg: 'text-muted' },
                    };
                    const tn = tones[item.tone] || tones.info;
                    return (
                      <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-surface2/40">
                        <div className={'w-8 h-8 rounded-lg grid place-items-center shrink-0 ' + tn.bg + ' ' + tn.fg}>
                          <Icon name={item.icon} size={15} sw={2} />
                        </div>
                        <p className="text-[13px] leading-relaxed pt-1.5 text-ink grow">
                          {item.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}