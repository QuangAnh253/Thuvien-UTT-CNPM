import { getUser, clearAuth } from './auth'
import { useNavigate } from 'react-router'

export function useAuth() {
  const user = getUser() // { id, role, username }
  const navigate = useNavigate()

  const logout = () => {
    clearAuth()
    navigate('/login')
  }

  return { user, logout }
}