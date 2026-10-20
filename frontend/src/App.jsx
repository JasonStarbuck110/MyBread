import { useState } from 'react'
import './shared/shared.css'
import Login from './shared/Login'
import StudentApp from './student/StudentApp'
import TeacherApp from './teacher/TeacherApp'

// Prototype only: this will come from the backend session after login.
// Change role to 'teacher' to preview the teacher side.
const DEMO_USER = { name: 'Alex', role: 'student' }

export default function App() {
  const [user, setUser] = useState(DEMO_USER)

  if (!user) return <Login onLogin={() => setUser(DEMO_USER)} />

  const logout = () => setUser(null)
  return user.role === 'teacher' ? <TeacherApp onLogout={logout} /> : <StudentApp onLogout={logout} />
}
