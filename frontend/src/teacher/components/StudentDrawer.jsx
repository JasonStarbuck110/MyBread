import { lessons, stockPrices } from '../data'
import {
  formatMoney, formatChange, formatDate, getStatus, countLessonsDone,
  getQuizAverage, getLevel, getHoldingValue, getPortfolioValue, getProfit, getWarnings,
} from '../helpers'

function LessonTag({ student, index }) {
  const status = getStatus(student, index)
  if (status === 'done') return <span className="t-tag t-tag-green">{student.progress[index]}%</span>
  if (status === 'in progress') return <span className="t-tag t-tag-tan">In progress</span>
  if (status === 'late') return <span className="t-tag t-tag-red">Late</span>
  return <span className="t-tag">Not started</span>
}

export default function StudentDrawer({ student, onClose }) {
  const quizAvg = getQuizAverage(student)
  const profit = getProfit(student)
  const warnings = getWarnings(student)

  return (
    <>
      <div className="t-drawer-top">
        <div>
          <h2>{student.name}</h2>
          <p className="t-gray">Level {getLevel(student)}</p>
        </div>
        <button className="t-close-btn" onClick={onClose} aria-label="Close">&times;</button>
      </div>

      {warnings.length > 0 && (
        <p style={{ marginBottom: 16 }}>
          {warnings.map((w) => <span key={w} className="t-tag t-tag-red" style={{ marginRight: 6 }}>{w}</span>)}
        </p>
      )}

      <div className="t-student-numbers">
        <div><b>{student.xp}</b><span>XP</span></div>
        <div><b>{quizAvg === null ? '-' : quizAvg + '%'}</b><span>Quiz avg</span></div>
        <div><b>{countLessonsDone(student)}/{lessons.length}</b><span>Lessons</span></div>
      </div>

      <div className="t-card">
        <h3>Lessons</h3>
        {lessons.map((lesson, i) => (
          <div className="t-row" key={lesson.title}>
            <div className="t-row-text">
              <div className="t-row-title">{lesson.title}</div>
              <div className="t-row-subtitle">Due {formatDate(lesson.due)}</div>
            </div>
            <LessonTag student={student} index={i} />
          </div>
        ))}
      </div>

      <div className="t-card">
        <h3>Portfolio: {formatMoney(getPortfolioValue(student))}</h3>
        <p className={'t-small ' + (profit >= 0 ? 't-green' : 't-red')}>{formatChange(profit)} since start</p>
        <p className="t-small t-gray" style={{ margin: '4px 0 10px' }}>Cash: {formatMoney(student.cash)}</p>
        {student.holdings.length === 0 ? (
          <div className="t-nothing-here">No stocks yet.</div>
        ) : (
          <table>
            <thead><tr><th>Stock</th><th>Shares</th><th>Value</th></tr></thead>
            <tbody>
              {student.holdings.map((h) => (
                <tr key={h.ticker}>
                  <td><b>{h.ticker}</b> <span className="t-gray">{stockPrices[h.ticker].name}</span></td>
                  <td>{h.shares}</td>
                  <td>{formatMoney(getHoldingValue(h))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="t-btn t-btn-outline" onClick={onClose}>Close</button>
    </>
  )
}
