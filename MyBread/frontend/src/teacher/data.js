// The class (students, lessons, prices) lives in ../shared/mockData.js so the student dashboard
// shows the same people. When the backend is ready, load these from the API instead.
import { CLASS_NAME, TEACHER_NAME, TODAY, STARTING_CASH, LESSONS, STOCK_PRICES, ROSTER, portfolioValue } from '../shared/mockData'

export { STARTING_CASH }
export const today = new Date(TODAY)
export const teacher = { name: TEACHER_NAME, className: CLASS_NAME }
export const lessons = LESSONS
export const stockPrices = STOCK_PRICES
export const students = ROSTER

// Sample class average portfolio for the last 30 days (for the chart).
// Scaled so it starts at the starting cash and ends at today's real class average.
const shape = [500, 499, 501, 500, 498, 497, 499, 498, 496, 497,
  499, 500, 502, 501, 500, 503, 504, 503, 505, 504,
  506, 505, 507, 506, 508, 507, 509, 508, 510, 509]
const classAverage = ROSTER.reduce((sum, st) => sum + portfolioValue(st), 0) / ROSTER.length
export const chartData = shape.map(
  (v) => STARTING_CASH + ((v - STARTING_CASH) * (classAverage - STARTING_CASH)) / (shape[shape.length - 1] - STARTING_CASH)
)
