import { useState } from 'react'
import logo from '../assets/logo.png'
import './login.css'

export default function Login({ onLogin }) {
  const [show, setShow] = useState(false)
  return (
    <div className="login">
      <aside className="login-art">
        <img src={logo} alt="" />
        <h1>MyBread</h1>
        <p>Learn how money works by practicing with it.</p>
      </aside>
      <div className="login-form">
        <form onSubmit={(e) => { e.preventDefault(); onLogin() }}>
          <h2>Log in to your account</h2>
          <p className="muted">with your registered Email Address</p>
          <div className="field">
            <label htmlFor="email"><span>Email address</span></label>
            <input id="email" type="email" autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password"><span>Password</span></label>
            <div className="pw">
              <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" />
              <button type="button" className="show" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          <label className="remember"><input type="checkbox" defaultChecked /> Remember my password</label>
          <button className="btn" type="submit">Log in</button>
          <button type="button" className="linkbtn">Forgot password?</button>
        </form>
      </div>
    </div>
  )
}
