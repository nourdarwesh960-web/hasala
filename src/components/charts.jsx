export function Donut({ data, size = 190, thickness = 24, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        {total > 0 && data.map((d, i) => {
          const len = (d.value / total) * c;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color}
              strokeWidth={thickness} strokeDasharray={len + ' ' + (c - len)}
              strokeDashoffset={-offset} strokeLinecap="butt" />
          );
          offset += len;
          return el;
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 grid place-items-center text-center pointer-events-none">
          <div>
            {centerValue && <div className="text-[17px] font-bold text-ink num leading-tight">{centerValue}</div>}
            {centerLabel && <div className="text-[11px] text-muted mt-0.5">{centerLabel}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
export function BarChart({ data, height = 160, formatValue }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="w-full">
      <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group min-w-0">
              <div className="text-[10px] font-semibold text-muted opacity-0 group-hover:opacity-100 transition num whitespace-nowrap">
                {formatValue ? formatValue(d.value) : d.value}
              </div>
              <div className="w-full rounded-t-lg transition-all duration-500"
                style={{ height: Math.max(2, h) + '%', background: d.color || 'var(--accent)' }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 sm:gap-3 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-muted truncate">{d.label}</div>
        ))}
      </div>
    </div>
  );
}
export function LineChart({ points, height = 150, color = 'var(--accent)' }) {
  const w = 600, h = height;
  const pad = 8;
  if (!points.length) return <div className="h-[150px] grid place-items-center text-muted text-sm">—</div>;
  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => [pad + i * stepX, h - pad - (p.value / max) * (h - pad * 2)]);
  const path = coords.map((c, i) => (i === 0 ? 'M' : 'L') + c[0].toFixed(1) + ' ' + c[1].toFixed(1)).join(' ');
  const area = path + ' L ' + coords[coords.length - 1][0].toFixed(1) + ' ' + (h - pad) + ' L ' + coords[0][0].toFixed(1) + ' ' + (h - pad) + ' Z';
  return (
    <svg viewBox={'0 0 ' + w + ' ' + h} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {coords.map((c, i) => (
        <circle key={i} cx={c[0]} cy={c[1]} r="3" fill="var(--surface)" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}