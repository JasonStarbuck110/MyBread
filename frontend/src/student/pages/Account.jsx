import { getLevelInfo } from '../../shared/mockData'

export default function Account({ user, classes = [], xp, onJoin, onLogout }) {
	const { level } = getLevelInfo(xp)

	return (
		<>
			<header className="page-head">
				<h1>Account</h1>
			</header>
			<section className="panel">
				<h3>Profile</h3>
				<dl className="profile">
					<dt>Name</dt>
					<dd>{user.name}</dd>
					<dt>Role</dt>
					<dd>Student</dd>
					<dt>Level</dt>
					<dd>{level}, {xp} XP</dd>
				</dl>
			</section>
			<section className="panel">
				<h3>My classes</h3>
				{classes.length === 0 ? (
					<p className="muted">You haven't joined any classes yet.</p>
				) : (
					<ul className="list">
						{classes.map(classroom => (
							<li key={String(classroom._id || classroom.id)}>
								<strong>{classroom.name}</strong>
							</li>
						))}
					</ul>
				)}
				<button className="btn" onClick={onJoin}>
					Join class
				</button>
			</section>
			<button className="btn" onClick={onLogout}>
				Log out
			</button>
		</>
	)
}