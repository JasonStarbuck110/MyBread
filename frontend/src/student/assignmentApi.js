export async function fetchAssignedLessons(token) {
	const response = await fetch('/api/assignments/assigned', {
		headers: {
			Authorization: `Bearer ${token}`
		},
		cache: 'no-store'
	})
	const contentType = response.headers.get('content-type') || ''
	if (!contentType.includes('application/json')) {
		throw new Error('The assignment server returned an invalid response.')
	}

	const data = await response.json()
	if (!response.ok) {
		throw new Error(data.error || 'Could not load assignments.')
	}

	if (!Array.isArray(data.assignments)) {
		throw new Error('Invalid assignment data received.')
	}

	return data.assignments
}

export async function syncAssignmentRewards(token) {
	const response = await fetch('/api/assignments/rewards/sync', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`
		},
		cache: 'no-store'
	})
	const contentType = response.headers.get('content-type') || ''

	if (!contentType.includes('application/json')) {
		throw new Error('The reward server returned an invalid response.')
	}

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.error || 'Could not synchronize assignment rewards.')
	}

	if (!Number.isSafeInteger(data.awardedCount) ||
		!Number.isSafeInteger(data.cashCents) ||
		!Number.isSafeInteger(data.totalExp)) {
		throw new Error('The reward server returned invalid account information.')
	}

	return data
}