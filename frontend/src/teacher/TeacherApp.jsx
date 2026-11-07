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
  const [message, setMessage] = useState('')
  const timer = useRef(null)
  const [classes, setClasses] = useState([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState('')

  const student = students.find((s) => s.id === selectedId) || null
  const closeStudent = () => setSelectedId(null)

  const goTo = (id) => {
    setPage(id)
    setSelectedId(null)
    window.scrollTo(0, 0)
  }

  const notify = (text) => {
    setMessage(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(''), 2000)
  }

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSelectedId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    let cancelled = false

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
        {page === 'dashboard' && (<Dashboard user={user} classes={classes} classesLoading={classesLoading} classesError={classesError} setPage={goTo} />)}
        {page === 'classes' && (<Classes token={token} classes={classes} setClasses={setClasses} classesLoading={classesLoading} classesError={classesError} />)}
        {page === 'students' && <Students {...shared} />}
        {page === 'lessons' && <Lessons {...shared} />}
        {page === 'stocks' && <Stocks {...shared} />}
        {page === 'links' && <Links />}
      </main>

      <div className={'t-overlay' + (student ? ' t-open' : '')} onClick={closeStudent} />
      <div className={'t-drawer' + (student ? ' t-open' : '')} role="dialog" aria-label="Student details" aria-hidden={!student}>
        {student && <StudentDrawer student={student} onClose={closeStudent} />}
      </div>
      <div className={'t-message' + (message ? ' t-show' : '')} role="status">{message}</div>
    </div>
  )
}
