import { useEffect, useState } from 'react'
import ProgressBar from '../components/ProgressBar'
import { LESSONS } from '../../student/lessonModule/catalog'

const EMPTY_CLASSES = []

function getInitials(name) {
	return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'S'
}

function formatCents(value) {
	return (value / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function Students({ token, classes = EMPTY_CLASSES, classesLoading = false, classesError = '', openStudent }) {
	const [search, setSearch] = useState('')
	const [filter, setFilter] = useState('all')
	const [classFilter, setClassFilter] = useState('all')
	const [students, setStudents] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [refresh, setRefresh] = useState(0)

	useEffect(() => {
		if (classesLoading || classesError) return
		let cancelled = false
		const loadStudents = async () => {
			setLoading(true)
			setError('')
			try {
				if (!token) throw new Error('Your teacher session has expired. Sign in again.')
				const results = await Promise.all(classes.map(async classroom => {
					const classId = String(classroom._id)
					const response = await fetch(`/api/teacher/reports/class/${encodeURIComponent(classId)}`, {
						headers: { Authorization: `Bearer ${token}` },
						cache: 'no-store'
					})
					const data = await response.json().catch(() => ({}))
					if (!response.ok) throw new Error(data.error || `Unable to load ${classroom.name}`)
					if (!Array.isArray(data.students)) throw new Error(`Invalid student data for ${classroom.name}`)
					return { classroom, students: data.students }
				}))
				const roster = new Map()
				for (const result of results) {
					for (const person of result.students) {
						const id = String(person.id)
						if (!id || id === 'undefined') continue
						if (!roster.has(id)) roster.set(id, { ...person, classes: [] })
						const student = roster.get(id)
						if (!student.classes.some(item => item.id === String(result.classroom._id))) {
							student.classes.push({ id: String(result.classroom._id), name: result.classroom.name })
						}
					}
				}
				if (!cancelled) setStudents([...roster.values()])
			} catch (err) {
				if (!cancelled) {
					setError(err.message || 'Unable to load student reports')
					setStudents([])
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		loadStudents()
		return () => { cancelled = true }
	}, [token, classes, classesLoading, classesError, refresh])

	const query = search.trim().toLowerCase()
	const list = students.filter(student => {
		const matchesName = student.name?.toLowerCase().includes(query) || student.email?.toLowerCase().includes(query)
		const matchesClass = classFilter === 'all' || student.classes.some(item => item.id === classFilter)
		const needsHelp = student.quizAverage !== null && student.quizAverage < 70
		return matchesName && matchesClass && (filter === 'all' || needsHelp)
	}).sort((a, b) => a.name.localeCompare(b.name))
	const busy = classesLoading || (!classesError && loading)
	const currentError = classesError || error

	return (
		<>
			<div className="t-page-header">
				<div>
					<h1>Students</h1>
					<p>Click a student to see their lessons and portfolio.</p>
				</div>
			</div>

			<div className="t-card">
				<div className="t-filters">
					<input
						type="search"
						aria-label="Search students"
						placeholder="Search by name or email"
						value={search}
						onChange={event => setSearch(event.target.value)}
					/>
					<select aria-label="Filter students" value={filter} onChange={event => setFilter(event.target.value)}>
						<option value="all">All students</option>
						<option value="help">Quiz average below 70%</option>
					</select>
					<select aria-label="Filter by class" value={classFilter} onChange={event => setClassFilter(event.target.value)}>
						<option value="all">All classes</option>
						{classes.map(classroom => (
							<option key={classroom._id} value={String(classroom._id)}>{classroom.name}</option>
						))}
					</select>
					<button className="t-btn t-btn-outline" type="button" onClick={() => setRefresh(value => value + 1)}>
						Refresh
					</button>
				</div>

				{busy && <p role="status">Loading student reports...</p>}
				{currentError && <p role="alert">{currentError}</p>}

				{!busy && !currentError && classes.length === 0 && (
					<div className="t-nothing-here">Create a class to start enrolling students.</div>
				)}

				{!busy && !currentError && classes.length > 0 && list.length === 0 && (
					<div className="t-nothing-here">
						{search || filter !== 'all' || classFilter !== 'all' ? 'No students match these filters.' : 'No students have joined your classes yet.'}
					</div>
				)}

				{!busy && !currentError && list.length > 0 && (
					<table>
						<thead>
							<tr>
								<th>Student</th>
								<th>Level</th>
								<th>Lessons</th>
								<th>Quiz avg</th>
								<th>Portfolio</th>
							</tr>
						</thead>
						<tbody>
							{list.map(student => {
								const completed = student.completedModules?.length ?? 0
								const portfolioValue = student.portfolio?.totalCents
								return (
									<tr
										className="t-click-row"
										key={student.id}
										onClick={() => openStudent(student)}
										onKeyDown={event => {
											if (event.key === 'Enter' || event.key === ' ') {
												event.preventDefault()
												openStudent(student)
											}
										}}
										role="button"
										tabIndex={0}
									>
										<td>
											<div className="t-name">
												<div className="t-initials">{getInitials(student.name)}</div>
												{student.name}
											</div>
										</td>
										<td>
											{student.level} <span className="t-small t-gray">({student.xp} XP)</span>
										</td>
										<td>
											<div className="t-small-progress">
												<ProgressBar value={LESSONS.length ? Math.min(100, Math.round(completed / LESSONS.length * 100)) : 0} />
												<span className="t-small">{completed}/{LESSONS.length}</span>
											</div>
										</td>
										<td>{student.quizAverage === null ? '—' : `${student.quizAverage}%`}</td>
										<td>
											{typeof portfolioValue === 'number'
												? formatCents(portfolioValue)
												: student.portfolio ? 'Value unavailable' : 'No portfolio yet'}
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				)}
			</div>
		</>
	)
}