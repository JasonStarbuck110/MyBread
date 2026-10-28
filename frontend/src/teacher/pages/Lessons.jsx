import { useEffect, useState } from 'react'
import { students } from '../data'
import { LESSONS as curriculum } from '../../student/lessonModule/catalog'
import { loadAssignments, saveAssignments } from '../../shared/assignments'
import '../assignments.css'

const formatTarget = a => {
  const module = curriculum.find(l => l.id === Number(a.moduleId))
  if (!module) return 'Unknown module'
  if (a.kind === 'module') return `Module ${module.id}: ${module.title}`
  if (a.kind === 'quiz') return `Module ${module.id} Quiz`
  const section = module.screens?.[a.sectionIndex]
  return section?.title || `Mini-lesson ${module.id}.${Number(a.sectionIndex) + 1}`
}

export default function Lessons({ notify }) {
  const [assignments, setAssignments] = useState(loadAssignments)
  const [showForm, setShowForm] = useState(false)
  const [moduleId, setModuleId] = useState(String(curriculum[0]?.id ?? 1))
  const [kind, setKind] = useState('module')
  const [sectionIndex, setSectionIndex] = useState('0')
  const [recipientType, setRecipientType] = useState('class')
  const [studentId, setStudentId] = useState(String(students[0]?.id ?? 1))
  const [due, setDue] = useState('')
  const [rewardXp, setRewardXp] = useState('50')
  const [rewardCash, setRewardCash] = useState('5.00')
  const [error, setError] = useState('')
  const selectedModule = curriculum.find(l => l.id === Number(moduleId))

  useEffect(() => {
    const sync = () => setAssignments(loadAssignments())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function submit(event) {
    event.preventDefault()
    if (!selectedModule) return setError('Select a module.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(`${due}T12:00:00`))) return setError('Choose a valid due date.')
    if (recipientType === 'student' && !students.some(s => String(s.id) === studentId)) return setError('Select a student.')
    if (kind === 'mini' && !selectedModule.screens?.[Number(sectionIndex)]) return setError('Select a mini-lesson.')
    const xp = Number(rewardXp)
    const cash = Number(rewardCash)
    if (!/^\d+$/.test(rewardXp) || !Number.isSafeInteger(xp) || xp > 100000) return setError('XP must be a whole number from 0 to 100,000.')
    if (!/^\d+(?:\.\d{1,2})?$/.test(rewardCash) || !Number.isFinite(cash) || cash > 100000) return setError('Simulated cash must be between $0 and $100,000 (two decimal places maximum).')
    if (xp === 0 && cash === 0) return setError('Choose at least one nonzero reward.')
    const assignment = {
      id: globalThis.crypto?.randomUUID?.() || `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      moduleId: selectedModule.id,
      kind,
      sectionIndex: kind === 'mini' ? Number(sectionIndex) : null,
      recipientType,
      studentId: recipientType === 'student' ? Number(studentId) : null,
      due,
      rewardXp: xp,
      rewardCashCents: Math.round(cash * 100),
      createdAt: new Date().toISOString()
    }
    try {
      const next = [assignment, ...assignments]
      saveAssignments(next)
      setAssignments(next)
      setShowForm(false)
      setError('')
      notify?.('Assignment saved locally')
    } catch { setError('Could not save assignment in this browser.') }
  }

  function remove(id) {
    if (!window.confirm('Remove this assignment?')) return
    const next = assignments.filter(a => a.id !== id)
    saveAssignments(next)
    setAssignments(next)
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
        <p className="assignment-note">
          Demo mode: assignments are stored only in this browser. Students on other devices
          will not receive them until database integration is complete.
        </p>
        {showForm && (
          <form className="assignment-form" onSubmit={submit}>
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
                <select value={studentId} onChange={e => setStudentId(e.target.value)}>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
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
              Teacher rewards are additional to the module's built-in quiz reward. They are
              earned once per assignment after its completion, not when it is assigned. Demo
              rewards stay in this browser and do not enter the investing wallet.
            </p>
            {kind === 'quiz' && (
              <p className="assignment-note">
                The module quiz still requires completion of all five mini-lessons. Assigning
                it does not override prerequisites.
              </p>
            )}
            {error && (
              <p role="alert" className="t-red">
                {error}
              </p>
            )}
            <button type="submit" className="t-btn t-btn-green">
              Save assignment
            </button>
          </form>
        )}
        <h2>Current assignments</h2>
        {assignments.length === 0 ? (
          <p>No assignments yet. Choose “Assign lesson” to create one.</p>
        ) : (
          <div className="assignment-list">
            {assignments.map(a => (
              <div key={a.id} className="assignment-row">
                <div>
                  <strong>{formatTarget(a)}</strong>
                  <div className="t-small">
                    {a.recipientType === 'class'
                      ? 'Entire class'
                      : students.find(s => s.id === a.studentId)?.name || 'Unknown student'}
                    {' · Due '}{a.due}
                    {' · Reward '}{a.rewardXp || 0}{' XP + $'}
                    {((a.rewardCashCents || 0) / 100).toFixed(2)}{' simulated cash'}
                  </div>
                </div>
                <button
                  type="button"
                  className="t-btn"
                  onClick={() => remove(a.id)}
                  aria-label={`Remove ${formatTarget(a)}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="t-card">
        <h2>Assignment tracking</h2>
        <p>
          The existing teacher progress reports use sample data. Live per-student assignment
          completion and grading will require your team's database integration.
        </p>
      </div>
    </>
  )
}
