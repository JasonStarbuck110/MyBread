import './teacher.css'

// Kurtis's section: build the teacher dashboard in this folder.
// Tip: prefix class names with "t-" so they never clash with student styles.
export default function TeacherApp({ onLogout }) {
  return (
    <div className="t-page">
      <h1>Teacher dashboard</h1>
      <button className="btn" onClick={onLogout}>Log out</button>
    </div>
  )
}
