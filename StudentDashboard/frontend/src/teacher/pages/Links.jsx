import { useState } from 'react'
import { useLinks, linkKind } from '../../shared/useLinks'

export default function Links() {
  const [links, setLinks] = useLinks()
  const blank = { title: '', url: '' }
  const [form, setForm] = useState(blank)
  const [err, setErr] = useState('')
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

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

  return (
    <>
      <div className="t-page-header">
        <div>
          <h1>Links</h1>
          <p>Add trusted websites and videos. Students see these in their Links tab.</p>
        </div>
      </div>

      <div className="t-card">
        <h2>Links students can see</h2>
        {links.length === 0 && <div className="t-nothing-here">No links yet. Add one below.</div>}
        {links.map((l) => (
          <div className="t-row" key={l.id}>
            <div className="t-row-text">
              <a className="t-link" href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a>
              <div className="t-row-subtitle">{linkKind(l.url)}</div>
            </div>
            <button className="t-btn t-btn-outline t-btn-small" onClick={() => setLinks(links.filter((x) => x.id !== l.id))}>Remove</button>
          </div>
        ))}
      </div>

      <div className="t-card">
        <h2>Add a link</h2>
        <form onSubmit={add}>
          <label className="t-field"><span>Web address</span>
            <input value={form.url} onChange={set('url')} required />
          </label>
          <label className="t-field"><span>Title (optional)</span>
            <input value={form.title} onChange={set('title')} />
          </label>
          <button className="t-btn t-btn-green" type="submit">Add link</button>
        </form>
        {err && <p className="t-red" role="alert" style={{ marginTop: 12 }}>{err}</p>}
      </div>
    </>
  )
}
