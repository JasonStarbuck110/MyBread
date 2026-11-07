export async function fetchLearningProgress(token) {
  const response = await fetch('/api/learning/progress', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Could not load learning progress')
  }

  return data
}

export async function submitLessonAttempt(token, lessonId, answers) {
  const response = await fetch(
    `/api/learning/lessons/${lessonId}/attempt`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ answers })
    }
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Could not submit quiz')
  }

  return data
}

export async function completeMiniLesson(token, lessonId, sectionIndex) {
  const response = await fetch(
    `/api/learning/lessons/${lessonId}/mini-lessons/${sectionIndex}/complete`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Could not save mini-lesson completion')
  }

  return data
}