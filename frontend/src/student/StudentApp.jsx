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
import { hasCompletedMini, allMinisComplete } from './lessonModule/moduleProgress'
import './moduleStyles.css'
import JoinModal from './components/JoinModal'
import { joinClass } from '../shared/classes'
import { ME, STUDENT, STOCKS } from './data'
import { fetchPortfolio, creditModuleReward } from './tradingApi'
import { useLinks } from '../shared/useLinks'
import { loadAssignments } from '../shared/assignments'
import { issueAssignmentRewards, loadRewardClaims, rewardTotals, REWARDS_EVENT } from '../shared/assignmentRewards'
import { CURRENT_STUDENT_ID } from '../shared/mockData'
import logo from '../assets/logo.png'
import './student.css'
import { fetchLearningProgress, submitLessonAttempt, completeMiniLesson } from './learningApi'
import { fetchEnrolledClasses } from '../shared/classes'

const NAV = [
  ['home', 'Dashboard'],
  ['lessons', 'Lessons'],
  ['stocks', 'Stocks'],
  ['leaderboards', 'Leaderboards'],
  ['achievements', 'Achievements'],
  ['links', 'Links'],
]

export default function StudentApp({ user, token, onLogout }) {
  const [page, setPage] = useState('home')
  const [cash, setCash] = useState(ME.cash)
  const [holdings, setHoldings] = useState(Object.fromEntries(ME.holdings.map((h) => [h.ticker, h.shares])))
  const [portfolioData, setPortfolioData] = useState(null)
  const [portfolioError, setPortfolioError] = useState('')
  const [classes, setClasses] = useState([])
  const [classesError, setClassesError] = useState('')
  const [classesLoading, setClassesLoading] = useState(true)
  const [joinOpen, setJoinOpen] = useState(false)
  const [links] = useLinks()
  const [xp, setXp] = useState(0)
  const [teacherRewardTotals, setTeacherRewardTotals] = useState(() => rewardTotals(loadRewardClaims(), CURRENT_STUDENT_ID))
  useEffect(() => {
    const sync = () => setTeacherRewardTotals(rewardTotals(loadRewardClaims(), CURRENT_STUDENT_ID))
    window.addEventListener(REWARDS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener(REWARDS_EVENT, sync); window.removeEventListener('storage', sync) }
  }, [])
  const [lessonProgress, setLessonProgress] = useState({})
  const [progressLoading, setProgressLoading] = useState(true)
  const [progressError, setProgressError] = useState('')
  const [quizId, setQuizId] = useState(null)
  const [miniProgress, setMiniProgress] = useState({})
  const [lessonTarget, setLessonTarget] = useState({ mode: 'mini', sectionIndex: 0 })
  const [walletRewardStatus, setWalletRewardStatus] = useState({})
  const handleJoinClass = async (enrollmentCode) => {
    await joinClass(token, enrollmentCode)
    const data = await fetchEnrolledClasses(token)
    setClasses(data.classes || [])
    setJoinOpen(false)
  }

  useEffect(() => {
    let cancelled = false

    const loadServerProgress = async () => {
      setProgressLoading(true)
      setProgressError('')

      try {
        const data = await fetchLearningProgress(token)

        if (cancelled) return

        setXp(data.totalExp ?? 0)

        const savedProgress = {}
        for (const completion of data.completedLessons || []) {
          savedProgress[Number(completion.lessonId)] = {
            passed: true,
            score: 100
          }
        }

        setLessonProgress(savedProgress)
        const savedMiniProgress = {}

        for (const completion of data.miniLessons || []) {
          const lessonId = Number(completion.lessonId)

          if (!savedMiniProgress[lessonId]) {
            savedMiniProgress[lessonId] = {}
        }

        savedMiniProgress[lessonId][completion.sectionIndex] = true
      }

    setMiniProgress(savedMiniProgress)
          saveProgress(savedProgress)
        } catch (error) {
          if (!cancelled) {
            setProgressError(error.message || 'Could not load lesson progress')
          }
        } finally {
          if (!cancelled) setProgressLoading(false)
        }
      }

    loadServerProgress()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
  const loadStudentAccount = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not load student account')
      }

      setXp(data.progress?.totalExp ?? 0)
    } catch (error) {
      console.error('Student account loading failed:', error)
    }
  }

  if (token) {
    loadStudentAccount()
  }
}, [token])

  const refreshPortfolio = async () => {
    try {
      const data = await fetchPortfolio()
      setPortfolioData(data)
      setCash(data.cash)
      setHoldings(data.holdings)
      setPortfolioError('')
      return data
    } catch (error) {
      setPortfolioError(error.message)
      throw error
    }
  }
  useEffect(() => { refreshPortfolio().catch(() => {}) }, [])
  const stockValue = portfolioData?.stockValue ?? Object.entries(holdings).reduce((s, [t, sh]) => s + sh * (STOCKS[t]?.price || 0), 0)
  const total = portfolioData?.total ?? cash + stockValue
  const lessons = LESSONS.map((l,i) => {
    const progress = lessonProgress[l.id]
    const previousComplete = i === 0 || lessonProgress[LESSONS[i-1].id]?.passed
    return { ...l, status: progress?.passed ? 'done' : previousComplete ? 'next' : 'todo', score: progress?.score }
  })
  const activePage = page === 'quiz' ? 'lessons' : page

  useEffect(() => {
    let cancelled = false

    const loadClasses = async () => {
      setClassesLoading(true)
      setClassesError('')

      try {
        const data = await fetchEnrolledClasses(token)

        if (!cancelled) {
          setClasses(data.classes || [])
        }
      } catch (error) {
        if (!cancelled) {
          setClassesError(error.message || 'Could not load classes')
        }
      } finally {
        if (!cancelled) setClassesLoading(false)
      }
    }

    loadClasses()

    return () => {
      cancelled = true
    }
  }, [token])

  const openMini = (id, sectionIndex) => {
    const lesson = lessons.find(l => l.id === id)
    if (!lesson || lesson.status === 'todo' || !lesson.screens[sectionIndex]) return
    if (sectionIndex > 0 && !hasCompletedMini(miniProgress, id, sectionIndex - 1)) return
    setLessonTarget({ mode: 'mini', sectionIndex })
    setQuizId(id)
    setPage('quiz')
    window.scrollTo(0, 0)
  }

  const openQuiz = (id) => {
    const lesson = lessons.find(l => l.id === id)
    if (!lesson || lesson.status === 'todo' || !allMinisComplete(lesson, miniProgress)) return
    setLessonTarget({ mode: 'quiz', sectionIndex: 0 })
    setQuizId(id)
    setPage('quiz')
    window.scrollTo(0, 0)
  }

  const openLesson = (id) => {
    const lesson = lessons.find(l => l.id === id)
    if (!lesson || lesson.status === 'todo') return setPage('lessons')
    const firstIncomplete = lesson.screens.findIndex((_, i) => !hasCompletedMini(miniProgress, id, i))
    if (firstIncomplete !== -1) openMini(id, firstIncomplete)
    else openQuiz(id)
  }

  const awardTeacherRewards = (id, kind, sectionIndex = null) => {
    try {
      issueAssignmentRewards({ assignments: loadAssignments(), studentId: CURRENT_STUDENT_ID, moduleId: id, kind, sectionIndex })
      setTeacherRewardTotals(rewardTotals(loadRewardClaims(), CURRENT_STUDENT_ID))
    } catch (error) { console.warn('Teacher reward could not be stored locally', error) }
  }

  const completeMini = async (id, sectionIndex) => {
    await completeMiniLesson(token, id, sectionIndex)

    setMiniProgress(previous => ({
      ...previous,
      [id]: {
        ...(previous[id] || {}),
        [sectionIndex]: true
      }
    }))

    awardTeacherRewards(id, 'mini', sectionIndex)
  }

  // The server decides whether a quiz reward is payable. Never use client XP
  // or a browser-stored teacher reward as authority for wallet deposits.
  const claimModuleWalletReward = async (id, selectedAnswers) => {
    setWalletRewardStatus(previous => ({
      ...previous,
      [id]: { state: 'pending', message: 'Checking wallet reward…' }
    }))

    try {
      const response = await creditModuleReward(id, selectedAnswers)
      const walletCash = Number(response.cashCents) / 100
      if (!Number.isFinite(walletCash)) {
        throw new Error('The wallet server returned an invalid balance')
      }

      // Update cash immediately from the authoritative reward response, even
      // if the subsequent portfolio quote/valuation refresh is rate-limited.
      setCash(walletCash)
      setPortfolioData(previous => previous ? { ...previous, cash: walletCash } : previous)
      setPortfolioError('')
      setWalletRewardStatus(previous => ({
        ...previous,
        [id]: {
          state: 'success',
          message: response.credited
            ? `Wallet credited $${(response.rewardCents / 100).toFixed(2)}.`
            : 'This module reward was already credited to your wallet.'
        }
      }))
      try {
        await refreshPortfolio()
      } catch (error) {
        setPortfolioError(`Wallet reward confirmed; portfolio prices could not refresh: ${error.message}`)
      }
      return { credited: Boolean(response.credited), cash: walletCash }
    } catch (error) {
      setWalletRewardStatus(previous => ({
        ...previous,
        [id]: {
          state: 'error',
          message: `Wallet credit could not be confirmed: ${error.message}`
        }
      }))
      return { error: error.message }
    }
  }

  const completeLesson = async (id, selectedAnswers) => {
    // Submit answers to the backend. The server grades the quiz
    // and decides whether EXP can be awarded.
    const result = await submitLessonAttempt(token, id, selectedAnswers)

    // Always use the EXP total returned by MongoDB.
    setXp(result.progress?.totalExp ?? 0)

    // Keep the existing browser progress cache in sync for now.
    setLessonProgress(previous => {
      const next = {
        ...previous,
        [id]: {
          ...(previous[id] || {}),
          passed: Boolean(result.passed || previous[id]?.passed),
          score: result.percent
        }
      }

      saveProgress(next)
      return next
    })

    if (result.passed) {
      awardTeacherRewards(id, 'quiz')
      awardTeacherRewards(id, 'module')

      // Keep the existing cash wallet reward separate from EXP.
      await claimModuleWalletReward(id, selectedAnswers)
    }

    return result
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
        {page === 'home' && <Home user={user} total={total} cash={cash} xp={xp} lessons={lessons} setPage={setPage} onOpenLesson={openLesson} classes={classes} onJoin={() => setJoinOpen(true)} />}
        {page === 'lessons' && <Lessons lessons={lessons} miniProgress={miniProgress} onOpenLesson={openLesson} onOpenMini={openMini} onOpenQuiz={openQuiz} />}
        {page === 'quiz' && quizId && (
          <LessonView key={`${quizId}-${lessonTarget.mode}-${lessonTarget.sectionIndex}`} lesson={LESSONS.find(l => l.id === quizId)} mode={lessonTarget.mode} sectionIndex={lessonTarget.sectionIndex} progress={lessonProgress} walletStatus={walletRewardStatus[quizId]} onRetryWallet={claimModuleWalletReward} onMiniComplete={completeMini} onBack={() => setPage('lessons')} onResult={completeLesson} />
        )}
        {page === 'stocks' && (
          <Stocks cash={cash} holdings={holdings} total={total} stockValue={stockValue} gain={portfolioData?.gain} backendPrices={portfolioData?.prices} portfolioError={portfolioError} refreshPortfolio={refreshPortfolio} />
        )}
        {page === 'leaderboards' && <Leaderboards total={total} />}
        {page === 'achievements' && <Achievements />}
        {page === 'links' && <Links links={links} />}
        {page === 'account' && <Account classes={classes} xp={xp + teacherRewardTotals.xp} onJoin={() => setJoinOpen(true)} onLogout={onLogout} />}
      </main>
      {joinOpen && (<JoinModal classes={classes} onJoin={handleJoinClass} onClose={() => setJoinOpen(false)}/>)}
    </div>
  )
}