import LevelRing from '../components/LevelRing'
import { money } from '../data'
import { getLevelInfo } from '../../shared/mockData'

export default function Home({
	user,
	total,
	cash,
	xp,
	lessons,
	setPage,
	onOpenLesson,
	classes = [],
	onJoin,
	assignments = [],
	assignmentsError = '',
	onOpenAssignment
}) {
	const next = lessons.find(l => l.status === 'next')
	const { level, xpNext } = getLevelInfo(xp)
	const classNames = classes.map(cls => cls.name).filter(Boolean).join(' and ')

	return (
		<>
			<header className="page-head head-row">
				<div>
					<h1>Good to see you, {user.name}</h1>
					{classNames && <p>{classNames}</p>}
				</div>
				<button className="btn" onClick={onJoin}>Join class</button>
			</header>
			<section className="hero">
				<LevelRing level={level} xp={xp} xpNext={xpNext} />
				<div className="hero-body">
					<h2>{xpNext - xp} XP to level {level + 1}</h2>
					<p>Finish "{next?.title ?? 'All lessons complete'}" to earn {next?.xp ?? 0} XP and move closer.</p>
					<button className="btn" onClick={() => next && onOpenLesson(next.id)} disabled={!next}>
						Continue lesson
					</button>
				</div>
			</section>
			<div className="grid">
				<section className="panel">
					<h3>Daily quests</h3>
					<p className="muted">Daily quests are not available yet.</p>
				</section>
				<section className="panel">
					<h3>Your portfolio</h3>
					<p className="big">{money(total)}</p>
					<p className="muted">{money(cash)} available to invest</p>
					<button className="btn ghost" onClick={() => setPage('stocks')}>
						Open stocks
					</button>
				</section>
			</div>
			<section className="panel">
				<h3>Assigned</h3>
				{assignmentsError && (
					<p role="alert">{assignmentsError}</p>
				)}
				{!assignmentsError && assignments.length === 0 && (
					<p className="muted">You have no assigned lessons yet.</p>
				)}
				<ul className="list">
					{assignments.map(assignment => (
						<li key={assignment._id}>
							<div>
								<strong>{assignment.title}</strong>
								<div className="muted">
									{assignment.completionStatus === 'rewarded'
									? 'Completed — reward claimed'
									: assignment.completionStatus === 'completed'
										? 'Completed — reward pending'
										: assignment.completionStatus === 'previously_completed'
										? 'Completed before assignment — reward not eligible'
										: 'Assigned'}
								</div>
								<div className="muted">
									{assignment.instructions}
								</div>
								<div className="muted">
									Due {assignment.dueDate ? String(assignment.dueDate).slice(0, 10) : 'Not specified'}
									{' · '}
									{assignment.rewardXp || 0} XP
									{' + $'}
									{((assignment.rewardCashCents || 0) / 100).toFixed(2)}
								</div>
							</div>
							<button
								type="button"
								className="btn ghost small"
								onClick={() => onOpenAssignment(assignment)}
							>
								Open
							</button>
						</li>
					))}
				</ul>
			</section>
		</>
	)
}