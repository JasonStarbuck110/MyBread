import { QUIZZES } from '../quizzes'

export default function Lessons({ lessons, onOpenLesson }) {
  const label = { done: 'Completed', next: 'Up next', todo: 'Not started' }
  return (
    <>
      <header className="page-head">
        <h1>Lessons</h1>
        <p>Assigned by your teacher. Each lesson ends with a quiz.</p>
      </header>
      <section className="panel">
        <ul className="list lessons">
          {lessons.map((l) => {
            const canOpen = Boolean(QUIZZES[l.id]) && l.status !== 'todo'
            return (
              <li key={l.id}>
                <div>
                  <strong>{l.title}</strong>
                  <div className="muted">
                    {label[l.status]}
                    {l.score ? `, quiz ${l.score}%` : `, due ${l.due}`}
                  </div>
                </div>
                <span className="reward">{l.xp} XP</span>
                <button className={l.status === 'next' ? 'btn' : 'btn ghost'} disabled={!canOpen} onClick={() => onOpenLesson(l.id)}>
                  {l.status === 'done' ? 'Review' : l.status === 'next' ? (canOpen ? 'Start' : 'Coming soon') : 'Locked'}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}
