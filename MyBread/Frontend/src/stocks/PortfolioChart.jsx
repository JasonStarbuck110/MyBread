import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { duringRegularMarketHours } from './marketClock';

const RANGES = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

function money(cents) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD'
    }).format(cents / 100);
}

function dateLabel(timestamp, range) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US',
        range === '1D'
            ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
            : { month: 'short', day: 'numeric', year: '2-digit' }
    );
}

function returnFromPoints(points, type) {
    if (points.length < 2) return null;
    const first = points[0];
    const last = points.at(-1);
    if (type === 'stock') {
        const change = last.priceCents - first.priceCents;
        return { change, percent: first.priceCents > 0
            ? (change / first.priceCents) * 100 : null };
    }
    // Earned lesson rewards should not be counted as investment performance.
    const earned = (last.netRewardsCents || 0) - (first.netRewardsCents || 0);
    const change = last.totalValueCents - first.totalValueCents - earned;
    // When deposits happened during the period, this simple percentage would
    // not represent a true portfolio return, so don't show a misleading %.
    const percent = earned === 0 && first.totalValueCents > 0
        ? (change / first.totalValueCents) * 100 : null;
    return { change, percent };
}

export default function PortfolioChart({ portfolio, selectedSymbol }) {
    const [mode, setMode] = useState('portfolio');
    const [range, setRange] = useState('1D');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hoverIndex, setHoverIndex] = useState(null);

    const stockSymbol = selectedSymbol ||
        Object.keys(portfolio?.holdings || {})[0] || 'AAPL';

    useEffect(() => {
        let active = true;
        setResult(null);
        setLoading(true);
        setError('');
        setHoverIndex(null);

        async function fetchHistory() {
            try {
                const data = mode === 'portfolio'
                    ? await api.getPortfolioHistory(range)
                    : await api.getStockHistory(stockSymbol, range);
                if (active) {
                    setResult(data);
                    setError('');
                }
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        }

        fetchHistory();
        // Recheck periodically while the page is open; the backend caches
        // provider responses to reduce API usage.
        const timer = setInterval(() => {
            if (!document.hidden && duringRegularMarketHours()) fetchHistory();
        }, 5 * 60_000);
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [mode, range, stockSymbol, portfolio?.cashCents,
        portfolio?.investmentsValueCents, portfolio?.totalGainCents]);

    const points = useMemo(() => result?.points || [], [result]);
    const view = useMemo(() => {
        if (points.length < 2) return null;
        const startTime = Date.parse(points[0].timestamp);
        const endTime = Date.parse(points.at(-1).timestamp);
        if (!(endTime > startTime)) return null;

        const values = points.map((p) => mode === 'portfolio'
            ? p.totalValueCents : p.priceCents);
        const smallest = Math.min(...values);
        const largest = Math.max(...values);
        const padding = Math.max(2, Math.ceil((largest - smallest) * 0.10));
        const low = Math.max(0, smallest - padding);
        const high = largest + padding;
        const x = (time) => 95 + (time - startTime) / (endTime - startTime) * 865;
        const y = (value) => 245 - (value - low) / (high - low) * 215;
        return {
            low, high,
            path: points.map((p, i) =>
                `${i === 0 ? 'M' : 'L'} ${x(Date.parse(p.timestamp))} ${y(values[i])}`
            ).join(' '),
            coords: points.map((p, i) => ({
                x: x(Date.parse(p.timestamp)), y: y(values[i])
            }))
        };
    }, [points, mode]);

    const highlight = hoverIndex !== null && points[hoverIndex]
        ? hoverIndex : points.length - 1;
    const highlightedPoint = points[highlight];
    const highlightedValue = highlightedPoint && (mode === 'portfolio'
        ? highlightedPoint.totalValueCents : highlightedPoint.priceCents);
    const performance = returnFromPoints(points, mode);
    const positive = performance ? performance.change >= 0 : true;
    const lineColor = '#3C6E4D'; // Team palette: the line always stays deep pine green.

    function moveHover(event) {
        if (!view) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const chartX = (event.clientX - bounds.left) / bounds.width * 1000;
        let nearest = 0;
        let distance = Infinity;
        view.coords.forEach((point, index) => {
            const difference = Math.abs(chartX - point.x);
            if (difference < distance) {
                distance = difference;
                nearest = index;
            }
        });
        setHoverIndex(nearest);
    }

    return (
        <section className="stocks-card stocks-chart-card" aria-labelledby="portfolio-chart-title">
            <div className="stocks-section-heading">
                <h2 id="portfolio-chart-title">
                    {mode === 'portfolio' ? 'Portfolio performance' : `${stockSymbol} stock price`}
                </h2>
                <div className="stocks-chart-modes" aria-label="Chart type">
                    <button type="button" className={`stocks-chip ${mode === 'portfolio' ? 'stocks-chip-active' : ''}`}
                        aria-pressed={mode === 'portfolio'} onClick={() => setMode('portfolio')}>Portfolio</button>
                    <button type="button" className={`stocks-chip ${mode === 'stock' ? 'stocks-chip-active' : ''}`}
                        aria-pressed={mode === 'stock'} onClick={() => setMode('stock')}>Stock price</button>
                </div>
            </div>

            {highlightedPoint && (
                <div className="stocks-chart-readout" aria-live="polite">
                    <strong>{money(highlightedValue)}</strong>
                    <span className="stocks-small stocks-muted">{dateLabel(highlightedPoint.timestamp, range)}</span>
                    {performance && (
                        <span className={positive ? 'stocks-positive' : 'stocks-negative'}>
                            {positive ? '+' : '-'}{money(Math.abs(performance.change))}
                            {performance.percent !== null && ` (${positive ? '+' : ''}${performance.percent.toFixed(2)}%)`}
                            
                        </span>
                    )}
                </div>
            )}

            <div className="stocks-chart-ranges" aria-label="Chart time range">
                {RANGES.map((option) => (
                    <button key={option} type="button" aria-pressed={range === option}
                        className={`stocks-chip ${range === option ? 'stocks-chip-active' : ''}`}
                        onClick={() => { setRange(option); setHoverIndex(null); }}>{option}</button>
                ))}
            </div>

            {error && result && (
                <p className="stocks-negative stocks-small" role="status">Market data refresh failed. Showing the last available chart.</p>
            )}
            {loading && !result ? (
                <div className="stocks-chart-message">Loading historical prices...</div>
            ) : error && !result ? (
                <div className="stocks-chart-message stocks-negative" role="alert">
                    {error}. Check the market-data provider and try again.
                </div>
            ) : !view ? (
                <div className="stocks-chart-message">
                    {mode === 'portfolio'
                        ? 'Not enough real portfolio history to draw a line yet. It will develop as market prices change.'
                        : 'Historical stock price data is unavailable for this time range.'}
                </div>
            ) : (
                <div className="stocks-chart-wrap">
                    <svg viewBox="0 0 1000 290" role="img"
                        aria-label={`Historical ${mode === 'portfolio' ? 'portfolio value' : 'stock price'} from ${money(mode === 'portfolio' ? points[0].totalValueCents : points[0].priceCents)} to ${money(mode === 'portfolio' ? points.at(-1).totalValueCents : points.at(-1).priceCents)}.`}
                        onPointerMove={moveHover} onPointerLeave={() => setHoverIndex(null)}
                        tabIndex="0" onKeyDown={(event) => {
                            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                                event.preventDefault();
                                const movement = event.key === 'ArrowRight' ? 1 : -1;
                                setHoverIndex((current) => Math.max(0, Math.min(points.length - 1,
                                    (current === null ? points.length - 1 : current) + movement)));
                            }
                        }}>
                        {[0, 1, 2, 3, 4].map((n) => {
                            const val = view.low + (view.high - view.low) * n / 4;
                            const y = 245 - (val - view.low) / (view.high - view.low) * 215;
                            return <g key={n}>
                                <line x1="95" x2="960" y1={y} y2={y} stroke="#E5D7C8" strokeDasharray="4 6" />
                                <text x="82" y={y + 4} textAnchor="end" fontSize="13" fill="#655B51">{money(Math.round(val))}</text>
                            </g>;
                        })}
                        <path d={`${view.path} L ${view.coords.at(-1).x} 245 L ${view.coords[0].x} 245 Z`}
                            fill="#3C6E4D" fillOpacity="0.09" stroke="none" />
                        <path d={view.path} fill="none" stroke={lineColor} strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round" />
                        {view.coords[highlight] && (
                            <g>
                                <line x1={view.coords[highlight].x} x2={view.coords[highlight].x}
                                    y1="30" y2="245" stroke="#C19A6B" strokeDasharray="3 4" />
                                <circle cx={view.coords[highlight].x} cy={view.coords[highlight].y}
                                    r="4" fill="#F5E3D1" stroke={lineColor} strokeWidth="1.5" />
                            </g>
                        )}
                        <text x="95" y="278" textAnchor="start" fontSize="13" fill="#655B51">
                            {dateLabel(points[0].timestamp, range)}
                        </text>
                        <text x="960" y="278" textAnchor="end" fontSize="13" fill="#655B51">
                            {dateLabel(points.at(-1).timestamp, range)}
                        </text>
                    </svg>
                </div>
            )}
        </section>
    );
}
