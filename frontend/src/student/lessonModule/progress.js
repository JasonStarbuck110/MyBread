const KEY = 'mybread-lesson-progress-v1'
export function loadProgress() {
  try { const value = JSON.parse(localStorage.getItem(KEY) || '{}'); return value && typeof value === 'object' ? value : {} }
  catch { return {} }
}
export function saveProgress(progress) { localStorage.setItem(KEY, JSON.stringify(progress)) }
export function gradeLesson(lesson, answers, previous = {}) {
  if (!lesson || !Array.isArray(answers) || answers.length !== lesson.questions.length ||
      answers.some(a => !Number.isInteger(a))) throw new Error('Please answer every question.')
  const correct = lesson.questions.reduce((sum, q, i) => sum + (answers[i] === q.correct ? 1 : 0), 0)
  const passed = correct >= lesson.passingCorrect
  const previouslyPassed = Boolean(previous[lesson.id]?.passed)
  const earnedCash = passed && !previouslyPassed ? (Number.isFinite(lesson.rewardCash) ? lesson.rewardCash : (lesson.rewardCashCents || 0) / 100) : 0
  const earnedXp = passed && !previouslyPassed ? lesson.xp : 0
  const record = { passed: passed || previouslyPassed, score: Math.max(previous[lesson.id]?.score || 0, Math.round(correct / lesson.questions.length * 100)), attempts: (previous[lesson.id]?.attempts || 0) + 1, earnedCash: (previous[lesson.id]?.earnedCash || 0) + earnedCash, earnedXp: (previous[lesson.id]?.earnedXp || 0) + earnedXp }
  return { correct, total: lesson.questions.length, percent: Math.round(correct / lesson.questions.length * 100), passed, earnedCash, earnedXp, record }
}
