import { useState } from 'react'
import logo from '../assets/logo.png'
import './login.css'

// Placeholders for the backend. Replace each body with a fetch to POST /api/auth/signup, /api/auth/login
// or /api/auth/forgot-password, and throw new Error(serverMessage) on a failed response: the form shows
// that message under the fields.
const signUpRequest = async ({ name, email, role }) => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return { name: name || 'New user', email, role }
}
const logInRequest = async () => {
  await new Promise((resolve) => setTimeout(resolve, 400))
}
// The server should answer the same way whether or not the email has an account,
// so this form can't be used to find out who is registered.
const resetPasswordRequest = async () => {
  await new Promise((resolve) => setTimeout(resolve, 400))
}

export default function Login({ onLogin }) {
  const [show, setShow] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [mode, setMode] = useState('login') // 'login', 'signup' or 'forgot'
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('') // email the reset link was requested for
  const [submitting, setSubmitting] = useState(false)
  const signup = mode === 'signup'
  const forgot = mode === 'forgot'

  const goTo = (next) => {
    setShow(false)
    setShowConfirm(false)
    setError('')
    setSentTo('')
    setMode(next)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const data = new FormData(e.currentTarget)
    const email = data.get('email').trim()

    if (forgot) {
      if (!email) {
        setError('Enter your email address.')
        return
      }
      setError('')
      setSentTo('')
      setSubmitting(true)
      try {
        await resetPasswordRequest({ email })
        setSentTo(email)
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    const password = data.get('password')
    if (signup && password !== data.get('confirm')) {
      setError("Passwords don't match.")
      return
    }
    setError('')
    setSubmitting(true)
    try {
      if (signup) {
        onLogin(await signUpRequest({ name: data.get('name').trim(), email, password, role }))
      } else {
        await logInRequest({ email, password })
        onLogin()
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
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
        <form key={mode} onSubmit={submit}>
          {forgot ? (
            <>
              <h2>Reset your password</h2>
              <div className="field">
                <label htmlFor="email"><span>Email address</span></label>
                <input id="email" name="email" type="email" autoComplete="email" />
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              {sentTo && (
                <p className="gain" role="status">
                  If an account exists for {sentTo}, a reset link is on its way. Check your inbox and spam folder.
                </p>
              )}
              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : (sentTo ? 'Send again' : 'Send reset link')}
              </button>
              <button type="button" className="linkbtn" onClick={() => goTo('login')}>Back to log in</button>
            </>
          ) : (
            <>
              <h2>{signup ? 'Create your Account' : 'Log in to your account'}</h2>
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
                <input id="email" name="email" type="email" autoComplete="email" />
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
                </div>
              )}
              {error && <p className="form-error" role="alert">{error}</p>}
              {!signup && <label className="remember"><input type="checkbox" defaultChecked /> Remember my password</label>}
              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? (signup ? 'Creating account…' : 'Logging in…') : (signup ? 'Sign up' : 'Log in')}
              </button>
              {!signup && <button type="button" className="linkbtn" onClick={() => goTo('forgot')}>Forgot password?</button>}
              <p className="switch-mode">
                {signup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button type="button" className="linkbtn inline" onClick={() => goTo(signup ? 'login' : 'signup')}>{signup ? 'Sign In' : 'Sign Up'}</button>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  )
}