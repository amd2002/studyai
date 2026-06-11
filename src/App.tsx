import { AuthProvider, useAuth } from '@/context/AuthContext'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

function Gate() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-3 border-border border-t-accent rounded-full animate-spin" />
      </div>
    )
  }
  return user ? <Dashboard /> : <Login />
}

export default function App() {
  return <AuthProvider><Gate /></AuthProvider>
}
