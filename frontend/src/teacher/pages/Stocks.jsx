import ClassChart from '../components/ClassChart'
import ProgressBar from '../components/ProgressBar'
import { students, stockPrices, STARTING_CASH } from '../data'
import {
  formatMoney, formatChange, daysAgoText, getInitials, percent, getHoldingValue,
  getPortfolioValue, getProfit, getAllTrades,
} from '../helpers'

export default function Stocks({ openStudent }) {
  let classTotal = 0
  let investing = 0
  for (const student of students) {
    classTotal += getPortfolioValue(student)
    if (student.holdings.length > 0) investing++
  }
  const avgProfit = classTotal / students.length - STARTING_CASH

  const trades = getAllTrades()
  const tradesThisWeek = trades.filter((t) => t.holding.daysAgo < 7).length

  const owners = Object.keys(stockPrices)
    .map((ticker) => ({
      ticker,
      count: students.filter((s) => s.holdings.some((h) => h.ticker === ticker)).length,
    }))
    .sort((a, b) => b.count - a.count)
  const mostOwners = owners[0].count || 1

  const ranked = [...students].sort((a, b) => getProfit(b) - getProfit(a)).slice(0, 5)

  return (
    <>
      <div className="t-page-header">
        <div>
          <h1>Stocks</h1>
          <p>How the class is doing in the stock simulator. None of this is real money.</p>
        </div>
      </div>

      <div className="t-four-columns" style={{ marginBottom: 22 }}>
        <div className="t-card t-number-card">
          <div className="t-label">Class total</div>
          <div className="t-number">{formatMoney(classTotal)}</div>
          <div className="t-note">{students.length} portfolios</div>
        </div>
        <div className="t-card t-number-card">
          <div className="t-label">Avg profit / loss</div>
          <div className="t-number">{formatChange(avgProfit)}</div>
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
          <div className="t-note">Stock purchases</div>
        </div>
      </div>

      <div className="t-card">
        <h2>Class average portfolio</h2>
        <ClassChart />
        <p className="t-small t-gray" style={{ marginTop: 12 }}>
          Sample data for now. This will come from saved portfolio values later.
        </p>
      </div>

      <div className="t-two-columns">
        <div className="t-card">
          <h2>Most owned stocks</h2>
          {owners.map((item) => (
            <div className="t-stock-bar-row" key={item.ticker}>
              <div><b>{item.ticker}</b> <span className="t-gray">{stockPrices[item.ticker].name}</span></div>
              <ProgressBar value={percent(item.count, mostOwners)} />
              <b style={{ textAlign: 'right' }}>{item.count}</b>
            </div>
          ))}
          <p className="t-small t-gray" style={{ marginTop: 10 }}>Number of students who own each stock.</p>
        </div>
        <div className="t-card">
          <h2>Top portfolios</h2>
          {ranked.map((student, i) => {
            const profit = getProfit(student)
            return (
              <div className="t-row" key={student.id} style={{ cursor: 'pointer' }} onClick={() => openStudent(student.id)}>
                <div className={'t-initials ' + (i < 3 ? 't-rank' : '')}>{i + 1}</div>
                <div className="t-row-text">
                  <div className="t-row-title">{student.name}</div>
                  <div className="t-row-subtitle">{formatMoney(getPortfolioValue(student))}</div>
                </div>
                <b className={profit >= 0 ? 't-green' : 't-red'}>{formatChange(profit)}</b>
              </div>
            )
          })}
        </div>
      </div>

      <div className="t-card">
        <h2>Recent trades</h2>
        <table>
          <thead><tr><th>Student</th><th>Stock</th><th>Shares</th><th>Value now</th><th>When</th></tr></thead>
          <tbody>
            {trades.slice(0, 8).map(({ student, holding: h }) => (
              <tr className="t-click-row" key={student.id + h.ticker} onClick={() => openStudent(student.id)}>
                <td><div className="t-name"><div className="t-initials">{getInitials(student.name)}</div>{student.name}</div></td>
                <td><b>{h.ticker}</b> <span className="t-gray">{stockPrices[h.ticker].name}</span></td>
                <td>{h.shares}</td>
                <td>{formatMoney(getHoldingValue(h))}</td>
                <td className="t-gray">{daysAgoText(h.daysAgo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
