import { useEffect, useState } from 'react'
import { CLASSES_DB } from '../data'

export default function JoinModal({ classes, setClasses, onClose }) {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const join = (e) => {
    e.preventDefault()
    const name = CLASSES_DB[code.trim().toUpperCase()]
    if (!name) return setMsg({ ok: false, text: "That code wasn't found. Check it with your teacher." })
    if (classes.includes(name)) return setMsg({ ok: false, text: `You're already in ${name}.` })
    setClasses([...classes, name])
    setMsg({ ok: true, text: `Joined ${name}.` })
    setCode('')
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal" role="dialog" aria-modal="true" aria-label="Join a class" onClick={(e) => e.stopPropagation()} onSubmit={join}>
        <h3>Join a class</h3>
        <label className="field"><span>Class code from your teacher</span>
          <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="BRD-7310" />
        </label>
        {msg && <p className={msg.ok ? 'gain' : 'loss'} role="status">{msg.text}</p>}
        <p className="note">Prototype: try BRD-7310.</p>
        <div className="modal-actions">
          <button className="btn" type="submit">Join class</button>
          <button className="btn ghost" type="button" onClick={onClose}>Close</button>
        </div>
      </form>
    </div>
  )
}
