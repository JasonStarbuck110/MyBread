import { useMemo, useState } from 'react'

export default function PortfolioChart({ total }) {
  const [range, setRange] = useState('1W')
  const counts = { '1D': 12, '1W': 20, '1M': 30, '3M': 40, '1Y': 50, ALL: 60 }
  const points = useMemo(() => {
    const n = counts[range]
    return Array.from({ length: n }, (_, i) => {
      const wobble = 0.6 + 0.4 * Math.sin(i * 1.7)
      return total * (1 - 0.04 * (1 - i / (n - 1)) * wobble)
    })
  }, [range, total])

  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const path = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * 600
      const y = 180 - ((v - min) / span) * 160
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div>
      <div className="tabs" role="tablist" aria-label="Chart range">
        {Object.keys(counts).map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={range === r}
            className={range === r ? 'tab on' : 'tab'}
            onClick={() => setRange(r)}
          >
            {r}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 600 200" className="chart" role="img" aria-label="Portfolio value over time">
        <path d={`${path} L600,200 L0,200 Z`} className="chart-area" />
        <path d={path} className="chart-line" />
      </svg>
      <p className="note">
        Sample history for the prototype. In the real app this will come from saved portfolio values.
      </p>
    </div>
  )
}
