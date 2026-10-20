import { LESSONS } from '../data'

export default function Lessons() {
  const label = { done: 'Completed', next: 'Up next', todo: 'Not started' }
  return (
    <>
      <header className="page-head">
        <h1>Lessons</h1>
        <p>Assigned by your teacher. Each lesson ends with a quiz.</p>
      </header>
      <section className="panel">
        <ul className="list lessons">
          {LESSONS.map((l) => (
            <li key={l.id}>
              <div>
                <strong>{l.title}</strong>
                <div className="muted">
                  {label[l.status]}
                  {l.score ? `, quiz ${l.score}%` : `, due ${l.due}`}
                </div>
              </div>
              <span className="reward">{l.xp} XP</span>
              <button className={l.status === 'next' ? 'btn' : 'btn ghost'} disabled={l.status === 'todo'}>
                {l.status === 'done' ? 'Review' : l.status === 'next' ? 'Start' : 'Locked'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
