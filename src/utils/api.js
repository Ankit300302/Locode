const API_BASE_URL = 'http://localhost:5000/api'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('locode_token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong')
  }

  return data
}

export const api = {
  sendOtp: (identity, name, role) => request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ identity, name, role })
  }),
  
  verifyOtp: (identity, code, name, role) => request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identity, code, name, role })
  }),
  
  getLocations: (all = false) => request(`/locations${all ? '?all=true' : ''}`),
  
  addLocation: (locationData) => request('/locations', {
    method: 'POST',
    body: JSON.stringify(locationData)
  }),
  
  decodeLoCode: (locode) => request(`/locations/decode/${locode}`),
  
  getAdminStats: () => request('/admin/stats'),
  
  getAdminUsers: () => request('/admin/users'),
  
  updateUserRole: (userId, role) => request(`/admin/users/${userId}/role`, {
    method: 'POST',
    body: JSON.stringify({ role })
  }),
  
  getOtpLogs: () => request('/admin/otps')
}
