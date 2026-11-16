import { useEffect, useState } from 'react'

// Placeholder for the backend. Replace the body with a fetch to POST /api/classes that returns { name, code }.
// The server should generate the join code and make sure it is unique; this modal just shows what comes back.
const createClassRequest = async (name) => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return { name, code: `BRD-${Math.floor(1000 + Math.random() * 9000)}` }
}

export default function CreateClassModal({ onClose }) {
  const [name, setName] = useState('')
  const [created, setCreated] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const create = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || submitting) return
    setError('')
    setCreated(null)
    setSubmitting(true)
    try {
      setCreated(await createClassRequest(trimmed))
      setName('')
    } catch (err) {
      setError(err.message || 'Could not create the class. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal" role="dialog" aria-modal="true" aria-label="New class" onClick={(e) => e.stopPropagation()} onSubmit={create}>
        <h3>New class</h3>
        <label className="field"><span>Name</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {created && (
          <p className="gain" role="status">
            Created {created.name}. Students can join with code {created.code}.
          </p>
        )}
        {error && <p className="loss" role="alert">{error}</p>}
        <div className="modal-actions">
          <button className="t-btn t-btn-green" type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</button>
          <button className="t-btn t-btn-outline" type="button" onClick={onClose}>Close</button>
        </div>
      </form>
    </div>
  )
}