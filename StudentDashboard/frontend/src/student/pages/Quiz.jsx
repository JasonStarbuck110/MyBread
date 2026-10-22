import { useState } from 'react'
import { QUIZ_MONEY_PER_CORRECT } from '../quizzes'
import { money } from '../data'
import '../quiz.css'

export default function Quiz({ lesson, quiz, onBack, onComplete }) {
  const questions = quiz.questions
  const [alreadyDone] = useState(lesson.status === 'done') // rewards are only given the first time
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [complete, setComplete] = useState(false)

  const question = questions[current]
  const isLast = current === questions.length - 1
  const progress = complete ? 100 : ((current + 1) / questions.length) * 100

  const handleContinue = () => {
    if (selected === null) return

    if (!submitted) {
      setSubmitted(true)
      if (selected === question.correct) setScore((value) => value + 1)
      return
    }

    if (isLast) {
      setComplete(true)
      onComplete(lesson, score, questions.length)
      return
    }

    setCurrent((value) => value + 1)
    setSelected(null)
    setSubmitted(false)
  }

  const restartQuiz = () => {
    setCurrent(0)
    setSelected(null)
    setSubmitted(false)
    setScore(0)
    setComplete(false)
  }

  return (
    <div className="q-root">
      <button className="q-back-button" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span>
        <span>Back to lessons</span>
      </button>

      <div className="q-lesson">
        <div className="q-lesson-meta">
          <div>
            <p className="q-kicker">Personal finance · Lesson {lesson.id}</p>
            <p className="q-lesson-title">{quiz.title}</p>
          </div>
          <p className="q-question-count">
            {complete ? 'Complete' : `Question ${current + 1} of ${questions.length}`}
          </p>
        </div>

        <div className="q-progress-track" aria-label={`${Math.round(progress)}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        {complete ? (
          <section className="q-completion-card">
            <p className="q-kicker">Lesson complete</p>
            <h1>Good job!</h1>
            <p className="q-completion-copy">You scored {score} out of {questions.length}.</p>
            {alreadyDone ? (
              <p className="q-completion-copy" style={{ marginTop: 16 }}>You already earned this lesson's rewards.</p>
            ) : (
              <div className="q-reward">
                <span>Lesson reward</span>
                <div>
                  <strong>+{lesson.xp} XP</strong>
                  <strong>+{money(QUIZ_MONEY_PER_CORRECT * score)}</strong>
                </div>
              </div>
            )}
            <button className="q-primary-button" type="button" onClick={restartQuiz}>
              Review questions
            </button>
          </section>
        ) : (
          <section className="q-question-card">
            <div className="q-question-heading">
              <p className="q-kicker">{question.eyebrow}</p>
              <h1>{question.question}</h1>
              <p className="q-helper">{question.helper}</p>
            </div>

            <div className="q-answer-list" role="radiogroup" aria-label="Answer choices">
              {question.answers.map((answer, index) => {
                const isSelected = selected === index
                const isCorrect = submitted && index === question.correct
                const isWrong = submitted && isSelected && index !== question.correct

                return (
                  <button
                    className={['q-answer', isSelected ? 'q-selected' : '', isCorrect ? 'q-correct' : '', isWrong ? 'q-wrong' : '']
                      .filter(Boolean)
                      .join(' ')}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    key={answer}
                    onClick={() => !submitted && setSelected(index)}
                  >
                    <span className="q-answer-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="q-answer-text">{answer}</span>
                    <span className="q-answer-check" aria-hidden="true">
                      {isCorrect ? '✓' : isWrong ? '×' : ''}
                    </span>
                  </button>
                )
              })}
            </div>

            {submitted && (
              <div className={selected === question.correct ? 'q-feedback q-correct' : 'q-feedback'}>
                <strong>{selected === question.correct ? 'Correct!' : 'Not quite'}</strong>
                <span>
                  {selected === question.correct
                    ? 'Broad funds can spread risk while keeping costs low.'
                    : 'Look for the option that spreads risk across many investments.'}
                </span>
              </div>
            )}

            <div className="q-question-footer">
              <button className="q-primary-button" type="button" disabled={selected === null} onClick={handleContinue}>
                {submitted ? (isLast ? 'See results' : 'Next question') : 'Check answer'}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
