import { useEffect, useState } from 'react'

// Makes a code like BRD-4821.
const makeCode = () => `BRD-${Math.floor(1000 + Math.random() * 9000)}`

export default function CreateClassModal({ onClose }) {
  const [name, setName] = useState('')
  const [created, setCreated] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const create = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setCreated({ name: trimmed, code: makeCode() })
    setName('')
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal" role="dialog" aria-modal="true" aria-label="Create a class" onClick={(e) => e.stopPropagation()} onSubmit={create}>
        <h3>Create a class</h3>
        <label className="field"><span>Class name</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Economics, Period 5" />
        </label>
        {created && (
          <p className="gain" role="status">
            Created {created.name}. Students can join with code {created.code}.
          </p>
        )}
        <p className="note">Prototype: classes aren't saved yet.</p>
        <div className="modal-actions">
          <button className="t-btn t-btn-green" type="submit">Create class</button>
          <button className="t-btn t-btn-outline" type="button" onClick={onClose}>Close</button>
        </div>
      </form>
    </div>
  )
}