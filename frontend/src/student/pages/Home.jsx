import LevelRing from '../components/LevelRing'
import { STUDENT, LESSONS, QUESTS, ASSIGNED, money } from '../data'

export default function Home({ total, cash, setPage, classes, onJoin }) {
  const next = LESSONS.find((l) => l.status === 'next')
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
        <LevelRing level={STUDENT.level} xp={STUDENT.xp} xpNext={STUDENT.xpNext} />
        <div className="hero-body">
          <h2>{STUDENT.xpNext - STUDENT.xp} XP to level {STUDENT.level + 1}</h2>
          <p>Finish "{next.title}" to earn {next.xp} XP and move closer.</p>
          <button className="btn" onClick={() => setPage('lessons')}>Continue lesson</button>
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
          {ASSIGNED.map((a) => (
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
