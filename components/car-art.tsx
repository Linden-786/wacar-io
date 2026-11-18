import { EXT_COLORS } from '@/lib/data/catalog'

// Demo listings have no photos, so each one gets a silhouette of its body
// style in its actual exterior color.
const SHAPES: Record<string, string> = {
  Sedan: 'M18 62 L26 48 Q30 44 40 42 L64 30 Q72 26 84 26 L120 26 Q132 26 142 34 L160 46 L184 50 Q194 52 194 60 L194 66 L18 66 Z',
  Coupe: 'M18 62 L28 50 Q34 46 46 44 L76 30 Q84 27 96 27 L122 28 Q134 30 146 40 L164 48 L186 52 Q194 54 194 60 L194 66 L18 66 Z',
  Convertible: 'M18 62 L28 50 Q34 46 46 45 L84 44 L96 34 L104 34 L100 44 L150 45 L186 50 Q194 52 194 60 L194 66 L18 66 Z',
  Hatchback: 'M20 62 L26 48 Q30 44 40 42 L62 28 Q70 24 82 24 L132 24 Q144 25 152 34 L166 46 L186 50 Q192 52 192 60 L192 66 L20 66 Z',
  Wagon: 'M16 62 L24 48 Q28 44 38 42 L58 28 Q66 24 78 24 L150 24 Q162 24 168 32 L178 46 L190 50 Q196 52 196 60 L196 66 L16 66 Z',
  SUV: 'M18 62 L22 44 Q24 40 34 38 L52 22 Q58 18 70 18 L146 18 Q158 18 164 26 L176 42 L190 46 Q196 48 196 58 L196 66 L18 66 Z',
  Pickup: 'M14 62 L18 44 Q20 40 30 38 L46 22 Q52 18 64 18 L104 18 Q112 18 114 26 L116 40 L192 40 Q198 40 198 48 L198 66 L14 66 Z',
}

export function CarArt({ body, color, className }: { body: string; color: string; className?: string }) {
  const hex = EXT_COLORS.find((c) => c.base === color)?.hex ?? '#888'
  return (
    <svg viewBox="0 0 212 92" className={className} role="img" aria-label={`${color} ${body}`} preserveAspectRatio="xMidYMid meet">
      <rect width="212" height="92" className="fill-muted" />
      <ellipse cx="106" cy="76" rx="92" ry="5" className="fill-foreground/10" />
      <path d={SHAPES[body] ?? SHAPES.Sedan} fill={hex} stroke="rgba(0,0,0,.35)" strokeWidth="1" />
      <path d={SHAPES[body] ?? SHAPES.Sedan} fill="url(#shine)" />
      <defs>
        <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
      </defs>
      {[54, 158].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="66" r="13" fill="#1b1c1e" />
          <circle cx={cx} cy="66" r="6.5" fill="#9aa0a6" />
        </g>
      ))}
    </svg>
  )
}
