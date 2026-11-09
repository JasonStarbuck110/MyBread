import { useEffect, useState } from 'react'

const EMPTY_CLASSES = []

export default function useTeacherStocks(token, classes = EMPTY_CLASSES, classesLoading = false, classesError = '') {
	const [students, setStudents] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [refresh, setRefresh] = useState(0)
    const [weekStart, setWeekStart] = useState(0)

	useEffect(() => {
		if (classesLoading || classesError) return
		var cancelled = false

		async function load() {
			setLoading(true)
			setError('')

			try {
				if (!token) throw new Error('Teacher session unavailable')
				const results = await Promise.all(classes.map(async classroom => {
					const classId = String(classroom._id || classroom.id)
					const response = await fetch(
						`/api/teacher/reports/class/${encodeURIComponent(classId)}`,
						{
							headers: { Authorization: `Bearer ${token}` },
							cache: 'no-store'
						}
					)
					const data = await response.json().catch(() => ({}))

					if (!response.ok) throw new Error(data.error || `Unable to load ${classroom.name}`)
					if (!Array.isArray(data.students)) throw new Error('Invalid student report')

					return {
						classroom,
						students: data.students
					}
				}))

				const roster = new Map()

				for (const result of results) {
					for (const student of result.students) {
						const id = String(student.id)
						if (!roster.has(id)) roster.set(id, { ...student, classes: [] })
						const record = roster.get(id)
						const classId = String(result.classroom._id || result.classroom.id)

						if (!record.classes.some(item => item.id === classId)) {
							record.classes.push({
								id: classId,
								name: result.classroom.name
							})
						}
					}
				}

				if (!cancelled) {
                    setStudents([...roster.values()])
                    setWeekStart(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
			} catch (err) {
				if (!cancelled) {
					setError(err.message || 'Unable to load student portfolios')
					setStudents([])
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		load()

		return () => {
			cancelled = true
		}
	}, [token, classes, classesLoading, classesError, refresh])

	const portfolios = students.filter(student => student.portfolio)
	const investing = portfolios.filter(student => student.portfolio.holdings?.some(holding => holding.shares > 0)).length
	const valuationsAvailable = portfolios.every(student => typeof student.portfolio.totalCents === 'number')
	const gainsAvailable = portfolios.every(student => typeof student.portfolio.gainCents === 'number')
	const classTotal = valuationsAvailable
		? portfolios.reduce((sum, student) => sum + student.portfolio.totalCents, 0) / 100
		: null
	const avgProfit = gainsAvailable && portfolios.length
		? portfolios.reduce((sum, student) => sum + student.portfolio.gainCents, 0) / portfolios.length / 100
		: null
	const trades = students.flatMap(student =>
		(student.portfolio?.transactions || []).map(holding => ({ student, holding }))
	).sort((a, b) => new Date(b.holding.timestamp || 0) - new Date(a.holding.timestamp || 0))
	const tradesThisWeek = trades.filter(trade =>
		trade.holding.timestamp &&
		new Date(trade.holding.timestamp).getTime() >= weekStart
	).length
	const ownership = new Map()

	for (const student of students) {
		for (const holding of student.portfolio?.holdings || []) {
			if (holding.shares <= 0) continue
			ownership.set(holding.symbol, (ownership.get(holding.symbol) || 0) + 1)
		}
	}

	const owners = [...ownership.entries()]
		.map(([ticker, count]) => ({ ticker, count }))
		.sort((a, b) => b.count - a.count)
	const mostOwners = owners.length ? owners[0].count : 1
	const ranked = students
		.filter(student =>
			typeof student.portfolio?.totalCents === 'number' &&
			typeof student.portfolio?.gainCents === 'number'
		)
		.sort((a, b) => b.portfolio.gainCents - a.portfolio.gainCents)
		.slice(0, 5)

	return {
		students,
		loading: loading || classesLoading,
		error: classesError || error,
		refresh: () => setRefresh(value => value + 1),
		classTotal,
		avgProfit,
		investing,
		trades,
		tradesThisWeek,
		owners,
		mostOwners,
		ranked
	}
}