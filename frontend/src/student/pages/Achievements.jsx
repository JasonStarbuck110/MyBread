import { ACHIEVEMENTS } from '../data'

export default function Achievements() {
  return (
    <>
      <header className="page-head">
        <h1>Achievements</h1>
        <p>{ACHIEVEMENTS.filter((a) => a.earned).length} of {ACHIEVEMENTS.length} earned</p>
      </header>
      <div className="badges">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} className={a.earned ? 'badge earned' : 'badge'}>
            <div className="badge-dot" aria-hidden="true">{a.earned ? '✓' : ''}</div>
            <strong>{a.name}</strong>
            <span className="muted">{a.desc}</span>
          </div>
        ))}
      </div>
    </>
  )
}
