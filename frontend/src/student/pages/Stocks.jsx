import { useState } from 'react'
import PortfolioChart from '../components/PortfolioChart'
import { STOCKS, STARTING_CASH, money } from '../data'

export default function Stocks({ cash, setCash, holdings, setHoldings, total, stockValue }) {
  const [query, setQuery] = useState('')
  const [ticker, setTicker] = useState('')
  const [mode, setMode] = useState('buy')
  const [amount, setAmount] = useState('')
  const [msg, setMsg] = useState(null)

  const matches = Object.keys(STOCKS).filter(
    (t) =>
      t.includes(query.trim().toUpperCase()) ||
      STOCKS[t].name.toLowerCase().includes(query.trim().toLowerCase())
  )

  const submit = (e) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!ticker) return setMsg({ ok: false, text: 'Pick a stock first.' })
    if (!(amt > 0)) return setMsg({ ok: false, text: 'Enter an amount greater than $0.' })
    const price = STOCKS[ticker].price
    const owned = (holdings[ticker] || 0) * price

    if (mode === 'buy') {
      if (amt > cash) return setMsg({ ok: false, text: `You only have ${money(cash)} available.` })
      setCash(cash - amt)
      setHoldings({ ...holdings, [ticker]: (holdings[ticker] || 0) + amt / price })
      setMsg({ ok: true, text: `Bought ${money(amt)} of ${ticker}.` })
    } else {
      if (amt > owned + 0.005) return setMsg({ ok: false, text: `You only own ${money(owned)} of ${ticker}.` })
      const sold = Math.min(amt, owned)
      const next = { ...holdings, [ticker]: (holdings[ticker] || 0) - sold / price }
      if (next[ticker] < 1e-6) delete next[ticker]
      setCash(cash + sold)
      setHoldings(next)
      setMsg({ ok: true, text: `Sold ${money(sold)} of ${ticker}.` })
    }
    setAmount('')
  }

  const held = Object.entries(holdings)
  const profit = total - STARTING_CASH

  return (
    <>
      <header className="page-head">
        <h1>Stocks</h1>
        <p>Practice investing with simulated cash. Nothing here is real money.</p>
      </header>

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
                    <td><strong>{t}</strong> <span className="muted">{STOCKS[t].name}</span></td>
                    <td>{sh.toFixed(5)}</td>
                    <td>{money(sh * STOCKS[t].price)}</td>
                    <td>
                      <button className="btn ghost small" onClick={() => { setTicker(t); setMode('sell') }}>Trade</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid">
        <section className="panel">
          <h3>Discover stocks</h3>
          <label className="field">
            <span>Search by ticker or company</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try AAPL or Microsoft" />
          </label>
          <ul className="list picks">
            {matches.length === 0 && <li className="muted">No matches. Try a different ticker.</li>}
            {matches.map((t) => (
              <li key={t}>
                <div>
                  <strong>{t}</strong> <span className="muted">{STOCKS[t].name}</span>
                </div>
                <span>{money(STOCKS[t].price)}</span>
                <button className="btn ghost small" onClick={() => { setTicker(t); setMode('buy') }}>Select</button>
              </li>
            ))}
          </ul>
          <p className="note">Suggestions are not recommendations.</p>
        </section>

        <section className="panel">
          <h3>Simulated trade</h3>
          {!ticker ? (
            <p className="muted">Select a stock from your holdings or the discovery list.</p>
          ) : (
            <form onSubmit={submit}>
              <p><strong>{ticker}</strong> at {money(STOCKS[ticker].price)}</p>
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
              <button className="btn" type="submit">{mode === 'buy' ? 'Buy' : 'Sell'} {ticker}</button>
            </form>
          )}
          {msg && <p className={msg.ok ? 'gain' : 'loss'} role="status">{msg.text}</p>}
        </section>
      </div>
    </>
  )
}
