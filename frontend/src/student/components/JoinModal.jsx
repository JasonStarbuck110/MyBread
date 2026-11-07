import { useEffect, useState } from 'react'

export default function JoinModal({ onJoin, onClose }) {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const join = async (e) => {
    e.preventDefault()
    setMsg(null)
    setLoading(true)

    try {
      await onJoin(code.trim().toUpperCase())
      setMsg({ ok: true, text: 'Successfully joined the class!' })
      setCode('')
    } catch (error) {
      setMsg({
        ok: false,
        text: error.message || 'Could not join this class.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Join a class"
        onClick={(e) => e.stopPropagation()}
        onSubmit={join}
      >
        <h3>Join a class</h3>

        <label className="field">
          <span>Class code from your teacher</span>
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter class code"
            required
          />
        </label>

        {msg && (
          <p className={msg.ok ? 'gain' : 'loss'} role="status">
            {msg.text}
          </p>
        )}

        <div className="modal-actions">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Joining...' : 'Join class'}
          </button>
          <button className="btn ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </form>
    </div>
  )
}