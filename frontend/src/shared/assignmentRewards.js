// DEMO ONLY. Rewards are recorded in this browser and are not secure or credited
// to the trading backend. The real system must validate awards server-side.
import { assignmentApplies } from './assignments'
import { CURRENT_STUDENT_ID } from './mockData'

const KEY = 'mybread-assignment-rewards-v1'
export const REWARDS_EVENT = 'mybread-assignment-rewards-changed'

export function loadRewardClaims() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch { return {} }
}

export function rewardTotals(claims = loadRewardClaims(), studentId = CURRENT_STUDENT_ID) {
  const entries = Object.values(claims).filter(c => Number(c.studentId) === Number(studentId))
  return {
    xp: entries.reduce((sum, c) => sum + (Number(c.xp) || 0), 0),
    cashCents: entries.reduce((sum, c) => sum + (Number(c.cashCents) || 0), 0),
    count: entries.length
  }
}

export function issueAssignmentRewards({ assignments, studentId = CURRENT_STUDENT_ID, moduleId, kind, sectionIndex = null }) {
  const claims = loadRewardClaims()
  let awarded = 0
  let xp = 0
  let cashCents = 0
  const eligible = assignments.filter(a => assignmentApplies(a, studentId) &&
    Number(a.moduleId) === Number(moduleId) && a.kind === kind &&
    (kind !== 'mini' || Number(a.sectionIndex) === Number(sectionIndex)))
  for (const a of eligible) {
    const claimId = `${studentId}:${a.id}`
    if (claims[claimId]) continue
    const rewardXp = Number(a.rewardXp)
    const rewardCashCents = Number(a.rewardCashCents)
    if (!Number.isSafeInteger(rewardXp) || rewardXp < 0 || rewardXp > 100000 ||
        !Number.isSafeInteger(rewardCashCents) || rewardCashCents < 0 || rewardCashCents > 10000000) continue
    claims[claimId] = { studentId, assignmentId: a.id, moduleId, kind, sectionIndex, xp: rewardXp, cashCents: rewardCashCents, awardedAt: new Date().toISOString() }
    awarded++
    xp += rewardXp
    cashCents += rewardCashCents
  }
  if (awarded) {
    localStorage.setItem(KEY, JSON.stringify(claims))
    window.dispatchEvent(new Event(REWARDS_EVENT))
  }
  return { awarded, xp, cashCents }
}

export function isRewardClaimed(assignmentId, studentId = CURRENT_STUDENT_ID) {
  return Boolean(loadRewardClaims()[`${studentId}:${assignmentId}`])
}
