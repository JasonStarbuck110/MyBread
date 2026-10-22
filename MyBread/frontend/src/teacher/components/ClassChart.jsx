import { useState } from 'react'
import { chartData } from '../data'

export default function ClassChart() {
  const [days, setDays] = useState(30)
  const values = chartData.slice(-days)
  const width = 1000
  const height = 280
  const left = 50
  const bottom = 30
  const min = Math.min(...values) - 2
  const max = Math.max(...values) + 2

  const points = values.map((v, i) => {
    const x = left + (i / (values.length - 1)) * (width - left)
    const y = 10 + (1 - (v - min) / (max - min)) * (height - bottom - 10)
    return x.toFixed(1) + ',' + y.toFixed(1)
  })
  const baseY = height - bottom
  const area = `${left},${baseY} ${points.join(' ')} ${width},${baseY}`
  const label = { fontSize: 13, fill: '#6B625B' }

  return (
    <>
      <div className="t-time-buttons">
        <button className={days === 7 ? 't-active' : ''} onClick={() => setDays(7)}>1W</button>
        <button className={days === 30 ? 't-active' : ''} onClick={() => setDays(30)}>1M</button>
      </div>
      <div className="t-chart">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Class average portfolio value">
          <text x="0" y="20" {...label}>${Math.round(max)}</text>
          <text x="0" y={baseY} {...label}>${Math.round(min)}</text>
          <polygon points={area} fill="#E2EBE4" />
          <polyline points={points.join(' ')} fill="none" stroke="#3C6E4D" strokeWidth="3.5" />
          <text x={left} y={height - 6} {...label}>{days} days ago</text>
          <text x={width} y={height - 6} {...label} textAnchor="end">Today</text>
        </svg>
      </div>
    </>
  )
}
