import { useState } from 'react'
import { gradeLesson } from './progress'
import '../quiz.css'

export default function LessonView({ lesson, mode = 'mini', sectionIndex = 0, progress, walletStatus, onRetryWallet, onResult, onMiniComplete, onBack }) {
  const [phase, setPhase] = useState('reading')
  const [choice, setChoice] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [submittedAnswers, setSubmittedAnswers] = useState(null)

  const screen = lesson.screens?.[sectionIndex]
  const check = screen?.checkQuestion
  const correct = check && choice === check.correct
  const questions = lesson.questions || []
  const pass = lesson.passingCorrect || Math.ceil(questions.length * 0.8)
  const goTop = () => window.scrollTo(0, 0)

  const finish = () => {
    const selected = questions.map((_, i) => answers[i])
    if (selected.some(answer => !Number.isInteger(answer))) return
    try {
      const outcome = gradeLesson(lesson, selected, progress)
      setSubmittedAnswers(selected)
      setResult(outcome)
      Promise.resolve(onResult(lesson.id, outcome, selected)).catch(err => {
        setError(err.message || 'Could not process lesson completion')
      })
      setError('')
      goTop()
    } catch (err) { setError(err.message || 'Could not grade quiz') }
  }

  const finishMini = () => {
    if (check && !correct) return
    onMiniComplete(lesson.id, sectionIndex)
    onBack()
  }

  return <div className="q-root">
    <button className="q-back-button" onClick={onBack}>← Back to modules</button>
    <div className="q-lesson">
      <div className="q-lesson-meta">
        <div>
          <p className="q-kicker">Investing · Module {lesson.id}</p>
          <p className="q-lesson-title">{lesson.title}</p></div><p>{mode === 'quiz' ? 'Module quiz' : `Mini-lesson ${lesson.id}.${sectionIndex + 1}`}</p>
        </div>
        {mode === 'mini' ? !screen ? <section className="q-question-card" style={{ padding: 24 }}>Mini-lesson not found.</section> : phase === 'reading' ? <section className="q-question-card">
        <div className="q-question-heading">
          <p className="q-kicker">Reading · {lesson.id}.{sectionIndex + 1}</p>
          <h1>{screen.title}</h1>
          <p className="q-helper">Read this mini-lesson, then answer its knowledge check.</p>
        </div>
        <article style={{ padding: '20px clamp(16px, 4vw, 42px)', lineHeight: 1.75 }}>
          {(screen.sections || []).map((section, index) => <section key={index} style={{ marginBottom: 20 }}>
          {section.title && section.title !== screen.title && <h2>{section.title}</h2>}
          {(section.reading || []).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          {!!section.sources?.length && <div><strong>Sources:</strong><ul>{section.sources.map((source, i) => <li key={i}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul></div>}
          </section>)}
        </article>
        <div style={{ padding: '12px 24px 32px', display: 'flex', gap: 12 }}>
          <button className="q-primary-button" onClick={onBack}>← Modules</button>
          <button className="q-primary-button" onClick={() => { setPhase('check'); goTop() }}>{check ? 'Knowledge check →' : 'Complete mini-lesson →'}</button>
        </div>
      </section> : <section className="q-question-card">
        <div className="q-question-heading">
          <p className="q-kicker">Knowledge check · {lesson.id}.{sectionIndex + 1}</p>
          <h1>{screen.title}</h1>
          <p className="q-helper">Answer correctly to complete this mini-lesson.</p>
        </div>
        <div style={{ padding: '20px clamp(16px, 4vw, 38px)' }}>
          {check ? <fieldset style={{ border: 0 }}><legend style={{ fontWeight: 700, marginBottom: 12 }}>{check.question}</legend>{check.answers.map((answer, i) => <label key={i} className={'q-answer' + (choice === i ? ' q-selected' : '')} style={{ display: 'flex', gap: 10, margin: '8px 0' }}><input type="radio" name={`check-${lesson.id}-${sectionIndex}`} checked={choice === i} onChange={() => setChoice(i)}/>{answer}</label>)}</fieldset> : <p>No check question was provided for this mini-lesson.</p>}
          {choice !== null && <p role="status">{correct ? check.explanation : 'Not quite. Review the reading and try another answer.'}</p>}
        </div>
        <div style={{ padding: '0 24px 32px', display: 'flex', gap: 12 }}>
          <button className="q-primary-button" onClick={() => { setPhase('reading'); goTop() }}>← Reading</button>
          <button className="q-primary-button" disabled={Boolean(check) && !correct} onClick={finishMini}>Complete mini-lesson →</button>
        </div>
      </section> : result ? 
      <section className="q-completion-card" style={{ padding: 32 }}>
        <h1>{result.passed ? 'Module passed' : 'Try again'}</h1>
        <p>{result.correct}/{result.total} correct ({result.percent}%). Passing score: {pass}/{questions.length}.</p>
        {result.passed && (
          <>
            <p>
              {result.earnedXp ? `Earned ${result.earnedXp} XP.` : 'Module XP already earned.'}
            </p>
            <p role="status" aria-live="polite">
              <strong>Investing wallet: </strong>
              {walletStatus?.message || 'Checking module reward…'}
            </p>
            {walletStatus?.state === 'error' && submittedAnswers && (
              <button
                type="button"
                className="q-primary-button"
                onClick={() => onRetryWallet(lesson.id, submittedAnswers)}
              >
                Retry wallet credit
              </button>
            )}
          </>
        )}
        {error && <p role="alert">{error}</p>}
        <div style={{ textAlign: 'left', marginTop: 20 }}>{questions.map((q, i) => 
          <p key={q.id || i}>
          <strong>{i + 1}. {answers[i] === q.correct ? 'Correct' : 'Incorrect'}.</strong> 
          {q.explanation || `Correct answer: ${q.answers[q.correct]}`}</p>)}</div>
          <button className="q-primary-button" onClick={result.passed ? onBack : () => { setAnswers({}); setResult(null); setSubmittedAnswers(null); setError('') }}>{result.passed ? 'Back to modules' : 'Retry quiz'}</button>
      </section> : <section className="q-question-card">
        <div className="q-question-heading">
          <p className="q-kicker">Module {lesson.id} quiz · {pass}/{questions.length} to pass</p>
          <h1>Check what you learned</h1>
        </div>
        <div style={{ padding: '20px clamp(16px, 4vw, 38px)' }}>{questions.map((q, i) => <fieldset key={q.id || i} style={{ border: 0, marginBottom: 22 }}>
          <legend style={{ fontWeight: 700, marginBottom: 12 }}>{i + 1}. {q.question}</legend>
          {q.answers.map((answer, j) => <label key={j} className={'q-answer' + (answers[i] === j ? ' q-selected' : '')} style={{ display: 'flex', gap: 10, margin: '8px 0' }}>
          <input type="radio" name={`quiz-${lesson.id}-${i}`} checked={answers[i] === j} onChange={() => setAnswers(old => ({ ...old, [i]: j }))}/>{answer}</label>)}
          </fieldset>)}
        </div>
        {error && <p role="alert">{error}</p>}
      <div style={{ padding: '0 24px 32px', display: 'flex', gap: 12 }}>
        <button className="q-primary-button" onClick={onBack}>← Modules</button>
        <button className="q-primary-button" disabled={questions.some((_, i) => answers[i] === undefined)} onClick={finish}>Submit review</button>
      </div>
      </section>}
    </div>
  </div>
}