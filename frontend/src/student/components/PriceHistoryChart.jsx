import { useEffect, useId, useState } from 'react'
import { fetchHistory } from '../tradingApi'
import { money } from '../data'

const RANGES = ['1D', '1W', '1M', '3M', '1Y', 'ALL']
const dateLabel = (value, range) => new Intl.DateTimeFormat(undefined,
  range === '1D' ? { hour: 'numeric', minute: '2-digit' } :
    range === '1Y' || range === 'ALL' ? { month: 'short', year: 'numeric' } :
      { month: 'short', day: 'numeric' }).format(new Date(value))

export default function PriceHistoryChart({ symbol, total, refreshKey }) {
  const [range, setRange] = useState('1M')
  const [points, setPoints] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const gradientId = useId().replaceAll(':', '')
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setPoints([])
    setSelected(null)
    fetchHistory(range, symbol).then(data => {
      if (!active) return
      const parsed = (data.points || []).map(p => ({
        timestamp: p.timestamp,
        value: Number((symbol ? p.priceCents : p.totalValueCents) / 100)
      })).filter(p => Number.isFinite(p.value) && p.value >= 0 && Number.isFinite(Date.parse(p.timestamp)))
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
      setPoints(parsed)
    }).catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [range, symbol, refreshKey])

  const first = points[0]
  const last = points.at(-1)
  const inspected = points[selected] || last
  const change = first && inspected ? inspected.value - first.value : 0
  const changePercent = first?.value > 0 ? change / first.value * 100 : null
  const min = Math.min(...points.map(p => p.value))
  const max = Math.max(...points.map(p => p.value))
  const padding = Math.max((max - min) * 0.12, max * 0.002, 0.01)
  const lower = min - padding
  const upper = max + padding
  const toX = i => 64 + i / Math.max(points.length - 1, 1) * 610
  const toY = value => 208 - (value - lower) / (upper - lower) * 180
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${toX(i).toFixed(2)},${toY(p.value).toFixed(2)}`).join(' ')
  const ticks = Array.from({ length: 4 }, (_, i) => lower + (upper - lower) * i / 3)
  const showChart = points.length >= 2
  function inspect(event) {
    if (!showChart) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 720
    setSelected(Math.min(points.length - 1, Math.max(0, Math.round((x - 64) / 610 * (points.length - 1)))))
  }
  return <div className="price-history">
    <div className="history-summary">
      <div>
        <strong className="history-value">{inspected ? money(inspected.value) : symbol ? '—' : money(total ?? 0)}</strong>
        {inspected && <span className="muted"> {dateLabel(inspected.timestamp, range)}</span>}
      </div>
      {showChart && <span className={change >= 0 ? 'gain' : 'loss'}>
        {change >= 0 ? '+' : '−'}{money(Math.abs(change))} ({changePercent === null ? 'N/A' : `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`}) vs start
      </span>}
    </div>
    <div className="tabs history-ranges" role="group" aria-label="Historical price range">
      {RANGES.map(r => <button type="button" key={r} aria-pressed={range === r}
        className={range === r ? 'tab on' : 'tab'} onClick={() => setRange(r)}>{r}</button>)}
    </div>
    {loading && <p className="muted" role="status">Loading historical prices…</p>}
    {!loading && error && <p className="loss" role="alert">Historical prices unavailable: {error}</p>}
    {!loading && !error && !showChart && <p className="muted">Not enough historical data for this range yet.</p>}
    {!loading && !error && showChart && <div className="history-graph">
      <svg viewBox="0 0 720 250" className="chart" role="img"
        aria-label={`${symbol || 'Portfolio'} price history for ${range}. Starts at ${money(first.value)}, ends at ${money(last.value)}.`}
        onPointerMove={inspect} onPointerLeave={() => setSelected(null)}>
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--green)" stopOpacity=".22"/><stop offset="100%" stopColor="var(--green)" stopOpacity="0"/></linearGradient></defs>
        {ticks.map((v, i) => <g key={i}>
          <line x1="64" x2="674" y1={toY(v)} y2={toY(v)} stroke="currentColor" strokeOpacity=".12" strokeDasharray="3 5" />
          <text x="58" y={toY(v) + 4} fontSize="11" textAnchor="end" fill="currentColor">{money(v)}</text>
        </g>)}
        <path d={`${path} L674,225 L64,225 Z`} fill={`url(#${gradientId})`}/>
        <path d={path} className="chart-line" strokeWidth="2.4"/>
        {selected !== null && <g>
          <line x1={toX(selected)} x2={toX(selected)} y1="18" y2="225" stroke="currentColor" strokeOpacity=".4" strokeDasharray="4 4"/>
          <circle cx={toX(selected)} cy={toY(points[selected].value)} r="5" fill="var(--green)" stroke="white" strokeWidth="2"/>
        </g>}
        {[0, Math.floor((points.length - 1) / 2), points.length - 1].map((index, i) => <text key={i} x={toX(index)} y="243" fontSize="12" textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fill="currentColor">{dateLabel(points[index].timestamp, range)}</text>)}
      </svg>
      <p className="note">Move your cursor over the chart to inspect historical values. Market history may be delayed.</p>
    </div>}
    {!symbol && <p className="note">Portfolio history is reconstructed from simulated activity and historical market prices; earlier values are estimates.</p>}
  </div>
}
