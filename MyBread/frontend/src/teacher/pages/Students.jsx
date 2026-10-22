import { useState } from 'react'
import ProgressBar from '../components/ProgressBar'
import { lessons, students } from '../data'
import {
  formatMoney, formatChange, getInitials, percent, countLessonsDone, getQuizAverage,
  getLevel, getPortfolioValue, getProfit, getWarnings,
} from '../helpers'

export default function Students({ openStudent }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  let list = students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
  if (filter === 'help') list = list.filter((s) => getWarnings(s).length > 0)

  list = [...list].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <div className="t-page-header">
        <div>
          <h1>Students</h1>
          <p>Click a student to see their lessons and portfolio.</p>
        </div>
      </div>

      <div className="t-card">
        <div className="t-filters">
          <input type="search" aria-label="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select aria-label="Filter students" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All students</option>
            <option value="help">Need a check-in</option>
          </select>
        </div>

        {list.length === 0 ? (
          <div className="t-nothing-here">No students found.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Student</th><th>Level</th><th>Lessons</th><th>Quiz avg</th><th>Portfolio</th></tr>
            </thead>
            <tbody>
              {list.map((student) => {
                const done = countLessonsDone(student)
                const quizAvg = getQuizAverage(student)
                const profit = getProfit(student)
                return (
                  <tr className="t-click-row" key={student.id} onClick={() => openStudent(student.id)}>
                    <td><div className="t-name"><div className="t-initials">{getInitials(student.name)}</div>{student.name}</div></td>
                    <td>{getLevel(student)} <span className="t-small t-gray">({student.xp} XP)</span></td>
                    <td>
                      <div className="t-small-progress">
                        <ProgressBar value={percent(done, lessons.length)} />
                        <span className="t-small">{done}/{lessons.length}</span>
                      </div>
                    </td>
                    <td>{quizAvg === null ? '-' : quizAvg + '%'}</td>
                    <td>
                      {formatMoney(getPortfolioValue(student))}
                      <div className={'t-small ' + (profit >= 0 ? 't-green' : 't-red')}>{formatChange(profit)}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
