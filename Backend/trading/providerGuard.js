var cooldownUntil = 0;
const pending = new Map();

async function providerRequest(url, key) {
    if (Date.now() < cooldownUntil) {
        const seconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
        const err = new Error(`Market data rate limit reached. Retry in about ${seconds} seconds.`);
        err.status = 429;
        throw err;
    }
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (response.status === 429) {
            const headerSeconds = Number(response.headers.get('retry-after'));
            const delay = Number.isFinite(headerSeconds) && headerSeconds > 0
                ? Math.min(headerSeconds * 1000, 60 * 60 * 1000)
                : 60_000;
            cooldownUntil = Date.now() + delay;
            const err = new Error('Twelve Data rate limit reached. Please try again later.');
            err.status = 429;
            throw err;
        }
        if (!response.ok) {
            const err = new Error(`Market data provider error (${response.status})`);
            err.status = response.status;
            throw err;
        }
        return response.json();
    })();
    pending.set(key, task);
    try { return await task; } finally { pending.delete(key); }
}

module.exports = { providerRequest };
