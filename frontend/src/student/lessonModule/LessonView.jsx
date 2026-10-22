import { useState } from 'react'
import { gradeLesson } from './progress'
import '../quiz.css'

export default function LessonView({ lesson, progress, onResult, onBack }) {
  const [phase, setPhase] = useState('reading')
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const finish = () => {
    const selected = lesson.questions.map((_, i) => answers[i])
    const outcome = gradeLesson(lesson, selected, progress)
    onResult(lesson.id, outcome)
    setResult(outcome)
  }
  return <div className="q-root">
    <button className="q-back-button" onClick={onBack}>← Back to lessons</button>
    <div className="q-lesson">
      <div className="q-lesson-meta"><div><p className="q-kicker">Personal finance · Lesson {lesson.id}</p><p className="q-lesson-title">{lesson.title}</p></div><p>{phase === 'reading' ? 'Reading' : 'Review'}</p></div>
      {result ? <section className="q-completion-card" style={{padding:32}}>
        <h1>{result.passed ? 'Lesson passed' : 'Try again'}</h1>
        <p>{result.correct}/{result.total} correct ({result.percent}%). Pass with 4/5 (80%).</p>
        {result.passed && <p>{result.earnedCash || result.earnedXp ? `Earned ${result.earnedXp} XP and $${result.earnedCash} lesson cash reward.` : 'Reward already earned.'}</p>}
        <div style={{textAlign:'left',marginTop:20}}>{lesson.questions.map((q,i)=><p key={i}><strong>{i+1}. {answers[i]===q.correct?'Correct':'Incorrect'}.</strong> {q.explanation || `Correct answer: ${q.answers[q.correct]}`}</p>)}</div>
        <button className="q-primary-button" onClick={result.passed ? onBack : ()=>{setAnswers({});setResult(null)}}>{result.passed?'Back to lessons':'Retry review'}</button>
      </section> : phase === 'reading' ? <section className="q-question-card">
        <div className="q-question-heading"><p className="q-kicker">Lesson reading</p><h1>{lesson.title}</h1><p className="q-helper">Read the material below, then take the five-question review.</p></div>
        <article style={{padding:'20px 42px',lineHeight:1.75}}>{lesson.screens.flatMap(s=>s.sections).map((section,i)=><section key={i} style={{marginBottom:26}}><h2 style={{fontSize:'1.2rem'}}>{section.title}</h2>{section.reading.map((p,j)=><p key={j}>{p}</p>)}</section>)}</article>
        <div style={{padding:'12px 42px 32px'}}><button className="q-primary-button" onClick={()=>{setPhase('quiz');window.scrollTo(0,0)}}>Start review →</button></div>
      </section> : <section className="q-question-card">
        <div className="q-question-heading"><p className="q-kicker">Review · 4/5 to pass</p><h1>Check what you learned</h1></div>
        <div style={{padding:'20px 38px'}}>{lesson.questions.map((q,i)=><fieldset key={i} style={{border:0,marginBottom:22}}><legend style={{fontWeight:700,marginBottom:12}}>{i+1}. {q.question}</legend>{q.answers.map((answer,j)=><label key={j} className={'q-answer'+(answers[i]===j?' q-selected':'')} style={{display:'flex',gap:10,margin:'8px 0',cursor:'pointer'}}><input type="radio" name={`question-${i}`} checked={answers[i]===j} onChange={()=>setAnswers(a=>({...a,[i]:j}))}/>{answer}</label>)}</fieldset>)}</div>
        <div style={{padding:'0 38px 32px'}}><button className="q-primary-button" disabled={Object.keys(answers).length!==lesson.questions.length} onClick={finish}>Submit review</button></div>
      </section>}
    </div>
  </div>
}
