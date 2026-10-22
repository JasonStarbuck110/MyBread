import { linkKind } from '../../shared/useLinks'

export default function Links({ links }) {
  return (
    <>
      <header className="page-head">
        <h1>Links</h1>
        <p>Trusted sources your teacher chose to back up what you learn.</p>
      </header>
      <section className="panel">
        {links.length === 0 ? (
          <p className="muted">Your teacher hasn't added any links yet.</p>
        ) : (
          <ul className="list">
            {links.map((l) => (
              <li key={l.id}>
                <div>
                  <a className="link-title" href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a>
                  <div className="muted">{linkKind(l.url)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
