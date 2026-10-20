import { useState } from 'react'

export default function Links({ links, setLinks }) {
  const blank = { title: '', url: '' }
  const [form, setForm] = useState(blank)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const add = (e) => {
    e.preventDefault()
    let url = form.url.trim()
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    let host = ''
    try { host = new URL(url).hostname.replace(/^www\./, '') } catch { /* handled below */ }
    if (!host.includes('.')) return setErr('Enter a valid web address, like https://www.investor.gov')
    setLinks([...links, { id: Date.now(), title: form.title.trim() || host, url }])
    setForm(blank)
    setErr('')
  }

  const kind = (url) => (/youtube\.com|youtu\.be/.test(url) ? 'Video' : 'Website')

  return (
    <>
      <header className="page-head">
        <h1>Links</h1>
        <p>Trusted sources that back up what you learn.</p>
      </header>
      <section className="panel">
        <ul className="list">
          {links.map((l) => (
            <li key={l.id}>
              <div>
                <a className="link-title" href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a>
                <div className="muted">{kind(l.url)}</div>
              </div>
              <button className="btn ghost small" onClick={() => setLinks(links.filter((x) => x.id !== l.id))}>Remove</button>
            </li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h3>Add a link</h3>
        <form onSubmit={add}>
          <label className="field"><span>Web address</span>
            <input value={form.url} onChange={set('url')} required />
          </label>
          <label className="field"><span>Title (optional)</span>
            <input value={form.title} onChange={set('title')} />
          </label>
          <button className="btn" type="submit">Add link</button>
        </form>
        {err && <p className="loss" role="alert">{err}</p>}
      </section>
    </>
  )
}
