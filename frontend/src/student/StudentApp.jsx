import { useState } from 'react'
import Home from './pages/Home'
import Lessons from './pages/Lessons'
import Stocks from './pages/Stocks'
import Leaderboards from './pages/Leaderboards'
import Achievements from './pages/Achievements'
import Links from './pages/Links'
import Account from './pages/Account'
import JoinModal from './components/JoinModal'
import { ME, STUDENT, STOCKS } from './data'
import { useLinks } from '../shared/useLinks'
import logo from '../assets/logo.png'
import './student.css'

const NAV = [
  ['home', 'Dashboard'],
  ['lessons', 'Lessons'],
  ['stocks', 'Stocks'],
  ['leaderboards', 'Leaderboards'],
  ['achievements', 'Achievements'],
  ['links', 'Links'],
]

export default function StudentApp({ onLogout }) {
  const [page, setPage] = useState('home')
  const [cash, setCash] = useState(ME.cash)
  const [holdings, setHoldings] = useState(Object.fromEntries(ME.holdings.map((h) => [h.ticker, h.shares])))
  const [classes, setClasses] = useState([STUDENT.className])
  const [joinOpen, setJoinOpen] = useState(false)
  const [links] = useLinks()

  const stockValue = Object.entries(holdings).reduce((s, [t, sh]) => s + sh * STOCKS[t].price, 0)
  const total = cash + stockValue

  const navBtn = ([id, label]) => (
    <button key={id} className={page === id ? 'nav on' : 'nav'} onClick={() => setPage(id)} aria-current={page === id ? 'page' : undefined}>
      {label}
    </button>
  )

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <img src={logo} alt="" />
          MyBread
        </div>
        <nav aria-label="Main">{NAV.map(navBtn)}</nav>
        <div className="side-bottom">{navBtn(['account', 'Account'])}</div>
      </aside>

      <main className="main">
        {page === 'home' && <Home total={total} cash={cash} setPage={setPage} classes={classes} onJoin={() => setJoinOpen(true)} />}
        {page === 'lessons' && <Lessons />}
        {page === 'stocks' && (
          <Stocks cash={cash} setCash={setCash} holdings={holdings} setHoldings={setHoldings} total={total} stockValue={stockValue} />
        )}
        {page === 'leaderboards' && <Leaderboards total={total} />}
        {page === 'achievements' && <Achievements />}
        {page === 'links' && <Links links={links} />}
        {page === 'account' && <Account classes={classes} onJoin={() => setJoinOpen(true)} onLogout={onLogout} />}
      </main>

      {joinOpen && <JoinModal classes={classes} setClasses={setClasses} onClose={() => setJoinOpen(false)} />}
    </div>
  )
}
