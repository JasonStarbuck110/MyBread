import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { duringRegularMarketHours } from './marketClock';
import './stocks.css';
import PortfolioChart from './PortfolioChart';

const FEATURED = [
    { ticker: 'AAPL', company: 'Apple' },
    { ticker: 'MSFT', company: 'Microsoft' },
    { ticker: 'NVDA', company: 'NVIDIA' },
    { ticker: 'GOOGL', company: 'Alphabet' },
    { ticker: 'AMZN', company: 'Amazon' },
    { ticker: 'TSLA', company: 'Tesla' },
    { ticker: 'META', company: 'Meta' },
    { ticker: 'AMD', company: 'AMD' },
    { ticker: 'KO', company: 'Coca-Cola' },
    { ticker: 'JPM', company: 'JPMorgan Chase' },
];
const SHARE_SCALE = 1_000_000;

function money(cents) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format((Number(cents) || 0) / 100);
}

function shares(units) {
    return ((Number(units) || 0) / SHARE_SCALE)
        .toFixed(6)
        .replace(/0+$/, '')
        .replace(/\.$/, '');
}

function centsFromText(value) {
    if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null;
    const cents = Math.round(Number(value) * 100);
    return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function sharesFromText(value) {
    if (!/^\d+(\.\d{1,6})?$/.test(value.trim())) return null;
    const units = Math.round(Number(value) * SHARE_SCALE);
    return Number.isSafeInteger(units) && units > 0
        ? units / SHARE_SCALE
        : null;
}

export default function StocksPage() {
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [search, setSearch] = useState('');
    const [symbol, setSymbol] = useState('');
    const [quote, setQuote] = useState(null);
    const [quoteError, setQuoteError] = useState('');
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [side, setSide] = useState('buy');
    const [amount, setAmount] = useState('5.00');
    const [quantity, setQuantity] = useState('');
    const [review, setReview] = useState(false);
    const [busy, setBusy] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const quoteId = useRef(0);

    useEffect(() => {
        let active = true;

        api.getPortfolio()
            .then((data) => {
                if (active) setPortfolio(data);
            })
            .catch((err) => {
                if (active) setError(err.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, []);

    // Keep the dashboard balance in sync with changing market prices.
    useEffect(() => {
        const timer = setInterval(() => {
            if (document.hidden || !duringRegularMarketHours()) return;
            api.getPortfolio().then(setPortfolio).catch(() => {
                // Keep the last valid value; manual Refresh shows errors.
            });
        }, 5 * 60_000);
        return () => clearInterval(timer);
    }, []);

    async function refreshPortfolio() {
        const updated = await api.getPortfolio();
        setPortfolio(updated);
        setError('');
    }

    async function handleRefresh() {
        if (refreshing) return;
        setRefreshing(true);
        try {
            await refreshPortfolio();
            setNotice('Portfolio refreshed.');
        } catch (err) {
            setNotice(`Unable to refresh: ${err.message}`);
        } finally {
            setRefreshing(false);
        }
    }

    async function selectStock(nextSymbol) {
        const ticker = nextSymbol.trim().toUpperCase();

        if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker)) {
            setNotice('Enter a valid ticker, such as AAPL.');
            return;
        }

        setSymbol(ticker);
        setQuote(null);
        setQuoteError('');
        setNotice('');
        setReview(false);
        setSide('buy');
        setQuoteLoading(true);

        const requestId = ++quoteId.current;
        try {
            const result = await api.getQuote(ticker);
            if (requestId === quoteId.current) setQuote(result);
        } catch (err) {
            if (requestId === quoteId.current) setQuoteError(err.message);
        } finally {
            if (requestId === quoteId.current) setQuoteLoading(false);
        }
    }

    const holdings = Object.entries(portfolio?.holdings || {})
        .filter(([, item]) => Number(item.sharesUnits) > 0);
    const cash = portfolio?.cashCents || 0;
    const invested = portfolio?.investmentsValueCents || 0;
    const total = portfolio?.totalValueCents || 0;
    const ownedUnits = portfolio?.holdings?.[symbol]?.sharesUnits || 0;
    const price = Number(quote?.priceCents) || 0;
    const amountCents = centsFromText(amount);
    const sellShares = sharesFromText(quantity);
    const sellUnits = sellShares ? Math.round(sellShares * SHARE_SCALE) : 0;
    const estimatedBuyUnits = amountCents && price
        ? Math.floor((amountCents * SHARE_SCALE) / price)
        : 0;
    const validOrder = price > 0 && (
        side === 'buy'
            ? amountCents > 0 && amountCents <= cash && estimatedBuyUnits > 0
            : sellUnits > 0 && sellUnits <= ownedUnits
    );

    async function confirmTrade() {
        if (!validOrder || busy) return;

        setBusy(true);
        setReview(false);
        setNotice('');

        try {
            if (side === 'buy') {
                await api.buy(symbol, amountCents);
            } else {
                await api.sell(symbol, sellShares);
            }

            try {
                await refreshPortfolio();
                setNotice('Simulated trade completed. Portfolio updated.');
            } catch {
                setNotice(
                    'Trade submitted, but the portfolio could not refresh. ' +
                    'Check balances before trading again.'
                );
            }
        } catch (err) {
            setNotice(
                `Trade not confirmed: ${err.message}. ` +
                'Check your holdings before trying again.'
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="mybread-stocks" aria-label="Stocks and simulated trading">
            <div className="stocks-page-heading">
                <div>
                    <h1>Stocks</h1>
                </div>
                <button type="button" className="stocks-btn stocks-btn-outline"
                    disabled={loading || refreshing || !portfolio}
                    onClick={handleRefresh}>
                    {refreshing ? 'Refreshing...' : 'Refresh portfolio'}
                </button>
            </div>

            {notice && <p className="stocks-notice" role="status">{notice}</p>}
            {loading && <p role="status">Loading your saved portfolio...</p>}
            {error && (
                <section className="stocks-card stocks-error" role="alert">
                    <p>{error}</p>
                    <button type="button" className="stocks-btn stocks-btn-outline"
                        onClick={() => window.location.reload()}>Retry</button>
                </section>
            )}

            {portfolio && !error && (
                <>
                    <div className="stocks-grid stocks-overview">
                        <section className="stocks-card" aria-label="Total portfolio value">
                            <p className="stocks-overline">Total portfolio value</p>
                            <h2 className="stocks-value">{money(total)}</h2>
                            <p className={portfolio.totalGainCents >= 0 ? 'stocks-positive' : 'stocks-negative'}>
                                {portfolio.totalGainCents >= 0 ? '+' : '-'}{money(Math.abs(portfolio.totalGainCents))} total profit / loss
                            </p>
                            <p className="stocks-muted stocks-small">Stocks {money(invested)}, cash {money(cash)}</p>
                        </section>
                        <section className="stocks-card" aria-label="Available to invest">
                            <p className="stocks-overline">Available to invest</p>
                            <h2 className="stocks-value">{money(cash)}</h2>
                            <p className="stocks-muted stocks-small">Complete lessons to earn more simulated cash.</p>
                        </section>
                    </div>

                    <div className="stocks-grid stocks-chart-discover">
                        <PortfolioChart portfolio={portfolio} selectedSymbol={symbol} />
                        <section className="stocks-card" aria-labelledby="stocks-discover-title">
                            <h2 id="stocks-discover-title">Discover stocks</h2>
                            <form className="stocks-search" onSubmit={(event) => {
                                event.preventDefault();
                                selectStock(search);
                            }}>
                                <label className="stocks-screenreader" htmlFor="stocks-search-input">Ticker symbol</label>
                                <input id="stocks-search-input" value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search by ticker" />
                                <button className="stocks-btn stocks-btn-outline" type="submit">Search</button>
                            </form>
                            <div className="stocks-discovery-list" aria-label="Featured companies">
                                {FEATURED.map(({ ticker, company }) => (
                                    <button className="stocks-discovery-item" key={ticker} type="button"
                                        onClick={() => selectStock(ticker)}
                                        aria-pressed={symbol === ticker}>
                                        <span className="stocks-discovery-name">
                                            <strong>{ticker}</strong>
                                            <span>{company}</span>
                                        </span>
                                        <span className="stocks-select-label">Select</span>
                                    </button>
                                ))}
                            </div>
                            <p className="stocks-small stocks-muted">Suggestions are not recommendations. Prices load when selected.</p>
                        </section>
                    </div>

                    <div className="stocks-grid stocks-holdings-trade">
                        <section className="stocks-card" id="holdings">
                            <div className="stocks-section-heading">
                                <h2>My holdings</h2>
                                <span className="stocks-small stocks-muted">
                                    {holdings.length} {holdings.length === 1 ? 'stock' : 'stocks'}
                                </span>
                            </div>
                            {holdings.length === 0 ? (
                                <p>You don't own any stocks yet. Explore a company to begin.</p>
                            ) : (
                                <div className="stocks-table-scroll">
                                    <table className="stocks-table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Stock</th>
                                                <th scope="col">Shares</th>
                                                <th scope="col">Value</th>
                                                <th scope="col">Gain / Loss</th>
                                                <th scope="col">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {holdings.map(([ticker, holding]) => (
                                                <tr key={ticker}>
                                                    <td><strong>{ticker}</strong></td>
                                                    <td>{shares(holding.sharesUnits)}</td>
                                                    <td>{money(holding.currentValueCents)}</td>
                                                    <td className={holding.unrealizedGainCents >= 0 ? 'stocks-positive' : 'stocks-negative'}>
                                                        {holding.unrealizedGainCents >= 0 ? '+' : '-'}{money(Math.abs(holding.unrealizedGainCents))}
                                                    </td>
                                                    <td><button type="button" className="stocks-btn stocks-btn-small stocks-btn-outline"
                                                        onClick={() => selectStock(ticker)}>Trade</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        <section className="stocks-card" id="trade">
                            <h2>Simulated trade{symbol && ` · ${symbol}`}</h2>
                            {!symbol ? (
                                <p className="stocks-muted">Select a stock from your holdings or Discover Stocks.</p>
                            ) : (
                                <>
                                    {quoteLoading && <p role="status">Loading latest available quote...</p>}
                                    {quoteError && <p className="stocks-negative" role="alert">{quoteError}</p>}
                                    {price > 0 && (
                                        <div className="stocks-quote">
                                            <span className="stocks-small stocks-muted">Latest available price</span>
                                            <strong>{money(price)}</strong>
                                        </div>
                                    )}
                                    <div className="stocks-trade-toggle" aria-label="Trade type">
                                        <button type="button" className={`stocks-btn ${side === 'buy' ? 'stocks-btn-primary' : 'stocks-btn-outline'}`}
                                            aria-pressed={side === 'buy'} onClick={() => { setSide('buy'); setReview(false); }}>Buy</button>
                                        <button type="button" className={`stocks-btn ${side === 'sell' ? 'stocks-btn-primary' : 'stocks-btn-outline'}`}
                                            aria-pressed={side === 'sell'} onClick={() => { setSide('sell'); setReview(false); }}>Sell</button>
                                    </div>
                                    <label className="stocks-field" htmlFor="stocks-trade-amount">
                                        <span>{side === 'buy' ? 'Amount to invest (USD)' : 'Shares to sell'}</span>
                                        <input id="stocks-trade-amount" value={side === 'buy' ? amount : quantity}
                                            onChange={(event) => {
                                                if (side === 'buy') setAmount(event.target.value);
                                                else setQuantity(event.target.value);
                                                setReview(false);
                                            }}
                                            inputMode="decimal" placeholder={side === 'buy' ? '5.00' : '0.005'} />
                                    </label>
                                    <p className="stocks-small stocks-muted">Owned: {shares(ownedUnits)} shares · Cash: {money(cash)}</p>
                                    {side === 'buy' && estimatedBuyUnits > 0 && (
                                        <p className="stocks-small stocks-muted">Estimated purchase: {shares(estimatedBuyUnits)} shares</p>
                                    )}
                                    {!review ? (
                                        <button type="button" className="stocks-btn stocks-btn-primary stocks-full-width"
                                            disabled={!validOrder || busy} onClick={() => setReview(true)}>
                                            Review {side} order
                                        </button>
                                    ) : (
                                        <div className="stocks-review">
                                            <strong>Confirm simulated {side}?</strong>
                                            <p>{side === 'buy'
                                                ? `Invest ${money(amountCents)} in ${symbol}`
                                                : `Sell ${sellShares} ${symbol} shares`}</p>
                                            <div className="stocks-trade-toggle">
                                                <button type="button" className="stocks-btn stocks-btn-outline"
                                                    onClick={() => setReview(false)}>Back</button>
                                                <button type="button" className="stocks-btn stocks-btn-primary"
                                                    disabled={busy} onClick={confirmTrade}>
                                                    {busy ? 'Submitting...' : 'Confirm trade'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                </>
            )}
        </section>
    );
}
