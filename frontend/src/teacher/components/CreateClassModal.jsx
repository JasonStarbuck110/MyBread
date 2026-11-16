import { useEffect, useState } from 'react'
import { createClass } from '../../shared/classes'

// Popup for the "Create class" button. Saves the class with POST /api/classes;
// the backend makes the enrollment code and we show it to the teacher.
export default function CreateClassModal({ token, onCreated, onClose }) {
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
      const data = await createClass(token, trimmed)
      const newClass = data.class || data
      setCreated(newClass)
      setName('')
      onCreated(newClass)
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
        <label className="field"><span>Class name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Example: Personal Finance, Period 4"
            maxLength={100}
            required
          />
        </label>
        {created && (
          <p className="gain" role="status">
            Created {created.name}. Students can join with code <strong>{created.enrollmentCode}</strong>.
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
