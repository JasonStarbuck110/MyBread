import ProgressBar from '../components/ProgressBar'
import { teacher, lessons, students, STARTING_CASH } from '../data'
import {
  formatMoney, formatChange, formatDate, daysAgoText, getInitials, percent, getQuizAverage,
  getPortfolioValue, getWarnings, getLessonSummary, getCurrentLesson, getAllTrades,
} from '../helpers'

export default function Dashboard({ setPage }) {
  const lessonIndex = getCurrentLesson()
  const lesson = lessons[lessonIndex]
  const summary = getLessonSummary(lessonIndex)
  const notStarted = students.length - summary.done - summary.inProgress
  const donePercent = percent(summary.done, students.length)
  const circumference = 2 * Math.PI * 62
  const ringOffset = circumference * (1 - donePercent / 100)

  let quizTotal = 0
  let quizCount = 0
  let portfolioTotal = 0
  const needHelp = []
  for (const student of students) {
    const avg = getQuizAverage(student)
    if (avg !== null) { quizTotal += avg; quizCount++ }
    portfolioTotal += getPortfolioValue(student)
    if (getWarnings(student).length > 0) needHelp.push(student)
  }
  const onTrack = students.length - needHelp.length
  const classQuizAvg = Math.round(quizTotal / quizCount)
  const avgPortfolio = portfolioTotal / students.length
  const profitClass = avgPortfolio < STARTING_CASH ? 't-red' : 't-green'

  return (
    <>
      <div className="t-page-header">
        <div>
          <h1>Welcome back, {teacher.name}</h1>
          <p>{teacher.className}, {students.length} students</p>
        </div>
      </div>

      <div className="t-banner">
        <div className="t-circle">
          <svg viewBox="0 0 150 150">
            <circle cx="75" cy="75" r="62" fill="none" stroke="#6a5549" strokeWidth="14" />
            <circle cx="75" cy="75" r="62" fill="none" stroke="#C19A6B" strokeWidth="14"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={ringOffset} />
          </svg>
          <div className="t-circle-text">
            <b>{donePercent}%</b>
            <span>finished</span>
          </div>
        </div>
        <div>
          <h2>{summary.done} of {students.length} finished "{lesson.title}"</h2>
          <p>Due {formatDate(lesson.due)}. {summary.inProgress} in progress, {notStarted} haven't started.</p>
          <div className="t-banner-buttons">
            <button className="t-btn t-btn-tan" onClick={() => setPage('lessons')}>View lesson progress</button>
          </div>
        </div>
      </div>

      <div className="t-two-columns" style={{ marginBottom: 22 }}>
        <div className="t-card t-number-card">
          <div className="t-label">Class quiz average</div>
          <div className="t-number">{classQuizAvg}%</div>
          <div className="t-note">All finished quizzes</div>
        </div>
        <div className="t-card t-number-card">
          <div className="t-label">Avg portfolio</div>
          <div className="t-number">{formatMoney(avgPortfolio)}</div>
          <div className={'t-note ' + profitClass}>{formatChange(avgPortfolio - STARTING_CASH)} since start</div>
        </div>
      </div>

      <div className="t-two-columns">
        <div className="t-card">
          <div className="t-card-top">
            <h2>Need a check-in</h2>
            <span className="t-small t-gray">{onTrack} of {students.length} on track</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <ProgressBar value={percent(onTrack, students.length)} />
          </div>
          {needHelp.length === 0 && <div className="t-nothing-here">Everyone is on track! No late lessons or low scores.</div>}
          {needHelp.map((student) => (
            <div className="t-row" key={student.id}>
              <div className="t-initials">{getInitials(student.name)}</div>
              <div className="t-row-text">
                <div className="t-row-title">{student.name}</div>
                <div className="t-row-subtitle">{getWarnings(student).join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="t-card">
          <h2>Recent trades</h2>
          {getAllTrades().slice(0, 5).map((trade) => (
            <div className="t-row" key={trade.student.id + trade.holding.ticker}>
              <div className="t-initials">{getInitials(trade.student.name)}</div>
              <div className="t-row-text">
                <div className="t-row-title">{trade.student.name}</div>
                <div className="t-row-subtitle">Bought {trade.holding.ticker}</div>
              </div>
              <span className="t-small t-gray">{daysAgoText(trade.holding.daysAgo)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="t-card">
        <div className="t-card-top">
          <h2>Lesson completion</h2>
          <span className="t-small t-gray">Students finished</span>
        </div>
        {lessons.map((l, i) => {
          const s = getLessonSummary(i)
          return (
            <div className="t-lesson-bar-row" key={l.title}>
              <div>
                <div className="t-row-title">{l.title}</div>
                <div className="t-row-subtitle">Due {formatDate(l.due)}</div>
              </div>
              <ProgressBar value={percent(s.done, students.length)} />
              <b style={{ textAlign: 'right' }}>{s.done}/{students.length}</b>
            </div>
          )
        })}
      </div>
    </>
  )
}
