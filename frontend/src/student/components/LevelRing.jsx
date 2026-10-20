

export default function LevelRing({ level, xp, xpNext }) {
  const r = 52
  const c = 2 * Math.PI * r
  const pct = xp / xpNext
  return (
    <div className="ring" role="img" aria-label={`Level ${level}, ${xp} of ${xpNext} XP`}>
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} className="ring-track" />
        <circle
          cx="60" cy="60" r={r}
          className="ring-fill"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ring-text">
        <span className="ring-level">{level}</span>
        <span className="ring-sub">level</span>
      </div>
    </div>
  )
}
