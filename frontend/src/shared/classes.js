async function classRequest(path, token, options = {}) {
  const response = await fetch(`/api/classes${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Class request failed')
  }

  return data
}

// Teacher: create a class
export function createClass(token, name, description = '') {
  return classRequest('/', token, {
    method: 'POST',
    body: JSON.stringify({ name, description })
  })
}

// Teacher: get classes they created
export function fetchTeacherClasses(token) {
  return classRequest('/mine', token)
}

// Teacher: see students in one of their classes
export function fetchClassStudents(token, classId) {
  return classRequest(`/${classId}/students`, token)
}

// Student: join with an enrollment code
export function joinClass(token, enrollmentCode) {
  return classRequest('/join', token, {
    method: 'POST',
    body: JSON.stringify({ enrollmentCode })
  })
}

// Student: get classes they have joined
export function fetchEnrolledClasses(token) {
  return classRequest('/enrolled', token)
}