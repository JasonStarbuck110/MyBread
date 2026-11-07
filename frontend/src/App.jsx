import { useEffect, useState } from 'react'
import './shared/shared.css'
import Login from './shared/Login'
import StudentApp from './student/StudentApp'
import TeacherApp from './teacher/TeacherApp'

export default function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const savedToken = sessionStorage.getItem('mybread_token')

    if (!savedToken) {
      setCheckingAuth(false)
      return
    }

    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${savedToken}`
      }
    })
      .then(async response => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Session expired')
        }

        setToken(savedToken)
        setUser(data.user)
      })
      .catch(() => {
        sessionStorage.removeItem('mybread_token')
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        setCheckingAuth(false)
      })
  }, [])

  const handleLogin = async ({ email, password }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Login failed. Please try again.')
    }

    if (!data.token || !data.user) {
      throw new Error('The server returned an invalid login response.')
    }

    sessionStorage.setItem('mybread_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {
    sessionStorage.removeItem('mybread_token')
    setUser(null)
    setToken(null)
  }

  if (checkingAuth) {
    return <p>Checking your session...</p>
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  if (user.role === 'teacher') {
    return <TeacherApp user={user} token={token} onLogout={logout} />
  }

  return <StudentApp user={user} token={token} onLogout={logout} />
}