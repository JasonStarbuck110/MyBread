// ONE fake class shared by the student and teacher dashboards, so both show the same people.
// When the backend is ready, this file is what gets replaced by API calls.

export const STARTING_CASH = 500
export const TODAY = '2026-10-20' // fixed demo date so late/closed lessons stay the same
export const CLASS_NAME = 'Personal Finance, Period 3'
export const TEACHER_NAME = 'Ms. Rivera'
export const CURRENT_STUDENT_ID = 1 // the student whose dashboard you see (Alex)

export const LESSONS = [
  { id: 1, title: 'What is a stock?', xp: 50, due: '2026-10-08' },
  { id: 2, title: 'Risk and reward', xp: 50, due: '2026-10-12' },
  { id: 3, title: 'Diversification', xp: 75, due: '2026-10-22' },
  { id: 4, title: 'Bull and bear markets', xp: 75, due: '2026-10-29' },
  { id: 5, title: 'Reading a stock chart', xp: 100, due: '2026-11-05' },
]

// Sample prices. Later: replace with Twelve Data responses from your backend.
export const STOCK_PRICES = {
  AAPL: { name: 'Apple', price: 342.7 },
  MSFT: { name: 'Microsoft', price: 421.15 },
  NVDA: { name: 'NVIDIA', price: 138.4 },
  GOOGL: { name: 'Alphabet', price: 176.9 },
  AMZN: { name: 'Amazon', price: 201.35 },
  TSLA: { name: 'Tesla', price: 255.6 },
}

// XP needed to reach each level (level 1 starts at 0). Placeholder until the gamification rules are final.
const LEVEL_STARTS = [0, 100, 250, 500, 800, 1200]
export function getLevelInfo(xp) {
  let level = 1
  LEVEL_STARTS.forEach((start, i) => { if (xp >= start) level = i + 1 })
  return { level, xpNext: LEVEL_STARTS[level] ?? xp }
}

export function portfolioValue(student) {
  return student.holdings.reduce(
    (sum, h) => sum + h.shares * STOCK_PRICES[h.ticker].price,
    student.cash
  )
}

// progress has one entry per lesson: a number = finished (that's the quiz score),
// or 'in progress' / 'not started'. daysAgo = how many days ago the stock was bought.
export const LINKS = [
  { id: 1, title: 'Investor.gov (U.S. SEC)', url: 'https://www.investor.gov' },
  { id: 2, title: 'Jump$tart Coalition', url: 'https://www.jumpstart.org' },
]

export const ROSTER = [
  {
    id: 1, name: 'Alex Johnson', xp: 340,
    progress: [90, 80, 'not started', 'not started', 'not started'],
    cash: 500,
    holdings: [{ ticker: 'AAPL', shares: 0.0438, daysAgo: 2 }],
  },
  {
    id: 2, name: 'Maya Patel', xp: 360,
    progress: [95, 90, 'in progress', 'not started', 'not started'],
    cash: 503.73,
    holdings: [{ ticker: 'AAPL', shares: 0.1, daysAgo: 3 }],
  },
  {
    id: 3, name: 'Jordan Lee', xp: 410,
    progress: [75, 85, 85, 'not started', 'not started'],
    cash: 361.18,
    holdings: [{ ticker: 'AAPL', shares: 0.39632, daysAgo: 1 }],
  },
  {
    id: 4, name: 'Sam Carter', xp: 520,
    progress: [100, 90, 100, 'not started', 'not started'],
    cash: 366.05,
    holdings: [{ ticker: 'NVDA', shares: 0.8, daysAgo: 1 }, { ticker: 'MSFT', shares: 0.2, daysAgo: 4 }],
  },
  {
    id: 5, name: 'Priya Shah', xp: 250,
    progress: [85, 75, 'in progress', 'not started', 'not started'],
    cash: 463.68,
    holdings: [{ ticker: 'AMZN', shares: 0.24, daysAgo: 9 }],
  },
]
