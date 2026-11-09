import { LESSONS } from '../../student/lessonModule/catalog'

function formatCents(value) {
	return (value / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function LessonTag({ completed, miniCount, totalMinis, score }) {
	if (completed) return <span className="t-tag t-tag-green">Completed{typeof score === 'number' ? ` · ${score}%` : ''}</span>
	if (miniCount > 0) return <span className="t-tag t-tag-tan">{miniCount}/{totalMinis} mini-lessons</span>
	return <span className="t-tag">Not started</span>
}

export default function StudentDrawer({ student, onClose }) {
	const completedModules = new Set(student.completedModules || [])
	const minis = student.miniLessons || []
	const portfolio = student.portfolio
	const totalCents = portfolio?.totalCents
	const gainCents = portfolio?.gainCents
	const holdings = portfolio?.holdings || []
	const transactions = portfolio?.transactions || []

	return (
		<>
			<div className="t-drawer-top">
				<div>
					<h2>{student.name}</h2>
					<p className="t-gray">Level {student.level} · {student.email}</p>
					<p className="t-small t-gray">{(student.classes || []).map(item => item.name).join(', ')}</p>
				</div>
				<button className="t-close-btn" onClick={onClose} aria-label="Close">&times;</button>
			</div>

			<div className="t-student-numbers">
				<div><b>{student.xp}</b><span>XP</span></div>
				<div><b>{student.quizAverage === null ? '—' : `${student.quizAverage}%`}</b><span>Quiz avg</span></div>
				<div><b>{completedModules.size}/{LESSONS.length}</b><span>Modules</span></div>
			</div>

			<div className="t-card">
				<h3>Lessons</h3>
				{LESSONS.map(lesson => {
					const miniCount = new Set(minis.filter(item => item.moduleId === lesson.id).map(item => item.sectionIndex)).size
					const score = student.bestScores?.[String(lesson.id)]
					return (
						<div className="t-row" key={lesson.id}>
							<div className="t-row-text">
								<div className="t-row-title">{lesson.title}</div>
								<div className="t-row-subtitle">
									{miniCount}/{lesson.screens.length} mini-lessons completed
									{typeof score === 'number' ? ` · Best quiz: ${score}%` : ''}
								</div>
							</div>
							<LessonTag
								completed={completedModules.has(lesson.id)}
								miniCount={miniCount}
								totalMinis={lesson.screens.length}
								score={score}
							/>
						</div>
					)
				})}
			</div>

			<div className="t-card">
				<h3>
					Portfolio: {typeof totalCents === 'number' ? formatCents(totalCents) : portfolio ? 'Market value unavailable' : 'Not started'}
				</h3>

				{typeof gainCents === 'number' && (
					<p className={`t-small ${gainCents >= 0 ? 't-green' : 't-red'}`}>
						{gainCents >= 0 ? '+' : '−'}{formatCents(Math.abs(gainCents))} realized and unrealized gain
					</p>
				)}

				{portfolio && (
					<p className="t-small t-gray" style={{ margin: '4px 0 10px' }}>
						Cash: {formatCents(portfolio.cashCents)}
					</p>
				)}

				{holdings.length === 0 ? (
					<div className="t-nothing-here">No stocks held.</div>
				) : (
					<table>
						<thead>
							<tr><th>Stock</th><th>Shares</th><th>Value</th></tr>
						</thead>
						<tbody>
							{holdings.map(holding => (
								<tr key={holding.symbol}>
									<td><b>{holding.symbol}</b></td>
									<td>{holding.shares.toLocaleString('en-US', { maximumFractionDigits: 6 })}</td>
									<td>{typeof holding.valueCents === 'number' ? formatCents(holding.valueCents) : 'Unavailable'}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			<div className="t-card">
				<h3>Recent trades</h3>
				{transactions.length === 0 ? (
					<div className="t-nothing-here">No trades yet.</div>
				) : (
					<table>
						<thead>
							<tr><th>Action</th><th>Stock</th><th>Amount</th></tr>
						</thead>
						<tbody>
							{transactions.map((trade, index) => (
								<tr key={`${trade.timestamp}-${trade.symbol}-${index}`}>
									<td>{trade.type}</td>
									<td>{trade.symbol}</td>
									<td>{formatCents(trade.amountCents)}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			<button className="t-btn t-btn-outline" onClick={onClose}>Close</button>
		</>
	)
}