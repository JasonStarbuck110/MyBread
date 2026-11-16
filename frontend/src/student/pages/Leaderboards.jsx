import { useEffect, useState } from 'react'
import { fetchClassLeaderboard } from '../../shared/classes'

const currency = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD'
})

export default function Leaderboards({ user, token, classes = [] }) {
	const [selectedClassId, setSelectedClassId] = useState('')
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const classId = classes.some(cls => String(cls._id || cls.id) === selectedClassId)
		? selectedClassId
		: String(classes[0]?._id || classes[0]?.id || '')
	const currentStudentId = String(user?.id || user?._id || '')
	useEffect(() => {
		var cancelled = false

		async function loadLeaderboard() {
			setLoading(true)
			setError('')

			try {
				const data = await fetchClassLeaderboard(token, classId)
				if (!cancelled) {
					setRows(data.ranking || [])
				}
			} catch (err) {
				if (!cancelled) {
					setRows([])
					setError(err.message)
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		if (token && classId) loadLeaderboard()

		return () => {
			cancelled = true
		}
	}, [token, classId])

	return (
		<>
			<header className="page-head">
				<h1>Leaderboards</h1>
				<p>Ranked by portfolio value within your class.</p>
			</header>
			<section className="panel">
				{classes.length === 0 ? (
					<p className="muted">Join a class to see its leaderboard.</p>
				) : (
					<>
						{classes.length > 1 && (
							<label>
								Class
								<select
									value={classId}
									onChange={event => setSelectedClassId(event.target.value)}
								>
									{classes.map(cls => (
										<option
											key={cls._id || cls.id}
											value={String(cls._id || cls.id)}
										>
											{cls.name}
										</option>
									))}
								</select>
							</label>
						)}
						{loading ? (
							<p>Loading leaderboard...</p>
						) : error ? (
							<p role="alert">{error}</p>
						) : rows.length === 0 ? (
							<p className="muted">No students are enrolled in this class yet.</p>
						) : (
							<table>
								<thead>
									<tr>
										<th>Rank</th>
										<th>Student</th>
										<th>Portfolio value</th>
									</tr>
								</thead>
								<tbody>
									{rows.map(row => (
										<tr
											key={row.id}
											className={String(row.id) === currentStudentId ? 'you' : ''}
										>
											<td>{row.rank}</td>
											<td>
												{row.name}
												{String(row.id) === currentStudentId ? ' (you)' : ''}
											</td>
											<td>{currency.format(row.valueCents / 100)}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</>
				)}
			</section>
		</>
	)
}