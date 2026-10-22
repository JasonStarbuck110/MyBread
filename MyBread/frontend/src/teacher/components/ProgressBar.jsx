export default function ProgressBar({ value }) {
  return (
    <div className="t-bar">
      <div className="t-bar-fill" style={{ width: `${value}%` }} />
    </div>
  )
}
