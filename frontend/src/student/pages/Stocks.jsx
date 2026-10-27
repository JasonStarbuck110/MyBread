import { useEffect, useState } from 'react'
import PortfolioChart from '../components/PortfolioChart'
import PriceHistoryChart from '../components/PriceHistoryChart'
import { STOCKS, money } from '../data'
import { fetchQuote, tradeStock, searchStocks } from '../tradingApi'

export default function Stocks({ cash, holdings, total, stockValue, gain, backendPrices, portfolioError, refreshPortfolio }) {
  const [query, setQuery] = useState('')
  const [detailSymbol, setDetailSymbol] = useState('')
  const [ticker, setTicker] = useState('')
  const [mode, setMode] = useState('buy')
  const [amount, setAmount] = useState('')
  const [msg, setMsg] = useState(null)
  const [quotes, setQuotes] = useState({})
  const [busy, setBusy] = useState(false)
  const [remoteResults, setRemoteResults] = useState([])
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mybread:watchlist:v1') || '[]')
      return Array.isArray(stored) ? stored.filter(t => typeof t === 'string' && /^[A-Z][A-Z0-9.-]{0,14}$/.test(t)).slice(0, 50) : []
    } catch { return [] }
  })
  const [selectedMarketView, setSelectedMarketView] = useState('featured')
  const [marketQuotes, setMarketQuotes] = useState({})
  const [marketBusy, setMarketBusy] = useState(false)
  const toggleWatch = symbol => setWatchlist(old => old.includes(symbol) ? old.filter(t => t !== symbol) : [...old, symbol].slice(0, 50))
  useEffect(() => { try { localStorage.setItem('mybread:watchlist:v1', JSON.stringify(watchlist)) } catch { /* blocked storage */ } }, [watchlist])
  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) { setRemoteResults([]); setSearchError(''); setSearching(false); return }
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      setSearching(true)
      searchStocks(term, controller.signal)
        .then(results => { setRemoteResults(results); setSearchError('') })
        .catch(e => { if (e.name !== 'AbortError') setSearchError(e.message) })
        .finally(() => { if (!controller.signal.aborted) setSearching(false) })
    }, 650)
    return () => { clearTimeout(timeout); controller.abort() }
  }, [query])
  const featured = Object.keys(STOCKS).slice(0, 8)
  // This is a curated market snapshot, not a ranked real-time movers feed.
  const loadMarketSnapshot = async () => {
    if (marketBusy) return
    setMarketBusy(true)
    try {
      const updated = { ...marketQuotes }
      for (const symbol of featured) {
        if (updated[symbol]) continue
        try { updated[symbol] = await fetchQuote(symbol) }
        catch (error) { setSearchError(error.message); break }
      }
      setMarketQuotes(updated)
    } finally { setMarketBusy(false) }
  }

  // Avoid fetching the entire discovery catalog on page load. Only request
  // a quote when the student opens a stock; owned shares use portfolio prices.
  const stockInfo = (symbol) => quotes[symbol] || { name: STOCKS[symbol]?.name || symbol, price: backendPrices?.[symbol] || 0 }
  useEffect(() => {
    if (!detailSymbol || quotes[detailSymbol]) return
    let active = true
    fetchQuote(detailSymbol)
      .then(q => { if (active) setQuotes(old => ({ ...old, [detailSymbol]: q })) })
      .catch(() => { /* A stock can still display its historical chart if quotes are unavailable. */ })
    return () => { active = false }
  }, [detailSymbol, quotes])

  const localSymbols = [...new Set([...Object.keys(STOCKS), ...Object.keys(holdings), ...watchlist])]
  const localMatches = localSymbols.filter(t =>
    t.includes(query.trim().toUpperCase()) || stockInfo(t).name.toLowerCase().includes(query.trim().toLowerCase()))
  const matchMap = new Map(localMatches.map(symbol => [symbol, {symbol, name: stockInfo(symbol).name}]))
  for (const item of remoteResults) if (!matchMap.has(item.symbol)) matchMap.set(item.symbol, item)
  const matches = [...matchMap.values()].slice(0, 30)
  const pickStock = symbol => { setDetailSymbol(symbol); setTicker(symbol); setMsg(null) }

  const submit = async (e) => {
    e.preventDefault()
    const amt = Number(amount)
    if (!ticker) return setMsg({ ok: false, text: 'Pick a stock first.' })
    if (!Number.isFinite(amt) || amt <= 0 || Math.round(amt * 100) <= 0) return setMsg({ ok: false, text: 'Enter an amount of at least $0.01.' })
    const price = stockInfo(ticker).price
    if (!(price > 0)) return setMsg({ ok: false, text: 'Stock price unavailable. Try again later.' })
    if (mode === 'buy' && amt > cash) return setMsg({ ok: false, text: `You only have ${money(cash)} available.` })
    const ownedShares = holdings[ticker] || 0
    if (mode === 'sell' && amt > ownedShares * price + 0.005) return setMsg({ ok: false, text: 'You cannot sell more than your holdings are worth.' })
    if (mode === 'sell' && ownedShares <= 0) return setMsg({ ok: false, text: 'You do not own this stock.' })
    // Backend sells by share quantity, not by dollar amount; round down to 6 decimals.
    const shares = Math.min(ownedShares, Math.floor((amt / price) * 1_000_000) / 1_000_000)
    if (mode === 'sell' && shares <= 0) return setMsg({ ok: false, text: 'Amount is too small to sell.' })
    setBusy(true)
    try {
      await tradeStock(mode, ticker, amt, shares)
      await refreshPortfolio()
      setMsg({ ok: true, text: `${mode === 'buy' ? 'Bought' : 'Sold'} ${ticker} successfully.` })
      setAmount('')
    } catch (error) {
      setMsg({ ok: false, text: error.message })
    } finally { setBusy(false) }
  }

  const held = Object.entries(holdings)
  const profit = gain ?? 0

  return (
    <>
      <header className="page-head">
        <h1>Stocks</h1>
        <p>Practice investing with simulated cash. Nothing here is real money.</p>
      </header>

      {portfolioError && <p className="loss" role="alert">Trading backend unavailable: {portfolioError}. Start the backend to load your portfolio.</p>}
      <section className="stats">
        <div className="panel">
          <p className="muted">Total portfolio value</p>
          <p className="big">{money(total)}</p>
          <p className={profit >= 0 ? 'gain' : 'loss'}>
            {profit >= 0 ? '+' : ''}{money(profit)} total profit / loss
          </p>
          <p className="muted">Stocks {money(stockValue)}, cash {money(cash)}</p>
        </div>
        <div className="panel">
          <p className="muted">Available to invest</p>
          <p className="big">{money(cash)}</p>
          <p className="muted">Complete lessons to earn more simulated cash.</p>
        </div>
      </section>

      <section className="panel">
        <h3>Portfolio performance</h3>
        <PortfolioChart total={total} />
      </section>

      <section className="panel">
        <h3>My holdings</h3>
        {held.length === 0 ? (
          <p className="muted">You don't own any stocks yet. Search below to buy your first one.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Stock</th><th>Shares</th><th>Value</th><th></th></tr>
              </thead>
              <tbody>
                {held.map(([t, sh]) => (
                  <tr key={t}>
                    <td><button className="stock-symbol-button" onClick={() => setDetailSymbol(t)}><strong>{t}</strong> <span className="muted">{stockInfo(t).name}</span></button></td>
                    <td>{sh.toFixed(5)}</td>
                    <td>{money(sh * stockInfo(t).price)}</td>
                    <td>
                      <button className="btn ghost small" onClick={() => { setDetailSymbol(t); setTicker(t); setMode('sell') }}>Trade</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detailSymbol && <section className="panel stock-detail" aria-label={`${detailSymbol} stock details`}>
        <div className="stock-detail-head">
          <div><h3>{stockInfo(detailSymbol).name} ({detailSymbol})</h3>
            <p className="muted">Historical market prices • Simulated trading</p>
          </div>
          <button className="btn ghost small" onClick={() => setDetailSymbol('')}>Close details</button>
        </div>
        <PriceHistoryChart key={detailSymbol} symbol={detailSymbol} />
        <div className="stock-detail-actions">
          <span>Current quote: <strong>{stockInfo(detailSymbol).price > 0 ? money(stockInfo(detailSymbol).price) : 'Unavailable'}</strong></span>
          <button className="btn ghost" onClick={() => toggleWatch(detailSymbol)} aria-pressed={watchlist.includes(detailSymbol)}>{watchlist.includes(detailSymbol) ? 'Remove from watchlist' : 'Add to watchlist'}</button>
          <button className="btn" onClick={() => { setTicker(detailSymbol); setMode('buy'); setMsg(null) }}>Trade {detailSymbol}</button>
        </div>
      </section>}

      <div className="grid investing-extras">
        <section className="panel">
          <h3>My watchlist</h3>
          <p className="muted">Saved on this browser for now, without account integration.</p>
          {watchlist.length === 0 ? <p className="muted">Choose + Watch beside any stock to add it here.</p> :
            <ul className="list picks">{watchlist.map(t => <li key={t}>
              <button className="stock-symbol-button" onClick={() => pickStock(t)}><strong>{t}</strong> <span className="muted">{stockInfo(t).name}</span></button>
              <button className="btn ghost small" onClick={() => toggleWatch(t)}>Remove</button>
            </li>)}</ul>}
        </section>
        <section className="panel">
          <h3>Market snapshot</h3>
          <p className="muted">Curated example stocks; not a live ranking of market movers.</p>
          <div className="tabs history-ranges"><button type="button" className={selectedMarketView === 'featured' ? 'tab on' : 'tab'} onClick={() => setSelectedMarketView('featured')}>Featured</button>
          <button type="button" className={selectedMarketView === 'changes' ? 'tab on' : 'tab'} onClick={() => setSelectedMarketView('changes')}>Price changes</button></div>
          <button className="btn ghost small" type="button" onClick={loadMarketSnapshot} disabled={marketBusy}>{marketBusy ? 'Loading…' : 'Load market snapshot'}</button>
          <ul className="list picks">{(selectedMarketView === 'changes' ? featured.filter(t => Number.isFinite(marketQuotes[t]?.percentChange)).sort((a,b) => Math.abs(marketQuotes[b].percentChange) - Math.abs(marketQuotes[a].percentChange)) : featured).map(t => <li key={t}>
            <button className="stock-symbol-button" onClick={() => pickStock(t)}><strong>{t}</strong> <span className="muted">{STOCKS[t].name}</span></button>
            <span>{marketQuotes[t] ? `${money(marketQuotes[t].price)}${Number.isFinite(marketQuotes[t].percentChange) ? ` (${marketQuotes[t].percentChange > 0 ? '+' : ''}${marketQuotes[t].percentChange.toFixed(2)}%)` : ''}` : '—'}</span>
          </li>)}</ul>
        </section>
      </div>

      <div className="grid">
        <section className="panel">
          <h3>Discover stocks</h3>
          <label className="field">
            <span>Search by ticker or company</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try AAPL or Microsoft" />
          </label>
          <ul className="list picks">
            {matches.length === 0 && !searching && <li className="muted">No matches. Try a different ticker.</li>}
            {matches.map(({symbol: t, name}) => (
              <li key={t}>
                <div><button className="stock-symbol-button" onClick={() => pickStock(t)}><strong>{t}</strong> <span className="muted">{name}</span></button></div>
                <span>{stockInfo(t).price > 0 ? money(stockInfo(t).price) : 'View quote'}</span>
                <button type="button" className="btn ghost small" aria-label={`${watchlist.includes(t) ? 'Remove' : 'Add'} ${t} ${watchlist.includes(t) ? 'from' : 'to'} watchlist`} onClick={() => toggleWatch(t)}>{watchlist.includes(t) ? 'Watching' : '+ Watch'}</button>
                <button className="btn ghost small" onClick={() => { pickStock(t); setMode('buy') }}>Trade</button>
              </li>
            ))}
          </ul>
          {searching && <p className="muted" role="status">Searching stock symbols…</p>}
          {searchError && <p className="loss" role="status">{searchError}</p>}
          <p className="note">Search uses Twelve Data. Prices load on selection to save API credits. Educational use only.</p>
        </section>

        <section className="panel">
          <h3>Simulated trade</h3>
          {!ticker ? (
            <p className="muted">Select a stock from your holdings or the discovery list.</p>
          ) : (
            <form onSubmit={submit}>
              <p><strong>{ticker}</strong> at {stockInfo(ticker).price > 0 ? money(stockInfo(ticker).price) : 'Quote loading or unavailable'}</p>
              <div className="tabs">
                {['buy', 'sell'].map((m) => (
                  <button type="button" key={m} className={mode === m ? 'tab on' : 'tab'} onClick={() => setMode(m)}>
                    {m === 'buy' ? 'Buy' : 'Sell'}
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Amount in dollars</span>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25.00" />
              </label>
              <button className="btn" type="submit" disabled={busy || Boolean(portfolioError) || !(stockInfo(ticker).price > 0)}>{mode === 'buy' ? 'Buy' : 'Sell'} {ticker}</button>
            </form>
          )}
          {msg && <p className={msg.ok ? 'gain' : 'loss'} role="status">{msg.text}</p>}
        </section>
      </div>
    </>
  )
}
