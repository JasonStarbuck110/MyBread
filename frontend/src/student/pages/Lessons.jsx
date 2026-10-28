import { useEffect, useState } from 'react'
import { loadAssignments, assignedToStudent, ASSIGNMENTS_EVENT } from '../../shared/assignments'
import { CURRENT_STUDENT_ID } from '../../shared/mockData'
import { rewardTotals, loadRewardClaims, REWARDS_EVENT } from '../../shared/assignmentRewards'
import { allMinisComplete, hasCompletedMini, moduleMiniCount } from '../lessonModule/moduleProgress'

export default function Lessons({ lessons, miniProgress, onOpenLesson, onOpenMini, onOpenQuiz }) {
  const [openModules, setOpenModules] = useState([1])
  const [assignments, setAssignments] = useState(loadAssignments)
  const [claims, setClaims] = useState(loadRewardClaims)
  useEffect(() => {
    const sync = () => setAssignments(loadAssignments())
    window.addEventListener('storage', sync)
    window.addEventListener(ASSIGNMENTS_EVENT, sync)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(ASSIGNMENTS_EVENT, sync) }
  }, [])
  useEffect(() => {
    const sync = () => setClaims(loadRewardClaims())
    window.addEventListener('storage', sync)
    window.addEventListener(REWARDS_EVENT, sync)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(REWARDS_EVENT, sync) }
  }, [])
  const totals = rewardTotals(claims, CURRENT_STUDENT_ID)
  const assignmentLabel = (id, index, kind) => {
    const matches = assignedToStudent(assignments, CURRENT_STUDENT_ID, id, index, kind)
    return matches.length ? matches.map(a => ` · Assigned · Due ${a.due} · ${a.rewardXp || 0} XP + $${((a.rewardCashCents || 0) / 100).toFixed(2)}${claims[`${CURRENT_STUDENT_ID}:${a.id}`] ? ' (reward earned)' : ''}`).join('') : ''
  }
  const toggle = id => setOpenModules(old => old.includes(id) ? old.filter(n => n !== id) : [...old, id])

  return (
    <>
      <header className="page-head">
        <h1>Lessons</h1>
        <p>Complete each mini-lesson and its knowledge check, then pass the module quiz (4/5 correct).</p>
        <p>
          Teacher assignment rewards earned (demo): {totals.xp} XP · $
          {(totals.cashCents / 100).toFixed(2)} simulated cash. These are not deposited in
          your investing wallet.
        </p>
      </header>
      <section className="panel">
        <div className="module-list">
          {lessons.map(lesson => {
            const count = moduleMiniCount(lesson, miniProgress)
            const total = lesson.screens.length
            const isOpen = openModules.includes(lesson.id)
            const moduleLocked = lesson.status === 'todo'
            const quizUnlocked = !moduleLocked && allMinisComplete(lesson, miniProgress)

            return (
              <div key={lesson.id} className="module-card">
                <button
                  type="button"
                  className="module-heading"
                  onClick={() => toggle(lesson.id)}
                  aria-expanded={isOpen}
                >
                  <span>
                    <strong>Module {lesson.id}: {lesson.title}</strong>
                    <small>
                      {count}/{total} mini-lessons complete
                      {assignmentLabel(lesson.id, null, 'module')}
                      {lesson.status === 'done'
                        ? ' · Quiz passed'
                        : moduleLocked
                          ? ' · Locked'
                          : ''}
                    </small>
                  </span>
                  <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="module-contents">
                    {(lesson.screens || []).map((screen, index) => {
                      const complete = hasCompletedMini(miniProgress, lesson.id, index)
                      const unlocked = !moduleLocked && (
                        index === 0 || hasCompletedMini(miniProgress, lesson.id, index - 1)
                      )

                      return (
                        <div className="module-item" key={index}>
                          <span>
                            <strong>{screen.title}</strong>
                            <small>
                              {complete ? 'Completed' : unlocked ? 'Ready to learn' : 'Locked'}
                              {assignmentLabel(lesson.id, index, 'mini')}
                            </small>
                          </span>
                          <button
                            type="button"
                            className="btn ghost small"
                            disabled={!unlocked}
                            onClick={() => onOpenMini(lesson.id, index)}
                          >
                            {complete ? 'Review' : unlocked ? 'Start' : 'Locked'}
                          </button>
                        </div>
                      )
                    })}
                    <div className="module-item module-quiz">
                      <span>
                        <strong>Module {lesson.id} Quiz</strong>
                        <small>
                          {lesson.status === 'done'
                            ? `Passed · Best score ${lesson.score ?? 80}%`
                            : quizUnlocked
                              ? '5 questions · 80% to pass'
                              : 'Finish all five mini-lessons to unlock'}
                          {assignmentLabel(lesson.id, null, 'quiz')}
                        </small>
                      </span>
                      <button
                        type="button"
                        className="btn small"
                        disabled={!quizUnlocked}
                        onClick={() => onOpenQuiz(lesson.id)}
                      >
                        {lesson.status === 'done' ? 'Retake' : quizUnlocked ? 'Take quiz' : 'Locked'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
