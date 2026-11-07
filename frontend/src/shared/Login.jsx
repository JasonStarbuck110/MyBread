import { useState } from 'react'
import logo from '../assets/logo.png'
import './login.css'

export default function Login({ onLogin }) {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onLogin({
        email: email.trim(),
        password
      })
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <aside className="login-art">
        <img src={logo} alt="" />
        <h1>MyBread</h1>
        <p>Learn how money works by practicing with it.</p>
      </aside>

      <div className="login-form">
        <form onSubmit={handleSubmit}>
          <h2>Log in to your account</h2>
          <p className="muted">with your registered Email Address</p>

          <div className="field">
            <label htmlFor="email">
              <span>Email address</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">
              <span>Password</span>
            </label>
            <div className="pw">
              <input
                id="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="show"
                onClick={() => setShow(!show)}
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <p className="muted" role="alert">
              {error}
            </p>
          )}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <button type="button" className="linkbtn" disabled>
            Forgot password?
          </button>
        </form>
      </div>
    </div>
  )
}