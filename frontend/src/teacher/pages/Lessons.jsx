import ProgressBar from '../components/ProgressBar'
import { lessons, students } from '../data'
import { formatDate, getInitials, percent, isPastDue, getStatus, getLessonSummary } from '../helpers'

function Cell({ student, index }) {
  const status = getStatus(student, index)
  if (status === 'done') return <td><span className="t-box t-box-done">{student.progress[index]}%</span></td>
  if (status === 'in progress') return <td><span className="t-box t-box-progress">In progress</span></td>
  if (status === 'late') return <td><span className="t-box t-box-late">Late</span></td>
  return <td><span className="t-box t-box-empty">-</span></td>
}

export default function Lessons({ openStudent, notify }) {
  return (
    <>
      <div className="t-page-header">
        <div>
          <h1>Lessons</h1>
          <p>See who finished each lesson and how they did on the quiz.</p>
        </div>
        <button className="t-btn t-btn-green" onClick={() => notify('Coming soon')}>Assign lesson</button>
      </div>

      <div className="t-card">
        <h2>Assigned lessons</h2>
        {lessons.map((lesson, i) => {
          const s = getLessonSummary(i)
          let tag = <span className="t-tag t-tag-tan">Upcoming</span>
          if (isPastDue(lesson)) tag = <span className="t-tag">Closed</span>
          else if (s.done > 0 || s.inProgress > 0) tag = <span className="t-tag t-tag-green">Open</span>
          return (
            <div className="t-lesson-row" key={lesson.title}>
              <div>
                <div className="t-row-title">{lesson.title}</div>
                <div className="t-row-subtitle">Due {formatDate(lesson.due)}, {lesson.xp} XP</div>
              </div>
              <div>
                <div className="t-small">
                  <b>{s.done}</b> done, {s.inProgress} in progress
                  {s.late > 0 && <>, <span className="t-red"><b>{s.late}</b> late</span></>}
                </div>
                <ProgressBar value={percent(s.done, students.length)} />
              </div>
              <div>
                <div className="t-small t-gray">Quiz avg</div>
                <b>{s.average === null ? '-' : s.average + '%'}</b>
              </div>
              <div>{tag}</div>
            </div>
          )
        })}
      </div>

      <div className="t-card">
        <div className="t-card-top">
          <h2>Progress by student</h2>
          <div className="t-key">
            <span className="t-key-done">Done (quiz score)</span>
            <span className="t-key-progress">In progress</span>
            <span className="t-key-late">Late</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="t-grid-table">
            <thead>
              <tr>
                <th>Student</th>
                {lessons.map((l) => <th key={l.title}>{l.title}<div className="t-small">{formatDate(l.due)}</div></th>)}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr className="t-click-row" key={student.id} onClick={() => openStudent(student.id)}>
                  <td><div className="t-name"><div className="t-initials">{getInitials(student.name)}</div>{student.name}</div></td>
                  {lessons.map((l, i) => <Cell key={l.title} student={student} index={i} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
