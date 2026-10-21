import { useState } from 'react'
import Home from './pages/Home'
import Lessons from './pages/Lessons'
import Stocks from './pages/Stocks'
import Leaderboards from './pages/Leaderboards'
import Achievements from './pages/Achievements'
import Links from './pages/Links'
import Account from './pages/Account'
import Quiz from './pages/Quiz'
import JoinModal from './components/JoinModal'
import { ME, STUDENT, STOCKS, getLessons } from './data'
import { QUIZZES, QUIZ_MONEY_PER_CORRECT } from './quizzes'
import { useLinks } from '../shared/useLinks'
import logo from '../assets/logo.png'
import './student.css'

const NAV = [
  ['home', 'Dashboard'],
  ['lessons', 'Lessons'],
  ['stocks', 'Stocks'],
  ['leaderboards', 'Leaderboards'],
  ['achievements', 'Achievements'],
  ['links', 'Links'],
]

export default function StudentApp({ onLogout }) {
  const [page, setPage] = useState('home')
  const [cash, setCash] = useState(ME.cash)
  const [holdings, setHoldings] = useState(Object.fromEntries(ME.holdings.map((h) => [h.ticker, h.shares])))
  const [classes, setClasses] = useState([STUDENT.className])
  const [joinOpen, setJoinOpen] = useState(false)
  const [links] = useLinks()
  const [xp, setXp] = useState(ME.xp)
  const [results, setResults] = useState({}) // quiz scores earned this session: { lessonId: percent }
  const [quizId, setQuizId] = useState(null)

  const stockValue = Object.entries(holdings).reduce((s, [t, sh]) => s + sh * STOCKS[t].price, 0)
  const total = cash + stockValue
  const lessons = getLessons(results)
  const activePage = page === 'quiz' ? 'lessons' : page

  const openLesson = (id) => {
    if (!QUIZZES[id]) return setPage('lessons')
    setQuizId(id)
    setPage('quiz')
    window.scrollTo(0, 0)
  }

  // Rewards are only given the first time a lesson is finished.
  const completeLesson = (lesson, correct, totalQuestions) => {
    if (lesson.status === 'done') return
    setResults((r) => ({ ...r, [lesson.id]: Math.round((correct / totalQuestions) * 100) }))
    setXp((v) => v + lesson.xp)
    setCash((v) => v + QUIZ_MONEY_PER_CORRECT * correct)
  }

  const navBtn = ([id, label]) => (
    <button key={id} className={activePage === id ? 'nav on' : 'nav'} onClick={() => setPage(id)} aria-current={activePage === id ? 'page' : undefined}>
      {label}
    </button>
  )

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <img src={logo} alt="" />
          MyBread
        </div>
        <nav aria-label="Main">{NAV.map(navBtn)}</nav>
        <div className="side-bottom">{navBtn(['account', 'Account'])}</div>
      </aside>

      <main className="main">
        {page === 'home' && <Home total={total} cash={cash} xp={xp} lessons={lessons} setPage={setPage} onOpenLesson={openLesson} classes={classes} onJoin={() => setJoinOpen(true)} />}
        {page === 'lessons' && <Lessons lessons={lessons} onOpenLesson={openLesson} />}
        {page === 'quiz' && quizId && (
          <Quiz key={quizId} lesson={lessons.find((l) => l.id === quizId)} quiz={QUIZZES[quizId]} onBack={() => setPage('lessons')} onComplete={completeLesson} />
        )}
        {page === 'stocks' && (
          <Stocks cash={cash} setCash={setCash} holdings={holdings} setHoldings={setHoldings} total={total} stockValue={stockValue} />
        )}
        {page === 'leaderboards' && <Leaderboards total={total} />}
        {page === 'achievements' && <Achievements />}
        {page === 'links' && <Links links={links} />}
        {page === 'account' && <Account classes={classes} xp={xp} onJoin={() => setJoinOpen(true)} onLogout={onLogout} />}
      </main>

      {joinOpen && <JoinModal classes={classes} setClasses={setClasses} onClose={() => setJoinOpen(false)} />}
    </div>
  )
}
