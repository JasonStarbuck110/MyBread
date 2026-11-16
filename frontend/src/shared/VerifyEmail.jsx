import { useEffect, useRef, useState } from 'react'
import logo from '../assets/logo.png'
import './login.css'

export default function VerifyEmail() {
const started = useRef(false)
const [token] = useState(() => {
    const params = new URLSearchParams(
    window.location.hash.slice(1)
    )
    return params.get('token')
})
const validToken = /^[a-f0-9]{64}$/i.test(token || '')
const [status, setStatus] = useState(
    validToken ? 'loading' : 'error'
)
const [message, setMessage] = useState(
    validToken ? 'Verifying your email address...' : 'Invalid verification link.'
)

useEffect(() => {
    if (started.current) return
    started.current = true

    window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
    )

if (!validToken) return

async function verifyEmail() {
    try {
        const response = await fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        })
        const data = await response.json()
        if (!response.ok) {
            throw new Error(
            data.error || 'Email verification failed.'
            )
        }

        setStatus('success')
        setMessage(
            'Your email has been verified! You can now log in.'
        )
        } catch (error) {
        setStatus('error')
        setMessage(
            error.message || 'Unable to verify your email.'
        )
    }
}

    verifyEmail()
    }, [token, validToken])

return (
    <div className="login">
        <aside className="login-art">
        <img src={logo} alt="" />
        <h1>MyBread</h1>
        <p>Learn how money works by practicing with it.</p>
        </aside>
        <div className="login-form">
        <section className="verify-panel" aria-live="polite">
            <h2>
            {status === 'loading'
                ? 'Verifying Email'
                : status === 'success'
                ? 'Email Verified!'
                : 'Verification Failed'}
            </h2>
            <p className={status === 'error' ? 'form-error' : 'muted'}>{message}</p>
            {status !== 'loading' && (
            <a href="/" className="linkbtn">Back to Log In</a>
            )}
        </section>
        </div>
    </div>
    )
}