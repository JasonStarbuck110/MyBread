const SHARE_SCALE = 1_000_000

async function request(path, options = {}) {
  const token = sessionStorage.getItem('mybread_token')
  if (!token) throw new Error('Please sign in to use the portfolio.')

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`/api/student${path}`, { ...options, headers })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`)
  return payload
}

export async function fetchPortfolio() {
  const data = await request('/portfolio')
  return {
    cash: data.cashCents / 100,
    holdings: Object.fromEntries(Object.entries(data.holdings || {})
      .map(([symbol, position]) => [symbol, position.sharesUnits / SHARE_SCALE])),
    stockValue: data.investmentsValueCents / 100,
    total: data.totalValueCents / 100,
    gain: data.totalGainCents / 100,
    prices: Object.fromEntries(Object.entries(data.holdings || {})
      .map(([symbol, position]) => [symbol, position.sharesUnits
        ? position.currentValueCents / 100 / (position.sharesUnits / SHARE_SCALE) : 0])),
  }
}

export async function fetchQuote(symbol) {
  const result = await request(`/stocks/${encodeURIComponent(symbol)}/quote`)
  return { name: result.companyName || symbol, price: result.priceCents / 100,
    percentChange: result.percentChange }
}

export async function tradeStock(mode, symbol, dollars, shares) {
  if (mode !== 'buy' && mode !== 'sell') throw new Error('Invalid trade type')
  const body = mode === 'buy'
    ? { symbol, amountCents: Math.round(dollars * 100) }
    : { symbol, sharesToSell: shares }
  return request(`/trades/${mode}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export async function fetchHistory(range, symbol) {
  return request(symbol
    ? `/stocks/${encodeURIComponent(symbol)}/history?range=${encodeURIComponent(range)}`
    : `/portfolio/history?range=${encodeURIComponent(range)}`)
}

export async function searchStocks(query, signal) {
  const data = await request(`/search?q=${encodeURIComponent(query)}`, { signal })
  return data.results || []
}

export function creditModuleReward(moduleId) {
  return request('/rewards/module', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleId })
  })
}

export function syncMiniRewards() {
  return request('/rewards/minis/sync', { method: 'POST' })
}
