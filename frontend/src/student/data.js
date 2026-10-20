/* ---------- Mock data (prototype only) ---------- */
export const STUDENT = {
  name: 'Alex',
  level: 3,
  xp: 340,
  xpNext: 500,
  coins: 120,
  className: 'Personal Finance, Period 3',
}

// Sample prices. Later: replace with Twelve Data responses from backend.
export const STOCKS = {
  AAPL: { name: 'Apple', price: 342.7 },
  MSFT: { name: 'Microsoft', price: 421.15 },
  NVDA: { name: 'NVIDIA', price: 138.4 },
  GOOGL: { name: 'Alphabet', price: 176.9 },
  AMZN: { name: 'Amazon', price: 201.35 },
  TSLA: { name: 'Tesla', price: 255.6 },
}

export const LESSONS = [
  { id: 1, title: 'What is a stock?', xp: 50, status: 'done', score: 90, due: 'Oct 8' },
  { id: 2, title: 'Risk and reward', xp: 50, status: 'done', score: 80, due: 'Oct 12' },
  { id: 3, title: 'Diversification', xp: 75, status: 'next', due: 'Oct 22' },
  { id: 4, title: 'Bull and bear markets', xp: 75, status: 'todo', due: 'Oct 29' },
  { id: 5, title: 'Reading a stock chart', xp: 100, status: 'todo', due: 'Nov 5' },
]

export const QUESTS = [
  { id: 1, text: 'Finish one lesson', done: 0, goal: 1, reward: '25 XP' },
  { id: 2, text: 'Score 80% or higher on a quiz', done: 0, goal: 1, reward: '15 coins' },
  { id: 3, text: 'Look up a new stock', done: 2, goal: 3, reward: '10 XP' },
]

export const ACHIEVEMENTS = [
  { id: 1, name: 'First slice', desc: 'Finish your first lesson.', earned: true },
  { id: 2, name: 'Quiz whiz', desc: 'Score 90% or higher on a quiz.', earned: true },
  { id: 3, name: 'First trade', desc: 'Buy your first simulated stock.', earned: true },
  { id: 4, name: 'Spread it out', desc: 'Hold 3 different stocks at once.', earned: false },
  { id: 5, name: 'Three-day streak', desc: 'Complete a quest 3 days in a row.', earned: false },
  { id: 6, name: 'Level 5', desc: 'Reach level 5.', earned: false },
]

// Prototype class codes. Later: validated by the backend.
export const CLASSES_DB = { 'BRD-4821': 'Personal Finance, Period 3', 'BRD-7310': 'Economics, Period 5' }

export const ASSIGNED = [
  { id: 1, title: 'Diversification', type: 'Lesson', due: 'Oct 22', go: 'lessons' },
  { id: 2, title: 'Diversification quiz', type: 'Quiz', due: 'Oct 22', go: 'lessons' },
  { id: 3, title: 'Bull and bear markets', type: 'Lesson', due: 'Oct 29', go: 'lessons' },
  { id: 4, title: 'Hold 3 different stocks', type: 'Practice', due: 'Nov 1', go: 'stocks' },
]

export const CLASSMATES = [
  { name: 'Maya', value: 538 },
  { name: 'Jordan', value: 497 },
  { name: 'Sam', value: 561 },
  { name: 'Priya', value: 512 },
  { name: 'Chris', value: 489 },
]

export const LINKS = [
  { id: 1, title: 'Investor.gov (U.S. SEC)', url: 'https://www.investor.gov' },
  { id: 2, title: 'Jump$tart Coalition', url: 'https://www.jumpstart.org' },
]

export const money = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
