export const ASSIGNMENTS_KEY = 'mybread-teacher-assignments-v1'
export const ASSIGNMENTS_EVENT = 'mybread-assignments-changed'

export function loadAssignments() {
  try {
    const data = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]')
    return Array.isArray(data) ? data.filter(a => a && typeof a.id === 'string') : []
  } catch { return [] }
}

export function saveAssignments(assignments) {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments))
  window.dispatchEvent(new Event(ASSIGNMENTS_EVENT))
}

export function assignmentApplies(assignment, studentId) {
  return assignment.recipientType === 'class' ||
    (assignment.recipientType === 'student' && Number(assignment.studentId) === Number(studentId))
}

export function assignedToStudent(assignments, studentId, moduleId, sectionIndex = null, kind = 'mini') {
  return assignments.filter(a => assignmentApplies(a, studentId) &&
    Number(a.moduleId) === Number(moduleId) &&
    (a.kind === 'module' || (a.kind === kind && (kind === 'quiz' || Number(a.sectionIndex) === Number(sectionIndex)))))
}