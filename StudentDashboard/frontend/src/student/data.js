/* ---------- Mock data (prototype only) ---------- */
// The class itself (students, lessons, prices) lives in ../shared/mockData.js
// so the teacher dashboard shows the same people.
import {
  CLASS_NAME, CURRENT_STUDENT_ID, LESSONS as CLASS_LESSONS, ROSTER, STOCK_PRICES,
  STARTING_CASH, portfolioValue,
} from '../shared/mockData'

export { STARTING_CASH }

export const ME = ROSTER.find((s) => s.id === CURRENT_STUDENT_ID)
const firstName = (full) => full.split(' ')[0]
const shortDate = (iso) =>
  new Date(iso + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export const STUDENT = {
  name: firstName(ME.name),
  fullName: ME.name,
  className: CLASS_NAME,
}

export const STOCKS = STOCK_PRICES

// results = quiz scores earned this session, { lessonId: percent }, on top of what ME already finished.
// status: 'done' (quiz score kept), 'next' (the first unfinished lesson), or 'todo'
export function getLessons(results = {}) {
  let nextTaken = false
  return CLASS_LESSONS.map((l, i) => {
    const base = { id: l.id, title: l.title, xp: l.xp, due: shortDate(l.due) }
    const saved = typeof ME.progress[i] === 'number' ? ME.progress[i] : null
    const score = results[l.id] ?? saved
    if (score !== null) return { ...base, status: 'done', score }
    const status = nextTaken ? 'todo' : 'next'
    nextTaken = true
    return { ...base, status }
  })
}

export const QUESTS = [
  { id: 1, text: 'Finish one lesson', done: 0, goal: 1, reward: '25 XP' },
  { id: 2, text: 'Score 80% or higher on a quiz', done: 0, goal: 1, reward: '15 XP' },
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
export const CLASSES_DB = { 'BRD-4821': CLASS_NAME, 'BRD-7310': 'Economics, Period 5' }

export const ASSIGNED = [
  { id: 1, lessonId: 3, title: 'Diversification', type: 'Lesson', due: 'Oct 22', go: 'lessons' },
  { id: 2, lessonId: 3, title: 'Diversification quiz', type: 'Quiz', due: 'Oct 22', go: 'lessons' },
  { id: 3, lessonId: 4, title: 'Bull and bear markets', type: 'Lesson', due: 'Oct 29', go: 'lessons' },
  { id: 4, title: 'Hold 3 different stocks', type: 'Practice', due: 'Nov 1', go: 'stocks' },
]

export const CLASSMATES = ROSTER.filter((r) => r.id !== ME.id).map((r) => ({
  name: r.name,
  value: portfolioValue(r),
}))

export const money = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
