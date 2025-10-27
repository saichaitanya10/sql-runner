import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import HomePage from './components/HomePage'
import './index.css'
import { LoginPage } from './components/LoginPage'
import { WelcomeScreen } from './components/WelcomeScreen'
import { auth, isFirebaseConfigured } from './lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'

function AuthGate() {
  if (!isFirebaseConfigured) {
    return <HomePage />
  }
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<any | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = onAuthStateChanged(auth, (u) => {
      const wasAuthed = !!user
      setUser(u)
      setReady(true)
      if (u && !wasAuthed) {
        setShowWelcome(true)
        navigate('/welcome', { replace: true })
      }
      if (!u && location.pathname !== '/') {
        navigate('/', { replace: true })
      }
    })
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (showWelcome) {
      const t = setTimeout(() => {
        setShowWelcome(false)
        navigate('/app', { replace: true })
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [showWelcome, navigate])

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">Loading…</div>
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app" replace /> : <LoginPage />} />
      <Route path="/welcome" element={user ? <WelcomeScreen /> : <Navigate to="/" replace />} />
      <Route path="/app" element={user ? <HomePage /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to={user ? '/app' : '/'} replace />} />
    </Routes>
  )
}

const root = document.getElementById('root')!
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    {isFirebaseConfigured ? (
      <BrowserRouter>
        <AuthGate />
      </BrowserRouter>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)
