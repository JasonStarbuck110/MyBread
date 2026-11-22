import { useState } from 'react'
import logo from '../assets/logo.png'
import './login.css'

function EyeIcon({ open }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M4 4l16 16" />}
    </svg>
  )
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

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

  // No Google auth exists on the backend yet, so this is visual only for now.
  const googleClick = () => setError("Google sign-in isn't available yet.")

  return (
    <div className="mybread-sign-in">
      <section className="brand-story">
        <div className="mybread-wordmark">MyBread</div>
        <p className="brand-promise">
          Learn how<br />
          <span className="em">money works</span><br />
          by practicing<br />
          with it.
        </p>
        <div className="duck-stage" aria-hidden="true">
          <div className="wide-orbit" />
          <div className="inner-orbit" />
          <div className="apricot-backing-card" />
          <img className="duck" alt="" src={logo} />
          <div className="translucent-paper" />
          <div className="money-token">
            <div className="token-inset-border" />
            <span className="dollar-symbol">$</span>
          </div>
        </div>
      </section>

      <section className="sign-in-form">
        <form key={mode} onSubmit={submit}>
          {mode === 'verification' ? (
            <>
              <h2 className="sign-in-heading">Verify your<br />email</h2>
              <p className="form-copy">We've sent a verification link to:</p>
              <p className="form-copy"><strong>{pendingEmail}</strong></p>
              <p className="form-copy muted">
                Check your inbox and click the link to activate your MyBread
                account. The link expires in 30 minutes.
              </p>
              <p className="form-copy muted">Didn't receive the email?</p>
              <button type="button" className="text-link" onClick={resendVerification} disabled={resending}>
                {resending ? 'Requesting...' : 'Resend Verification Email'}
              </button>
              {resendMessage && <p className="form-copy muted" role="status">{resendMessage}</p>}
              <button type="button" className="text-link" onClick={() => goTo('login')}>Back to login</button>
            </>
          ) : forgot ? (
            <>
              <h2 className="sign-in-heading">Password<br />reset</h2>
              {resetSentTo ? (
                <p className="form-copy muted" role="status">
                  If an eligible account exists for {resetSentTo}, a password reset link will be sent. Check your inbox and spam folder.
                </p>
              ) : (
                <>
                  <p className="form-copy muted">Enter your email address and we'll send you a link to reset your password.</p>
                  <div className="sf-field">
                    <label htmlFor="reset-email">Email</label>
                    <div className="input-wrap">
                      <input id="reset-email" name="email" type="email" autoComplete="email" placeholder="Enter your email" required />
                    </div>
                  </div>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <button className="sign-in-button" type="submit" disabled={submitting}>
                    {submitting ? 'Requesting...' : 'Send Reset Link'}
                  </button>
                </>
              )}
              <button type="button" className="text-link" onClick={() => goTo('login')}>Back to log in</button>
            </>
          ) : (
            <>
              <h2 className="sign-in-heading">
                {signup ? <>Create your<br />account</> : <>Log in to your<br />account</>}
              </h2>

              {signup && (
                <div className="sf-field">
                  <label htmlFor="name">Full name</label>
                  <div className="input-wrap">
                    <input id="name" name="name" type="text" autoComplete="name" placeholder="Enter your full name" required />
                  </div>
                </div>
              )}

              <div className="sf-field">
                <label htmlFor="email">Email</label>
                <div className="input-wrap">
                  <input id="email" name="email" type="email" autoComplete="email" placeholder="Enter your email" required />
                </div>
              </div>

              <div className="sf-field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    name="password"
                    type={show ? 'text' : 'password'}
                    autoComplete={signup ? 'new-password' : 'current-password'}
                    minLength={signup ? 12 : undefined}
                    maxLength={signup ? 128 : undefined}
                    placeholder="Enter your password"
                    required
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
                    <EyeIcon open={show} />
                  </button>
                </div>
                {signup && <p className="password-hint">Password must be at least 12 characters long.</p>}
              </div>

              {signup && (
                <div className="sf-field">
                  <label htmlFor="confirm">Confirm password</label>
                  <div className="input-wrap">
                    <input
                      id="confirm"
                      name="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      onChange={() => setError('')}
                      required
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'Hide password' : 'Show password'} aria-pressed={showConfirm}>
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                </div>
              )}

              {!signup && (
                <div className="form-options">
                  {/* Visual only: the backend doesn't support a longer session yet. */}
                  <label className="remember-for-days">
                    <input type="checkbox" name="remember" />
                    <span>Remember for 30 days</span>
                  </label>
                  <button type="button" className="text-link" onClick={() => goTo('forgot')}>Forgot password?</button>
                </div>
              )}

              {error && <p className="form-error" role="alert">{error}</p>}

              <button className="sign-in-button" type="submit" disabled={submitting}>
                {submitting ? (signup ? 'Creating account…' : 'Signing in…') : (signup ? 'Sign up' : 'Sign in')}
              </button>

              <button type="button" className="sign-in-with-google" onClick={googleClick}>
                <GoogleLogo />
                <span>{signup ? 'Sign up with Google' : 'Sign in with Google'}</span>
              </button>

              <p className="create-account">
                <span className="account-question">{signup ? 'Already have an account?' : "Don't have an account?"}</span>
                <button type="button" className="text-link" onClick={() => goTo(signup ? 'login' : 'signup')}>
                  {signup ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </>
          )}
        </form>
      </section>
    </div>
  )
}