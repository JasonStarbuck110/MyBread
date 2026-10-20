// Requests go through the Vite development proxy to the Express backend.
// Never put a Twelve Data API key in this file or in React environment variables.
async function request(path, options = {}) {
    const response = await fetch(`/api${path}`, {
        ...options,
        credentials: 'same-origin',
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        }
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(result?.error || `Request failed (${response.status})`);
    }
    if (result === null) {
        throw new Error('The server returned an invalid response.');
    }
    return result;
}

export const api = {
    getPortfolio: () => request('/portfolio'),
    getPortfolioHistory: (range) => request(`/portfolio/history?range=${encodeURIComponent(range)}`),
    getStockHistory: (symbol, range) => request(`/stocks/${encodeURIComponent(symbol)}/history?range=${encodeURIComponent(range)}`),
    getQuote: (symbol) => request(`/stocks/${encodeURIComponent(symbol)}`),
    buy: (symbol, amountCents) => request('/trades/buy', {
        method: 'POST',
        body: JSON.stringify({ symbol, amountCents })
    }),
    sell: (symbol, sharesToSell) => request('/trades/sell', {
        method: 'POST',
        body: JSON.stringify({ symbol, sharesToSell })
    })
};
