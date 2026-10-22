import { STUDENT } from '../data'
import { getLevelInfo } from '../../shared/mockData'

export default function Account({ classes, xp, onJoin, onLogout }) {
  return (
    <>
      <header className="page-head">
        <h1>Account</h1>
      </header>
      <section className="panel">
        <h3>Profile</h3>
        <dl className="profile">
          <dt>Name</dt><dd>{STUDENT.fullName}</dd>
          <dt>Role</dt><dd>Student</dd>
          <dt>Level</dt><dd>{getLevelInfo(xp).level}, {xp} XP</dd>
        </dl>
      </section>
      <section className="panel">
        <h3>My classes</h3>
        <ul className="list">
          {classes.map((c) => <li key={c}><strong>{c}</strong></li>)}
        </ul>
        <button className="btn" onClick={onJoin}>Join class</button>
      </section>
      <button className="btn" onClick={onLogout}>Log out</button>
    </>
  )
}
