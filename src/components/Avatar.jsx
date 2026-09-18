export function Avatar({ photo, name, size = 40, className = '', rounded = 'rounded-2xl', accent = true }) {
  const initial = (name || '؟').trim().charAt(0).toUpperCase();
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  if (photo) {
    return (
      <img
        src={photo}
        alt={name || 'Avatar'}
        draggable="false"
        className={'object-cover shrink-0 ' + rounded + ' ' + className}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={'grid place-items-center font-bold shrink-0 ' + rounded + ' ' +
        (accent ? 'bg-accentSoft text-accent' : 'bg-surface2 text-muted') + ' ' + className}
      style={style}
    >
      {initial}
    </div>
  );
}