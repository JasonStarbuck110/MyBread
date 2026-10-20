import { STUDENT, CLASSMATES, money } from '../data'

export default function Leaderboards({ total }) {
  const rows = [...CLASSMATES, { name: STUDENT.name, value: total, you: true }]
    .sort((a, b) => b.value - a.value)
  return (
    <>
      <header className="page-head">
        <h1>Leaderboards</h1>
        <p>{STUDENT.className}, ranked by portfolio value</p>
      </header>
      <section className="panel">
        <table>
          <thead><tr><th>Rank</th><th>Student</th><th>Portfolio value</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} className={r.you ? 'you' : ''}>
                <td>{i + 1}</td>
                <td>{r.name}{r.you ? ' (you)' : ''}</td>
                <td>{money(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
