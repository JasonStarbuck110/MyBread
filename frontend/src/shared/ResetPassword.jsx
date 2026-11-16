import { useEffect, useState } from 'react'
import logo from '../assets/logo.png'
import './login.css'

export default function ResetPassword() {
    const [token] = useState(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))

    return params.get('token')
})

const validToken = /^[a-f0-9]{64}$/i.test(token || '')
const [password, setPassword] = useState('')
const [confirmPassword, setConfirmPassword] = useState('')
const [showPassword, setShowPassword] = useState(false)
const [submitting, setSubmitting] = useState(false)
const [success, setSuccess] = useState(false)
const [error, setError] = useState('')

useEffect(() => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)}, [])

    const handleSubmit = async (e) => {
    e.preventDefault()

    if (submitting || success || !validToken) return
    setError('')
    if (password.length < 12 || password.length > 128) {
        setError('Password must be between 12 and 128 characters.')
        return
    }

    if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
    }

    setSubmitting(true)

    try {
        const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        token,
        password
        })
    })

    const data = await response.json()
    if (!response.ok) {
        throw new Error(
            data.error || 'Unable to reset your password.'
        )
    }
        setPassword('')
        setConfirmPassword('')
        setSuccess(true)
    } catch (err) {
        setError(
        err.message || 'Something went wrong. Please try again.'
        )} finally {
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
        <form onSubmit={handleSubmit}>
            {!validToken ? (
            <>
            <h2>Invalid reset link</h2>
            <p className="form-error" role="alert">This password reset link is invalid. Please request a new one.</p>
            <a href="/" className="linkbtn">Back to Log In</a>
            </>
            ) : success ? (
            <>
            <h2>Password Updated!</h2>
            <p className="muted" role="status">Your password has been reset successfully. You can now log in using your new password.</p>
            <a href="/" className="linkbtn">Back to Log In</a>
            </>
            ) : (
            <>
            <h2>Create New Password</h2>
            <p className="muted">Enter your new password below.</p>
            <div className="field">
                <label htmlFor="new-password">New password</label>
                <div className="pw">
                    <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={12}
                    maxLength={128}
                    required
                />
                <button
                    type="button"
                    className="show"
                    onClick={() => setShowPassword(!showPassword)}
                    >
                    {showPassword ? 'Hide' : 'Show'}
                    </button>
                </div>
                <p className="password-hint">Password must be at least 12 characters long.</p>
            </div>
            <div className="field">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                </div>
                {error && (
                <p className="form-error" role="alert">{error}</p>
                )}
                <button
                className="btn"
                type="submit"
                disabled={submitting}
                >
                {submitting
                    ? 'Resetting Password...'
                    : 'Reset Password'}
                </button>
            </>
            )}
        </form>
        </div>
    </div>
    )
}