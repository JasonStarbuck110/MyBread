import { useEffect, useState } from 'react'
import { fetchHistory } from '../tradingApi'
import { money } from '../data'
import './portfolioChart.css'

const RANGES = ['1D', '1W', '1M', '3M', '1Y', 'ALL']
const WIDTH = 1000
const HEIGHT = 312
const LEFT = 4
const RIGHT = WIDTH - 4
const TOP = 20
const BOTTOM = HEIGHT - 20

function dateLabel(timestamp, range) {
  return new Intl.DateTimeFormat(undefined,
    range === '1D'
      ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { month: 'short', day: 'numeric', year: 'numeric' }
  ).format(new Date(timestamp))
}

function chartPoints(raw) {
  return (raw || [])
    .map((point) => ({
      timestamp: Date.parse(point.timestamp),
      value: Number(point.totalValueCents) / 100,
      gain: Number(point.gainCents) / 100,
      funding: Number(point.netRewardsCents) / 100
    }))
    .filter((point) =>
      Number.isFinite(point.timestamp) &&
      Number.isFinite(point.value) &&
      Number.isFinite(point.gain) &&
      Number.isFinite(point.funding) &&
      point.value >= 0
    )
    .sort((a, b) => a.timestamp - b.timestamp)
}

export default function PortfolioChart({ total }) {
  const [range, setRange] = useState('1D')
  const [view, setView] = useState('value')
  const [points, setPoints] = useState([])
  const [hoverIndex, setHoverIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    setHoverIndex(null)

    fetchHistory(range)
      .then((response) => {
        if (mounted) setPoints(chartPoints(response.points))
      })
      .catch((err) => {
        if (mounted) {
          setPoints([])
          setError(err?.message || 'Unable to load portfolio history.')
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [range, total])

  const first = points[0]
  const last = points[points.length - 1]
  const inspected = hoverIndex === null ? last : points[hoverIndex]
  const hasHistory = points.length > 1
  const gainChange = first && inspected ? inspected.gain - first.gain : 0
  const fundingChange = first && inspected ? inspected.funding - first.funding : 0
  const positive = gainChange >= 0
  const chartColor = gainChange < 0 ? '#d95d39' : '#3c6e4d'
  const amounts = points.map((point) =>
    view === 'value' ? point.value : point.gain - (first?.gain ?? 0)
  )
  const min = amounts.length ? Math.min(...amounts) : 0
  const max = amounts.length ? Math.max(...amounts) : 1
  const margin = Math.max((max - min) * 0.2, Math.abs(max) * 0.008, 0.05)
  const floor = min - margin
  const ceiling = max + margin
  const toX = (index) => LEFT + (index / Math.max(points.length - 1, 1)) * (RIGHT - LEFT)
  const toY = (amount) => BOTTOM - ((amount - floor) / (ceiling - floor)) * (BOTTOM - TOP)
  const line = amounts
    .map((amount, index) => `${index === 0 ? 'M' : 'L'} ${toX(index).toFixed(2)} ${toY(amount).toFixed(2)}`)
    .join(' ')
  const reference = view === 'value' ? first?.value ?? 0 : 0

  function inspect(event) {
    if (!hasHistory) return
    const rect = event.currentTarget.getBoundingClientRect()
    const relativeX = (event.clientX - rect.left) / rect.width
    const selected = Math.round(relativeX * (points.length - 1))
    setHoverIndex(Math.max(0, Math.min(points.length - 1, selected)))
  }

  return (
    <section className="portfolio-overview" aria-label="Portfolio performance">
      <header className="portfolio-overview-header">
        <p className="portfolio-overview-label">Portfolio</p>
        <h2 className="portfolio-overview-balance">
          {money(inspected?.value ?? total ?? 0)}
        </h2>
        <p className={`portfolio-overview-change ${positive ? 'is-positive' : 'is-negative'}`}>
          {hasHistory ? (
            <>
              <span aria-hidden="true">{positive ? '▲' : '▼'}</span>{' '}
              {positive ? '+' : '−'}{money(Math.abs(gainChange))}{' '}
              <span className="portfolio-overview-change-label">
                investment gain/loss · {range}
              </span>
            </>
          ) : (
            <span className="portfolio-overview-change-label">Investment performance</span>
          )}
        </p>
        <p className="portfolio-overview-inspection" aria-live="off">
          {hoverIndex !== null && inspected ? dateLabel(inspected.timestamp, range) : '\u00a0'}
        </p>
      </header>
      {loading && (
        <div className="portfolio-overview-placeholder" role="status">
          Loading portfolio history…
        </div>
      )}
      {!loading && error && (
        <div className="portfolio-overview-placeholder" role="alert">
          Portfolio history unavailable: {error}
        </div>
      )}
      {!loading && !error && !hasHistory && (
        <div className="portfolio-overview-placeholder">
          Not enough history for this period. Try another time range.
        </div>
      )}
      {!loading && !error && hasHistory && (
        <div className="portfolio-overview-plot">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`${range} portfolio ${view === 'value' ? 'account value' : 'investment gain'} history. Starting value ${money(first.value)}, latest value ${money(last.value)}.`}
            onPointerMove={inspect}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <line
              x1={LEFT}
              x2={RIGHT}
              y1={toY(reference)}
              y2={toY(reference)}
              stroke="currentColor"
              strokeOpacity="0.24"
              strokeWidth="1.3"
              strokeDasharray="1.5 6"
            />
            <path
              d={line}
              stroke={chartColor}
              strokeWidth="2.8"
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
            {hoverIndex !== null && (
              <g>
                <line
                  x1={toX(hoverIndex)}
                  x2={toX(hoverIndex)}
                  y1={TOP}
                  y2={BOTTOM}
                  stroke="currentColor"
                  strokeOpacity="0.26"
                  strokeDasharray="3 5"
                />
                <circle
                  cx={toX(hoverIndex)}
                  cy={toY(amounts[hoverIndex])}
                  r="5"
                  fill={chartColor}
                  stroke="white"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        </div>
      )}
      <nav className="portfolio-overview-ranges" aria-label="Portfolio chart range">
        {RANGES.map((option) => (
          <button
            key={option}
            type="button"
            className={range === option ? 'is-active' : ''}
            aria-pressed={range === option}
            onClick={() => setRange(option)}
          >
            {option}
          </button>
        ))}
      </nav>
      <div className="portfolio-overview-footer">
        <div className="portfolio-overview-view" role="group" aria-label="Chart metric">
          <button
            type="button"
            className={view === 'value' ? 'is-active' : ''}
            aria-pressed={view === 'value'}
            onClick={() => { setView('value'); setHoverIndex(null) }}
          >
            Account value
          </button>
          <button
            type="button"
            className={view === 'gain' ? 'is-active' : ''}
            aria-pressed={view === 'gain'}
            onClick={() => { setView('gain'); setHoverIndex(null) }}
          >
            Investment gain
          </button>
        </div>
        <p>
          {view === 'value'
            ? `Includes cash, investments and lesson rewards.${fundingChange > 0 ? ` ${money(fundingChange)} in additional rewards during the inspected period.` : ''}`
            : 'Investment gain excludes recorded lesson rewards. Historical performance is estimated from available activity.'}
        </p>
      </div>
    </section>
  )
}