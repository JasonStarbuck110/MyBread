const KEY = 'mybread-mini-progress-v1'
export function loadMiniProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return saved
  } catch { return {} }
}

export function saveMiniProgress(progress) {
  try { localStorage.setItem(KEY, JSON.stringify(progress)) }
  catch (error) { console.warn('Could not save mini-lesson progress', error) }
}

export function hasCompletedMini(progress, moduleId, index) {
  return Boolean(progress?.[moduleId]?.[index])
}

export function moduleMiniCount(lesson, progress) {
  return (lesson.screens || []).filter((_, i) => hasCompletedMini(progress, lesson.id, i)).length
}

export function allMinisComplete(lesson, progress) {
  return lesson.screens?.length > 0 && moduleMiniCount(lesson, progress) === lesson.screens.length
}
