import { useEffect, useRef, useState } from 'react'
import logo from '../assets/logo.png'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Lessons from './pages/Lessons'
import Stocks from './pages/Stocks'
import Links from './pages/Links'
import StudentDrawer from './components/StudentDrawer'
import { students } from './data'
import './teacher.css'
import { fetchTeacherClasses } from '../shared/classes'
import Classes from './pages/Classes'
import CreateClassModal from './components/CreateClassModal'

const NAV = [
  ['dashboard', 'Dashboard'],
  ['students', 'Students'],
  ['classes', 'Classes'],
  ['lessons', 'Lessons'],
  ['stocks', 'Stocks'],
  ['links', 'Links'],
]

export default function TeacherApp({ user, token, onLogout }) {
  const [page, setPage] = useState('dashboard')
  const [selectedId, setSelectedId] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [message, setMessage] = useState('')
  const timer = useRef(null)
  const [classes, setClasses] = useState([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [activeClassId, setActiveClassId] = useState('')
  // the class picked in the top-right dropdown (newest class if none picked yet)
  const activeClass = classes.find(c => String(c._id) === activeClassId) || classes[0] || null
  const student =selectedStudent || students.find(s => s.id === selectedId) || null
  const closeStudent = () => {
    setSelectedId(null)
    setSelectedStudent(null)
  }
  const goTo = (id) => {
    setPage(id)
    setSelectedId(null)
    setSelectedStudent(null)
    window.scrollTo(0, 0)
  }
  const notify = (text) => {
    setMessage(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(''), 2000)
  }

  useEffect(() => {
  const onKey = event => {
    if (event.key === 'Escape') {
      setSelectedId(null)
      setSelectedStudent(null)
    }
  }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    var cancelled = false

    const loadClasses = async () => {
      try {
        const data = await fetchTeacherClasses(token)
        if (!cancelled) setClasses(data.classes || [])
      } catch (error) {
        if (!cancelled) setClassesError(error.message)
      } finally {
        if (!cancelled) setClassesLoading(false)
      }
    }

    loadClasses()

    return () => {
      cancelled = true
    }
  }, [token])

  // new class goes to the top of the list and becomes the selected class
  const handleClassCreated = (newClass) => {
    setClasses(previous => [newClass, ...previous])
    setActiveClassId(String(newClass._id))
  }

  const shared = { openStudent: setSelectedId, notify }

  return (
    <div className="shell t-root">
      <aside className="side">
        <div className="brand">
          <img src={logo} alt="" />
          MyBread
        </div>
        <nav aria-label="Main">
          {NAV.map(([id, label]) => (
            <button key={id} className={page === id ? 'nav on' : 'nav'} onClick={() => goTo(id)} aria-current={page === id ? 'page' : undefined}>
              {label}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <button className="nav" onClick={onLogout}>Log out</button>
        </div>
      </aside>
      <main className="main">
        <div className="t-class-bar">
          {classes.length > 0 && (
            <>
              <select
                aria-label="Select a class"
                value={activeClass ? String(activeClass._id) : ''}
                onChange={e => setActiveClassId(e.target.value)}
              >
                {classes.map(c => (
                  <option key={c._id} value={String(c._id)}>{c.name}</option>
                ))}
              </select>
              <span className="t-tag">Code: {activeClass?.enrollmentCode}</span>
            </>
          )}
          <button className="t-btn t-btn-green" onClick={() => setCreateOpen(true)}>+ Create class</button>
        </div>
        {page === 'dashboard' && (<Dashboard user={user} classes={classes} classesLoading={classesLoading} classesError={classesError} setPage={goTo} />)}
        {page === 'classes' && (<Classes token={token} classes={classes} setClasses={setClasses} classesLoading={classesLoading} classesError={classesError} />)}
        {page === 'students' && (
          <Students
            key={activeClassId}
            {...shared}
            openStudent={setSelectedStudent}
            token={token}
            classes={classes}
            activeClassId={activeClassId}
            classesLoading={classesLoading}
            classesError={classesError}
          />
        )}
        {page === 'lessons' && (
          <Lessons
            key={activeClassId}
            {...shared}
            token={token}
            classes={classes}
            activeClassId={activeClassId}
            classesLoading={classesLoading}
            classesError={classesError}
          />
        )}
        {page === 'stocks' && (
          <Stocks
            {...shared}
            openStudent={setSelectedStudent}
            token={token}
            classes={classes}
            classesLoading={classesLoading}
            classesError={classesError}
          />
        )}
        {page === 'links' && <Links />}
      </main>
      <div className={'t-overlay' + (student ? ' t-open' : '')} onClick={closeStudent} />
      <div className={'t-drawer' + (student ? ' t-open' : '')} role="dialog" aria-label="Student details" aria-hidden={!student}>
        {student && <StudentDrawer student={student} onClose={closeStudent} />}
      </div>
      <div className={'t-message' + (message ? ' t-show' : '')} role="status">{message}</div>
      {createOpen && (
        <CreateClassModal token={token} onCreated={handleClassCreated} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  )
}
