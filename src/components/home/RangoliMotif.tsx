/**
 * Decorative rangoli-inspired SVG (pure CSS-free illustration, no external assets).
 * Purely presentational, so it is hidden from assistive technology.
 */
const C = 160;

const RINGS = [
  { radius: 48, count: 8, dot: 4.5, color: '#E8A33D' },
  { radius: 96, count: 16, dot: 3.5, color: '#B0343C' },
  { radius: 144, count: 24, dot: 2.5, color: '#1F6B4F' },
];

const PETAL_ANGLES = Array.from({ length: 8 }, (_, i) => i * 45);

const DOTS = RINGS.flatMap(({ radius, count, dot, color }) =>
  Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      key: `${radius}-${i}`,
      cx: C + radius * Math.cos(angle),
      cy: C + radius * Math.sin(angle),
      r: dot,
      color,
    };
  }),
);

export default function RangoliMotif({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 320"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g fill="none" stroke="#1F6B4F" strokeOpacity="0.3" strokeWidth="1">
        <circle cx={C} cy={C} r="48" />
        <circle cx={C} cy={C} r="96" />
        <circle cx={C} cy={C} r="144" />
      </g>
      <g fill="#E8A33D" fillOpacity="0.35">
        {PETAL_ANGLES.map((deg) => (
          <ellipse
            key={deg}
            cx={C}
            cy={C - 72}
            rx="18"
            ry="34"
            transform={`rotate(${deg} ${C} ${C})`}
          />
        ))}
      </g>
      <g>
        {DOTS.map((d) => (
          <circle key={d.key} cx={d.cx} cy={d.cy} r={d.r} fill={d.color} />
        ))}
      </g>
      <circle cx={C} cy={C} r="12" fill="#B0343C" />
    </svg>
  );
}
