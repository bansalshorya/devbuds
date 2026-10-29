// A tiny inline SVG line chart. No chart library, so it stays light on basic phones.
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const width = 160;
  const height = 36;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - 3 - (Math.max(0, Math.min(100, v)) / 100) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} className="h-9 w-40 text-teal-700">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  );
}