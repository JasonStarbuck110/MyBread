import { useState } from 'react'
import { createClass, fetchClassStudents } from '../../shared/classes'

export default function Classes({ token, classes, setClasses, classesLoading, classesError }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedClass, setSelectedClass] = useState(null)
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const data = await createClass(token, name, description)
      const newClass = data.class || data
      setClasses(previous => [newClass, ...previous])
      setName('')
      setDescription('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const viewStudents = async (classItem) => {
    setSelectedClass(classItem)
    setStudents([])
    setStudentsLoading(true)
    setError('')

    try {
      const data = await fetchClassStudents(token, classItem._id)
      setStudents(data.students || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setStudentsLoading(false)
    }
  }

  return (
    <>
      <div className="t-page-header">
        <div>
          <h1>Classes</h1>
          <p>Create classes and manage student enrollment.</p>
        </div>
      </div>

      <div className="t-card">
        <h2>Create a class</h2>
        <form onSubmit={handleCreate}>
          <label className="t-label" htmlFor="class-name">Class name</label>
          <input
            id="class-name"
            className="t-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Example: Personal Finance 101"
            maxLength={100}
            required
          />

          <label className="t-label" htmlFor="class-description">Description (optional)</label>
          <textarea
            id="class-description"
            className="t-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What will students learn?"
            maxLength={1000}
            rows={3}
          />

          {error && <p role="alert">{error}</p>}

          <button className="t-btn t-btn-tan" type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create class'}
          </button>
        </form>
      </div>

      <div className="t-card">
        <h2>Your classes</h2>

        {classesLoading && <p>Loading classes...</p>}
        {classesError && <p role="alert">{classesError}</p>}

        {!classesLoading && classes.length === 0 && (
          <div className="t-nothing-here">You haven't created any classes yet.</div>
        )}

        {classes.map(classItem => (
          <div className="t-row" key={classItem._id}>
            <div className="t-initials">
              {classItem.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="t-row-text">
              <div className="t-row-title">{classItem.name}</div>
              <div className="t-row-subtitle">
                Enrollment code: <strong>{classItem.enrollmentCode}</strong>
              </div>
            </div>
            <button
              className="t-btn"
              type="button"
              onClick={() => viewStudents(classItem)}
            >
              View students
            </button>
          </div>
        ))}
      </div>

      {selectedClass && (
        <div className="t-card">
          <div className="t-card-top">
            <h2>{selectedClass.name} — Students</h2>
            <button className="t-btn" onClick={() => setSelectedClass(null)}>
              Close
            </button>
          </div>

          {studentsLoading && <p>Loading students...</p>}

          {!studentsLoading && students.length === 0 && (
            <p>No students have joined this class yet.</p>
          )}

          {students.map(student => (
            <div className="t-row" key={student._id}>
              <div className="t-initials">
                {student.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="t-row-text">
                <div className="t-row-title">{student.name}</div>
                <div className="t-row-subtitle">{student.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}