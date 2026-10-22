import LevelRing from '../components/LevelRing'
import { STUDENT, QUESTS, ASSIGNED, money } from '../data'
import { getLevelInfo } from '../../shared/mockData'

export default function Home({ total, cash, xp, lessons, setPage, onOpenLesson, classes, onJoin }) {
  const next = lessons.find((l) => l.status === 'next')
  const { level, xpNext } = getLevelInfo(xp)
  const assigned = ASSIGNED.filter((a) => !a.lessonId || lessons.find((l) => l.id === a.lessonId)?.status !== 'done')
  return (
    <>
      <header className="page-head head-row">
        <div>
          <h1>Good to see you, {STUDENT.name}</h1>
          <p>{classes.join(' and ')}</p>
        </div>
        <button className="btn" onClick={onJoin}>Join class</button>
      </header>

      <section className="hero">
        <LevelRing level={level} xp={xp} xpNext={xpNext} />
        <div className="hero-body">
          <h2>{xpNext - xp} XP to level {level + 1}</h2>
          <p>Finish "{next?.title ?? 'All lessons complete'}" to earn {next?.xp ?? 0} XP and move closer.</p>
          <button className="btn" onClick={() => next && onOpenLesson(next.id)} disabled={!next}>Continue lesson</button>
        </div>
      </section>

      <div className="grid">
        <section className="panel">
          <h3>Daily quests</h3>
          <ul className="list">
            {QUESTS.map((q) => (
              <li key={q.id}>
                <div>
                  <strong>{q.text}</strong>
                  <div className="bar"><span style={{ width: `${(q.done / q.goal) * 100}%` }} /></div>
                </div>
                <span className="reward">{q.reward}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h3>Your portfolio</h3>
          <p className="big">{money(total)}</p>
          <p className="muted">{money(cash)} available to invest</p>
          <button className="btn ghost" onClick={() => setPage('stocks')}>Open stocks</button>
        </section>
      </div>

      <section className="panel">
        <h3>Assigned</h3>
        <ul className="list">
          {assigned.map((a) => (
            <li key={a.id}>
              <div>
                <strong>{a.title}</strong>
                <div className="muted">{a.type}, due {a.due}</div>
              </div>
              <button className="btn ghost small" onClick={() => setPage(a.go)}>Open</button>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
