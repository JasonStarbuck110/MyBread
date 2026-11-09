import { useEffect, useState } from 'react'
import { LESSONS as curriculum } from '../../student/lessonModule/catalog'
import '../assignments.css'

async function assignmentApi(token, path, options = {}) {
	const response = await fetch(path, {
		...options,
		cache: 'no-store',
		headers: {
			Authorization: `Bearer ${token}`,
			...(options.body ? { 'Content-Type': 'application/json' } : {}),
			...options.headers
		}
	})
  const body = await response.text()
  var data

	try {
		data = body ? JSON.parse(body) : {}
	} catch {
		throw new Error('The server returned an invalid response.')
	}

	if (!response.ok) {
		throw new Error(data.error || `Request failed (${response.status})`)
	}

	return data
}

const formatTarget = a => {
  const module = curriculum.find(l => l.id === Number(a.moduleId))
  if (!module) return 'Unknown module'
  if (a.kind === 'module') return `Module ${module.id}: ${module.title}`
  if (a.kind === 'quiz') return `Module ${module.id} Quiz`
  const section = module.screens?.[a.sectionIndex]
  return section?.title || `Mini-lesson ${module.id}.${Number(a.sectionIndex) + 1}`
}

export default function Lessons({ notify, token, classes = [], classesLoading = false, classesError = '' }) {
  const [assignments, setAssignments] = useState([])
  const [students, setStudents] = useState([])
  const [classId, setClassId] = useState('')
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [moduleId, setModuleId] = useState(String(curriculum[0]?.id ?? 1))
  const [kind, setKind] = useState('module')
  const [sectionIndex, setSectionIndex] = useState('0')
  const [recipientType, setRecipientType] = useState('class')
  const [studentId, setStudentId] = useState('')
  const [due, setDue] = useState('')
  const [rewardXp, setRewardXp] = useState('50')
  const [rewardCash, setRewardCash] = useState('5.00')
  const [error, setError] = useState('')
  const selectedModule = curriculum.find(l => l.id === Number(moduleId))
  const selectedClassId = classId || String(classes[0]?._id || classes[0]?.id || '')

useEffect(() => {
	var cancelled = false

	async function loadAssignments() {
		setLoading(true)

		try {
			const data = await assignmentApi(token, '/api/assignments/mine')
			if (!cancelled) {
				setAssignments(data.assignments || [])
			}
		} catch (err) {
			if (!cancelled) setError(err.message)
		} finally {
			if (!cancelled) setLoading(false)
		}
	}

	if (token) loadAssignments()

	return () => {
		cancelled = true
	}
}, [token])

  useEffect(() => {
    var cancelled = false

    async function loadStudents() {
      if (!selectedClassId || !token) {
        setStudents([])
        return
      }

      setStudentsLoading(true)
      setStudents([])

      try {
        const data = await assignmentApi(
          token,
          `/api/classes/${encodeURIComponent(selectedClassId)}/students`
        )

        if (!cancelled) {
          setStudents(data.students || [])
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setStudentsLoading(false)
      }
    }

    loadStudents()

    return () => {
      cancelled = true
    }
  }, [token, selectedClassId])

  async function submit(event) {
    event.preventDefault()
    setError('')

    if (!selectedClassId) return setError('Create or select a class first.')
    if (!selectedModule) return setError('Select a module.')
    if (!title.trim()) return setError('Enter an assignment title.')
    if (!instructions.trim()) return setError('Enter assignment instructions.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(`${due}T12:00:00Z`))) {
      return setError('Choose a valid due date.')
    }
    if (recipientType === 'student' && !students.some(student => String(student.id) === studentId)) {
      return setError('Select an enrolled student.')
    }
    if (kind === 'mini' && !selectedModule.screens?.[Number(sectionIndex)]) {
      return setError('Select a mini-lesson.')
    }

    const xp = Number(rewardXp)
    const cash = Number(rewardCash)
    if (!/^\d+$/.test(rewardXp) || !Number.isSafeInteger(xp) || xp > 100000) {
      return setError('XP must be a whole number from 0 to 100,000.')
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(rewardCash) || !Number.isFinite(cash) || cash > 100000) {
      return setError('Simulated cash must be between $0 and $100,000.')
    }
    if (xp === 0 && cash === 0) {
      return setError('Choose at least one nonzero reward.')
    }
    const assignment = {
      title: title.trim(),
      instructions: instructions.trim(),
      classId: selectedClassId,
      moduleId: selectedModule.id,
      kind,
      sectionIndex: kind === 'mini' ? Number(sectionIndex) : null,
      recipientType,
      studentId: recipientType === 'student' ? studentId : null,
      dueDate: due,
      rewardXp: xp,
      rewardCashCents: Math.round(cash * 100)
    }

    setSaving(true)

    try {
      const data = await assignmentApi(token, '/api/assignments', {
        method: 'POST',
        body: JSON.stringify(assignment)
      })

      setAssignments(current => [data.assignment, ...current])
      setShowForm(false)
      setTitle('')
      setInstructions('')
      setError('')
      notify?.('Assignment published successfully')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!window.confirm('Close this assignment?')) return

    try {
      const data = await assignmentApi(
        token,
        `/api/assignments/${encodeURIComponent(id)}/close`,
        { method: 'PATCH' }
      )

      setAssignments(current =>
        current.map(assignment =>
          String(assignment._id) === String(id)
            ? data.assignment
            : assignment
        )
      )

      notify?.('Assignment closed')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="t-page-header">
        <div>
          <h1>Lessons</h1>
          <p>Assign modules, mini-lessons, or quizzes to your class or an individual student.</p>
        </div>
        <button
          type="button"
          className="t-btn t-btn-green"
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? 'Cancel' : 'Assign lesson'}
        </button>
      </div>
      <div className="t-card">
        {showForm && (
          <form className="assignment-form" onSubmit={submit}>
          <label>
            Class
            <select
              required
              value={selectedClassId}
              onChange={event => {
                setClassId(event.target.value)
                setStudentId('')
              }}
              disabled={classesLoading}
            >
              {classes.length === 0 && <option value="">No classes available</option>}
              {classes.map(classroom => (
                <option
                  key={classroom._id || classroom.id}
                  value={String(classroom._id || classroom.id)}
                >
                  {classroom.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Assignment title
            <input
              type="text"
              maxLength="150"
              required
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Enter assignment title"
            />
          </label>
          <label>
            Instructions
            <textarea
              maxLength="10000"
              required
              value={instructions}
              onChange={event => setInstructions(event.target.value)}
              placeholder="Explain what students need to complete"
            />
          </label>
            <label>
              Module
              <select
                value={moduleId}
                onChange={e => {
                  setModuleId(e.target.value)
                  setSectionIndex('0')
                }}
              >
                {curriculum.map(l => (
                  <option key={l.id} value={l.id}>
                    {`Module ${l.id}: ${l.title}`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Assign
              <select value={kind} onChange={e => setKind(e.target.value)}>
                <option value="module">Entire module</option>
                <option value="mini">One mini-lesson</option>
                <option value="quiz">Module quiz</option>
              </select>
            </label>
            {kind === 'mini' && (
              <label>
                Mini-lesson
                <select value={sectionIndex} onChange={e => setSectionIndex(e.target.value)}>
                  {(selectedModule?.screens || []).map((s, i) => (
                    <option value={i} key={i}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Recipients
              <select
                value={recipientType}
                onChange={e => setRecipientType(e.target.value)}
              >
                <option value="class">Entire class</option>
                <option value="student">Individual student</option>
              </select>
            </label>
            {recipientType === 'student' && (
              <label>
                Student
                <select
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  required
                  disabled={studentsLoading || students.length === 0}
                >
                <option value="">Select student</option>
                {students.map(student => (
                  <option key={student.id} value={String(student.id)}>
                    {student.name}
                  </option>
                ))}
                </select>
              </label>
            )}
            <label>
              Due date
              <input
                type="date"
                required
                value={due}
                onChange={e => setDue(e.target.value)}
              />
            </label>
            <label>
              XP reward
              <input
                type="number"
                min="0"
                max="100000"
                step="1"
                required
                value={rewardXp}
                onChange={e => setRewardXp(e.target.value)}
              />
            </label>
            <label>
              Simulated cash reward ($)
              <input
                type="number"
                min="0"
                max="100000"
                step="0.01"
                required
                value={rewardCash}
                onChange={e => setRewardCash(e.target.value)}
              />
            </label>
            <p className="assignment-note">
            </p>
            {kind === 'quiz' && (
              <p className="assignment-note">
              </p>
            )}
            {error && (
              <p role="alert" className="t-red">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="t-btn t-btn-green"
              disabled={saving || classesLoading || classes.length === 0}
            >
              {saving ? 'Publishing...' : 'Publish assignment'}
            </button>
          </form>
        )}
        <h2>Current assignments</h2>
        {loading && <p role="status">Loading assignments...</p>}
        {classesError && <p role="alert">{classesError}</p>}
        {error && <p role="alert" className="t-red">{error}</p>}
        {!loading && (
          assignments.length === 0 ? (
            <p>No assignments yet. Choose "Assign lesson" to create one.</p>
          ) : (
            <div className="assignment-list">
              {assignments.map(a => (
                <div key={a._id} className="assignment-row">
                  <div>
                    <strong>{a.title || formatTarget(a)}</strong>
                    <div className="t-small">{formatTarget(a)}</div>
                    <div className="t-small">
                      {a.recipientType === 'student' ? 'Individual student' : 'Entire class'}
                      {' · Due '}
                      {a.dueDate ? String(a.dueDate).slice(0, 10) : 'Not specified'}
                      {' · Reward '}
                      {a.rewardXp || 0}
                      {' XP + $'}
                      {((a.rewardCashCents || 0) / 100).toFixed(2)}
                      {' simulated cash · '}
                      {a.status}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="t-btn"
                    onClick={() => remove(a._id)}
                    disabled={a.status === 'closed'}
                    aria-label={`Close ${formatTarget(a)}`}
                  >
                    {a.status === 'closed' ? 'Closed' : 'Close'}
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      <div className="t-card">
        <h2>Assignment tracking</h2>
        <p>
        </p>
      </div>
    </>
  )
}