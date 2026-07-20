import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('locode_user')
    const storedToken = localStorage.getItem('locode_token')
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('locode_user', JSON.stringify(userData))
    localStorage.setItem('locode_token', userData.id)
  }

  const logout = () => {
    setUser(null)
    setLocations([])
    localStorage.removeItem('locode_user')
    localStorage.removeItem('locode_token')
  }

  const fetchLocations = async () => {
    try {
      const data = await api.getLocations()
      setLocations(data)
    } catch (err) {
      console.error('Error fetching locations:', err)
    }
  }

  const addLocation = async (loc) => {
    const newLoc = await api.addLocation(loc)
    setLocations(prev => [newLoc, ...prev])
    return newLoc
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, locations, fetchLocations, addLocation, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

