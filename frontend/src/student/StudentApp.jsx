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
import { saveProgress } from './lessonModule/progress'
import { hasCompletedMini, allMinisComplete } from './lessonModule/moduleProgress'
import './moduleStyles.css'
import JoinModal from './components/JoinModal'
import { joinClass, fetchEnrolledClasses } from '../shared/classes'
import { STOCKS } from './data'
import { fetchPortfolio, creditModuleReward, syncMiniRewards } from './tradingApi'
import { useLinks } from '../shared/useLinks'
import logo from '../assets/logo.png'
import './student.css'
import { fetchLearningProgress, submitLessonAttempt, completeMiniLesson, abandonLessonAttempt} from './learningApi'
import { fetchAssignedLessons, syncAssignmentRewards } from './assignmentApi'

const NAV = [
  ['home', 'Dashboard'],
  ['lessons', 'Lessons'],
  ['stocks', 'Stocks'],
  ['leaderboards', 'Leaderboards'],
  ['achievements', 'Achievements'],
  ['links', 'Links'],
]

export default function StudentApp({ user, token, onLogout, initialJoinCode = ''}) {
  const [page, setPage] = useState('home')
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [exitTarget, setExitTarget] = useState(null)
  const [exitSaving, setExitSaving] = useState(false)
  const [exitError, setExitError] = useState('')
  const [cash, setCash] = useState(0)
  const [holdings, setHoldings] = useState({})
  const [portfolioData, setPortfolioData] = useState(null)
  const [portfolioError, setPortfolioError] = useState('')
  const [miniRewardNotice, setMiniRewardNotice] = useState('')
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [assignmentsError, setAssignmentsError] = useState('')
  const [assignmentRefresh, setAssignmentRefresh] = useState(0)
  const [assignmentRewardNotice, setAssignmentRewardNotice] = useState('')
  const [, setClassesError] = useState('')
  const [, setClassesLoading] = useState(true)
  const [joinOpen, setJoinOpen] = useState(Boolean(initialJoinCode))
  const [links] = useLinks()
  const [xp, setXp] = useState(0)
  const [lessonProgress, setLessonProgress] = useState({})
  const [, setProgressLoading] = useState(true)
  const [, setProgressError] = useState('')
  const [quizId, setQuizId] = useState(null)
  const [miniProgress, setMiniProgress] = useState({})
  const [lessonTarget, setLessonTarget] = useState({ mode: 'mini', sectionIndex: 0 })
  const [walletRewardStatus, setWalletRewardStatus] = useState({})


const requestNavigation = (destination) => {
  if (
    page === 'quiz' &&
    lessonTarget.mode === 'quiz' &&
    !quizSubmitted
  ) {
    setExitError('')
    setExitTarget(destination)
    return
  }

  setPage(destination)
}

const confirmQuizExit = async () => {
  if (exitSaving || exitTarget === null || !quizId) return

  setExitSaving(true)
  setExitError('')

  try {
    await abandonLessonAttempt(token, quizId)

    const destination = exitTarget
    setExitTarget(null)
    setPage(destination)
  } catch (error) {
    setExitError(
      error.message || 'Could not record the quiz attempt.'
    )
  } finally {
    setExitSaving(false)
  }
}

  const handleJoinClass = async (enrollmentCode) => {
    await joinClass(token, enrollmentCode)

    const data = await fetchEnrolledClasses(token)
    setClasses(data.classes || [])
    setJoinOpen(false)

    if (window.location.pathname === '/join-class') {
      window.history.replaceState(null, '', '/')
    }
  }

  useEffect(() => {
    var cancelled = false

    const loadServerProgress = async () => {
      setProgressLoading(true)
      setProgressError('')

      try {
        var rewards = null
        try {
          rewards = await syncMiniRewards()
        } catch (rewardError) {
          if (!cancelled) setMiniRewardNotice(`Mini rewards could not sync: ${rewardError.message}`)
        }
        var assignmentReward = null

        try {
          assignmentReward = await syncAssignmentRewards(token)
          if (!cancelled) setAssignmentRefresh(current => current + 1)
          if (!cancelled && assignmentReward.awardedCount > 0) {
            setAssignmentRewardNotice(
              `Assignment rewards: +$${(assignmentReward.earnedCashCents / 100).toFixed(2)} and +${assignmentReward.earnedXp} XP.`
            )
          }
        } catch (error) {
          if (!cancelled) {
            setAssignmentRewardNotice(`Assignment rewards could not be confirmed: ${error.message}`)
          }
        }
        const data = await fetchLearningProgress(token)
        if ((rewards?.awardedCount || assignmentReward?.awardedCount) && !cancelled) {
          if (rewards?.awardedCount) {
            setMiniRewardNotice(`Mini-lesson rewards: +$${(rewards.earnedCashCents / 100).toFixed(2)} and +${rewards.earnedXp} XP.`)
          }
          setCash((assignmentReward?.cashCents ?? rewards.cashCents) / 100)
          try {
            const fresh = await fetchPortfolio()
            if (!cancelled) { setPortfolioData(fresh); setCash(fresh.cash); setHoldings(fresh.holdings) }
          } catch {
            // 
          }
        }

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

  const reconcileAssignmentRewards = async () => {
    try {
      const result = await syncAssignmentRewards(token)

      setAssignmentRefresh(current => current + 1)
      if (result.awardedCount === 0) return

      setXp(result.totalExp)
      setCash(result.cashCents / 100)
      setPortfolioData(previous => previous ? {
        ...previous,
        cash: result.cashCents / 100,
        total: previous.total - previous.cash + result.cashCents / 100
      } : previous)
      setAssignmentRewardNotice(
        `Assignment rewards: +$${(result.earnedCashCents / 100).toFixed(2)} and +${result.earnedXp} XP.`
      )

      try {
        await refreshPortfolio()
      } catch (error) {
        setPortfolioError(`Assignment rewards were saved, but portfolio prices could not refresh: ${error.message}`)
      }
    } catch (error) {
      setAssignmentRewardNotice(`Assignment rewards could not be confirmed: ${error.message}. Refresh to retry.`)
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
    var cancelled = false

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

  useEffect(() => {
    var cancelled = false

    async function loadAssignedLessons() {
      try {
        const records = await fetchAssignedLessons(token)
        if (!cancelled) {
          setAssignments(records)
          setAssignmentsError('')
        }
      } catch (error) {
        if (!cancelled) {
          setAssignments([])
          setAssignmentsError(error.message)
        }
      }
    }

    if (token) loadAssignedLessons()

    return () => {
      cancelled = true
    }
  }, [token, classes, assignmentRefresh])

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
    setQuizSubmitted(false)
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

  const openAssignment = assignment => {
    const id = Number(assignment.moduleId)
    const lesson = lessons.find(item => item.id === id)
    if (!lesson || lesson.status === 'todo') {
      setPage('lessons')
      return
    }

    if (assignment.kind === 'mini') {
      const section = Number(assignment.sectionIndex)

      if (section > 0 && !hasCompletedMini(miniProgress, id, section - 1)) {
        setPage('lessons')
        return
      }

      openMini(id, section)
      return
    }

    if (assignment.kind === 'quiz') {
      if (!allMinisComplete(lesson, miniProgress)) {
        setPage('lessons')
        return
      }

      openQuiz(id)
      return
    }

    openLesson(id)
  }

  const completeMini = async (id, sectionIndex, answerIndex) => {
    await completeMiniLesson(token, id, sectionIndex, answerIndex)
    setMiniProgress(previous => ({
      ...previous,
      [id]: {
        ...(previous[id] || {}),
        [sectionIndex]: true
      }
    }))

    const reward = await syncMiniRewards()
    setXp(reward.totalExp)
    if (reward.awardedCount > 0) {
      setCash(reward.cashCents / 100)
      setMiniRewardNotice(`Mini-lesson rewards: +$${(reward.earnedCashCents / 100).toFixed(2)} and +${reward.earnedXp} XP.`)
      try {
        const fresh = await fetchPortfolio()
        setPortfolioData(fresh)
        setCash(fresh.cash)
        setHoldings(fresh.holdings)
      } catch {
        setPortfolioData(null)
        setPortfolioError('Portfolio quotes unavailable; mini-lesson reward was still saved.')
      }
    }
    await reconcileAssignmentRewards()
  }

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
    const result = await submitLessonAttempt(token, id, selectedAnswers)
    setQuizSubmitted(true)
    setXp(result.progress?.totalExp ?? 0)

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
      await claimModuleWalletReward(id, selectedAnswers)
      await reconcileAssignmentRewards()
    }

    return result
  }

  const navBtn = ([id, label]) => (
    <button key={id} className={activePage === id ? 'nav on' : 'nav'} onClick={() => requestNavigation(id)} aria-current={activePage === id ? 'page' : undefined}>
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
        {miniRewardNotice && <p role="status" style={{ margin: '8px 18px', color: '#3C6E4D' }}>{miniRewardNotice}</p>}
        {assignmentRewardNotice && (
          <p role="status" style={{ margin: '8px 18px' }}>
            {assignmentRewardNotice}
          </p>
        )}
        {page === 'home' && (
          <Home
            user={user}
            total={total}
            cash={cash}
            xp={xp}
            lessons={lessons}
            setPage={setPage}
            onOpenLesson={openLesson}
            classes={classes}
            onJoin={() => setJoinOpen(true)}
            assignments={assignments}
            assignmentsError={assignmentsError}
            onOpenAssignment={openAssignment}
          />
        )}
        {page === 'lessons' && (
          <Lessons
            lessons={lessons}
            miniProgress={miniProgress}
            onOpenLesson={openLesson}
            onOpenMini={openMini}
            onOpenQuiz={openQuiz}
            assignments={assignments}
            assignmentsError={assignmentsError}
          />
        )}
        {page === 'quiz' && quizId && (
          <LessonView key={`${quizId}-${lessonTarget.mode}-${lessonTarget.sectionIndex}`} lesson={LESSONS.find(l => l.id === quizId)} mode={lessonTarget.mode} sectionIndex={lessonTarget.sectionIndex} progress={lessonProgress} walletStatus={walletRewardStatus[quizId]} onRetryWallet={claimModuleWalletReward} onMiniComplete={completeMini} onBack={() => requestNavigation('lessons')} onRetry={() => setQuizSubmitted(false)} onResult={completeLesson} />
        )}
        {page === 'stocks' && (
          <Stocks cash={cash} holdings={holdings} total={total} stockValue={stockValue} gain={portfolioData?.gain} backendPrices={portfolioData?.prices} portfolioError={portfolioError} refreshPortfolio={refreshPortfolio} />
        )}
        {page === 'leaderboards' && (
          <Leaderboards
            user={user}
            token={token}
            classes={classes}
          />
        )}
        {page === 'achievements' && <Achievements />}
        {page === 'links' && <Links links={links} />}
        {page === 'account' && <Account user={user} classes={classes} xp={xp} onJoin={() => setJoinOpen(true)} onLogout={onLogout} />}
      </main>
      {exitTarget !== null && (
        <div className="q-exit-overlay">
          <div
            className="q-exit-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="quiz-exit-title"
            aria-describedby="quiz-exit-description"
          >
            <h2 id="quiz-exit-title">Leave this quiz?</h2>
            <p id="quiz-exit-description">You haven't completed this quiz. If you leave now, your current attempt will receive a score of 0%, and you'll need to retake the quiz.</p>
            <p>Are you sure you want to leave?</p>
            {exitError && (
              <p role="alert" className="loss">
                {exitError}
              </p>
            )}
            <div className="q-exit-actions">
              <button
                type="button"
                className="q-exit-back"
                disabled={exitSaving}
                onClick={() => {
                  setExitTarget(null)
                  setExitError('')
                }}
              >
                Go Back
              </button>
              <button
                type="button"
                className="q-exit-confirm"
                disabled={exitSaving}
                onClick={confirmQuizExit}
              >
                {exitSaving ? 'Saving...' : 'I Understand'}
              </button>
            </div>
          </div>
        </div>
      )}
      {joinOpen && ( <JoinModal onJoin={handleJoinClass} onClose={() => setJoinOpen(false)} initialCode={initialJoinCode}/>)}
    </div>
  )
}