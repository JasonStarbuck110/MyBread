import ProgressBar from '../components/ProgressBar'
import useTeacherStocks from '../useTeacherStocks'
import { formatMoney, formatChange, getInitials, percent } from '../helpers'

export default function Stocks({ openStudent, token, classes, classesLoading, classesError }) {
	const {
		students,
		loading,
		error,
		refresh,
		classTotal,
		avgProfit,
		investing,
		trades,
		tradesThisWeek,
		owners,
		mostOwners,
		ranked
	} = useTeacherStocks(token, classes, classesLoading, classesError)


  return (
    <>
      <div className="t-page-header">
        <div>
          <h1>Stocks</h1>
          <p>How the class is doing in the stock simulator. None of this is real money.</p>
        </div>
      </div>
      {loading && <p role="status">Loading student portfolios...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && (
        <button className="t-btn t-btn-outline" type="button" onClick={refresh}>
          Refresh portfolios
        </button>
      )}
      <div className="t-four-columns" style={{ marginBottom: 22 }}>
        <div className="t-card t-number-card">
          <div className="t-label">Class total</div>
          <div className="t-number">
            {classTotal === null ? 'Unavailable' : formatMoney(classTotal)}
          </div>
          <div className="t-note">{students.length} portfolios</div>
        </div>
        <div className="t-card t-number-card">
          <div className="t-label">Avg profit / loss</div>
          <div className="t-number">
            {avgProfit === null ? 'Unavailable' : formatChange(avgProfit)}
          </div>
          <div className="t-note">Per student</div>
        </div>
        <div className="t-card t-number-card">
          <div className="t-label">Students investing</div>
          <div className="t-number">{investing}/{students.length}</div>
          <div className="t-note">Own at least one stock</div>
        </div>
        <div className="t-card t-number-card">
          <div className="t-label">Trades this week</div>
          <div className="t-number">{tradesThisWeek}</div>
          <div className="t-note">Purchases and sales</div>
        </div>
      </div>
      <div className="t-card">
        <h2>Class average portfolio</h2>
        <p className="t-small t-gray" style={{ marginTop: 12 }}>
          Historical class portfolio values are not yet recorded.
          Current portfolio information is available below.
        </p>
      </div>
      <div className="t-two-columns">
        <div className="t-card">
          <h2>Most owned stocks</h2>
          {owners.length === 0 && (
            <p className="t-small t-gray">No stocks held yet.</p>
          )}
          {owners.map((item) => (
            <div className="t-stock-bar-row" key={item.ticker}>
              <div><b>{item.ticker}</b></div>
              <ProgressBar value={percent(item.count, mostOwners)} />
              <b style={{ textAlign: 'right' }}>{item.count}</b>
            </div>
          ))}
          <p className="t-small t-gray" style={{ marginTop: 10 }}>Number of students who own each stock.</p>
        </div>
        <div className="t-card">
          <h2>Top portfolios</h2>
          {ranked.length === 0 && (
            <p className="t-small t-gray">No portfolios available for ranking.</p>
          )}
          {ranked.map((student, i) => {
            const profit = student.portfolio.gainCents / 100
            return (
              <div className="t-row" key={student.id} style={{ cursor: 'pointer' }} onClick={() => openStudent(student)}>
                <div className={'t-initials ' + (i < 3 ? 't-rank' : '')}>{i + 1}</div>
                <div className="t-row-text">
                  <div className="t-row-title">{student.name}</div>
                  <div className="t-row-subtitle">{formatMoney(student.portfolio.totalCents / 100)}</div>
                </div>
                <b className={profit >= 0 ? 't-green' : 't-red'}>{formatChange(profit)}</b>
              </div>
            )
          })}
        </div>
      </div>
      <div className="t-card">
        <h2>Recent trades</h2>
        {trades.length === 0 && (
          <p className="t-small t-gray">No trades have been recorded yet.</p>
        )}
        <table>
          <thead><tr><th>Student</th><th>Stock</th><th>Shares</th><th>Value amount</th><th>When</th></tr></thead>
          <tbody>
            {trades.slice(0, 8).map(({ student, holding: h }, index) => (
              <tr
                className="t-click-row"
                key={`${student.id}-${h.timestamp}-${index}`}
                onClick={() => openStudent(student)}
              >
                <td>
                  <div className="t-name">
                    <div className="t-initials">{getInitials(student.name)}</div>
                    {student.name}
                  </div>
                </td>
                <td>
                  <b>{h.symbol}</b>
                  <span className="t-gray"> {h.type}</span>
                </td>
                <td>{h.shares}</td>
                <td>{formatMoney(h.amountCents / 100)}</td>
                <td className="t-gray">
                  {h.timestamp ? new Date(h.timestamp).toLocaleDateString() : 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}