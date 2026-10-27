import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Lessons from './pages/Lessons'
import Stocks from './pages/Stocks'
import Leaderboards from './pages/Leaderboards'
import Achievements from './pages/Achievements'
import Links from './pages/Links'
import Account from './pages/Account'
import LessonView from './lessonModule/LessonView'
import { LESSONS } from './lessonModule/catalog'
import { loadProgress, saveProgress } from './lessonModule/progress'
import JoinModal from './components/JoinModal'
import { ME, STUDENT, STOCKS } from './data'
import { fetchPortfolio } from './tradingApi'
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
  const [portfolioData, setPortfolioData] = useState(null)
  const [portfolioError, setPortfolioError] = useState('')
  const [classes, setClasses] = useState([STUDENT.className])
  const [joinOpen, setJoinOpen] = useState(false)
  const [links] = useLinks()
  const [xp, setXp] = useState(ME.xp)
  const [lessonProgress, setLessonProgress] = useState(loadProgress)
  const [quizId, setQuizId] = useState(null)

  const refreshPortfolio = async () => {
    try {
      const data = await fetchPortfolio()
      setPortfolioData(data)
      setCash(data.cash)
      setHoldings(data.holdings)
      setPortfolioError('')
    } catch (error) { setPortfolioError(error.message) }
  }
  useEffect(() => { refreshPortfolio() }, [])
  const stockValue = portfolioData?.stockValue ?? Object.entries(holdings).reduce((s, [t, sh]) => s + sh * (STOCKS[t]?.price || 0), 0)
  const total = portfolioData?.total ?? cash + stockValue
  const lessons = LESSONS.map((l,i) => {
    const progress = lessonProgress[l.id]
    const previousComplete = i === 0 || lessonProgress[LESSONS[i-1].id]?.passed
    return { ...l, status: progress?.passed ? 'done' : previousComplete ? 'next' : 'todo', score: progress?.score }
  })
  const activePage = page === 'quiz' ? 'lessons' : page

  const openLesson = (id) => {
    if (!lessons.find(l => l.id === id && l.status !== 'todo')) return setPage('lessons')
    setQuizId(id)
    setPage('quiz')
    window.scrollTo(0, 0)
  }

  const completeLesson = (id, result) => {
    setLessonProgress(previous => {
      const next = { ...previous, [id]: result.record }
      saveProgress(next)
      return next
    })
    if (result.earnedXp) setXp(value => value + result.earnedXp)
    // Cash reward is tracked in the lessons module only, not the investing simulator.
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
          <LessonView key={quizId} lesson={LESSONS.find(l => l.id === quizId)} progress={lessonProgress} onBack={() => setPage('lessons')} onResult={completeLesson} />
        )}
        {page === 'stocks' && (
          <Stocks cash={cash} holdings={holdings} total={total} stockValue={stockValue} gain={portfolioData?.gain} backendPrices={portfolioData?.prices} portfolioError={portfolioError} refreshPortfolio={refreshPortfolio} />
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
