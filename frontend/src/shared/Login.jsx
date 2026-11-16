import { useState } from 'react'
import logo from '../assets/logo.png'
import './login.css'

export default function Login({ onLogin, onSignup }) {
  const [resending, setResending] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const [show, setShow] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [mode, setMode] = useState('login') // 'login', 'signup' or 'forgot'
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const signup = mode === 'signup'
  const forgot = mode === 'forgot'
  const [resetSentTo, setResetSentTo] = useState('')
  const goTo = (next) => {
    setShow(false)
    setShowConfirm(false)
    setError('')
    setResetSentTo('')
    setMode(next)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const data = new FormData(e.currentTarget)
    const email = data.get('email').trim()

    if (forgot) {
      setError('')
      setSubmitting(true)

      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(
            result.error || 'Unable to request a password reset.'
          )
        }

        setResetSentTo(email)
      } catch (err) {
        setError(
          err.message || 'Unable to request a password reset.'
        )
      } finally {
        setSubmitting(false)
      }

      return
    }

    const password = data.get('password')
    if (signup && (password.length < 12 || password.length > 128)) {
      setError("Password must be between 12 and 128 characters.")
      return
    }

    if (signup && password !== data.get('confirm')) {
      setError("Passwords don't match.")
      return
    }
    setError('')
    setSubmitting(true)
    try {
      if (signup) {
        await onSignup({ name: data.get('name').trim(), email, password })
        setPendingEmail(email)
        setMode('verification')
      } else {
        await onLogin({ email, password })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resendVerification = async () => {
    if (!pendingEmail || resending) return

    setResending(true)
    setResendMessage('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: pendingEmail
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to request verification email.'
        )
      }

      setResendMessage(
        data.message ||
        'If your account is awaiting verification, a new link will be sent.'
      )
    } catch (error) {
      setResendMessage(
        error.message || 'Something went wrong. Please try again.'
      )
    } finally {
      setResending(false)
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
          {mode === 'verification' ? (
            <>
              <h2>Verify your email</h2>
              <p>We've sent a verification link to:</p>
              <p><strong>{pendingEmail}</strong></p>
              <p className="muted">
                Check your inbox and click the link to
                activate your MyBread account.
                The link expires in 30 minutes.
              </p>
              <p className="muted">Didn't receive the email?</p>
              <button
                type="button"
                className="linkbtn"
                onClick={resendVerification}
                disabled={resending}
              >
                {resending ? 'Requesting...' : 'Resend Verification Email'}
              </button>
              {resendMessage && (
                <p className="muted" role="status">
                  {resendMessage}
                </p>
              )}
              <button
                type="button"
                className="linkbtn"
                onClick={() => goTo('login')}
              >
                Back to login
              </button>
            </>
            ) : forgot ? (
              <>
                <h2>Password reset</h2>
                {resetSentTo ? (
                  <p className="muted" role="status">If an eligible account exists for {resetSentTo},a password reset link will be sent. Check your inbox and spam folder.</p>
                ) : (
                  <>
                    <p className="muted">Enter your email address and we'll send you a link to reset your password.</p>
                    <div className="field">
                      <label htmlFor="reset-email">
                        Email address
                      </label>
                      <input
                        id="reset-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                      />
                    </div>
                    {error && (
                      <p className="form-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button
                      className="btn"
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting
                        ? 'Requesting...'
                        : 'Send Reset Link'}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="linkbtn"
                  onClick={() => goTo('login')}
                >
                  Back to log in
                </button>
              </>
            ) : (
            <>
              <h2>{signup ? 'Create your Account' : 'Log in to your account'}</h2>
              {signup && (
                <div className="field">
                  <label htmlFor="name"><span>Full name</span></label>
                  <input id="name" name="name" type="text" autoComplete="name" required/>
                </div>
              )}
              <div className="field">
                <label htmlFor="email"><span>Email address</span></label>
                <input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="field">
                <label htmlFor="password"><span>Password</span></label>
                <div className="pw">
                  <input id="password" name="password" type={show ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 12 : undefined} maxLength={signup ? 128 : undefined} required />
                  <button type="button" className="show" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
                </div>
                {signup && (
                  <p className="password-hint">Password must be at least 12 characters long.</p>
                )}
              </div>
              {signup && (
                <div className="field">
                  <label htmlFor="confirm"><span>Confirm password</span></label>
                  <div className="pw">
                    <input id="confirm" name="confirm" required type={showConfirm ? 'text' : 'password'} autoComplete="new-password" onChange={() => setError('')} />
                    <button type="button" className="show" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
              )}
              {error && <p className="form-error" role="alert">{error}</p>}
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