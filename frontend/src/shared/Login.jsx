import { useState } from 'react'
import logo from '../assets/logo.png'
import './login.css'

export default function Login({ onLogin }) {
  const [show, setShow] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const signup = mode === 'signup'

  const switchMode = () => {
    setShow(false)
    setShowConfirm(false)
    setError('')
    setMode(signup ? 'login' : 'signup')
  }

  const submit = (e) => {
    e.preventDefault()
    if (!signup) return onLogin()
    const data = new FormData(e.currentTarget)
    if (data.get('password') !== data.get('confirm')) {
      setError("Passwords don't match.")
      return
    }
    const name = data.get('name').trim()
    onLogin({ name: name || 'New user', role })
  }

  return (
    <div className="login">
      <aside className="login-art">
        <img src={logo} alt="" />
        <h1>MyBread</h1>
        <p>Learn how money works by practicing with it.</p>
      </aside>
      <div className="login-form">
        <form key={mode} onSubmit={submit}>
          <h2>{signup ? 'Create your Account' : 'Log in to your account'}</h2>
          <p className="muted">{signup ? 'with your Email Address' : 'with your registered Email Address'}</p>
          {signup && (
            <div className="field">
              <label htmlFor="name"><span>Full name</span></label>
              <input id="name" name="name" type="text" autoComplete="name" />
            </div>
          )}
          {signup && (
            <fieldset className="role-picker">
              <legend>I am a</legend>
              {[['student', 'Student'], ['teacher', 'Teacher']].map(([value, label]) => (
                <label key={value} className={role === value ? 'selected' : ''}>
                  <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} />
                  {label}
                </label>
              ))}
            </fieldset>
          )}
          <div className="field">
            <label htmlFor="email"><span>Email address</span></label>
            <input id="email" type="email" autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password"><span>Password</span></label>
            <div className="pw">
              <input id="password" name="password" type={show ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} />
              <button type="button" className="show" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          {signup && (
            <div className="field">
              <label htmlFor="confirm"><span>Confirm password</span></label>
              <div className="pw">
                <input id="confirm" name="confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" onChange={() => setError('')} />
                <button type="button" className="show" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? 'Hide' : 'Show'}</button>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
            </div>
          )}
          {!signup && <label className="remember"><input type="checkbox" defaultChecked /> Remember my password</label>}
          <button className="btn" type="submit">{signup ? 'Sign up' : 'Log in'}</button>
          {!signup && <button type="button" className="linkbtn">Forgot password?</button>}
          <p className="switch-mode">
            {signup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="linkbtn inline" onClick={switchMode}>{signup ? 'Sign In' : 'Sign Up'}</button>
          </p>
        </form>
      </div>
    </div>
  )
}