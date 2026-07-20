import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BrandName } from './AuthPage'
import { api } from '../utils/api'
import { 
  Users, MapPin, Shield, Activity, LogOut, ArrowLeftRight, Search, 
  Trash2, UserCheck, RefreshCw, Calendar, Phone, Mail, Home, Building2, Briefcase, Eye 
} from 'lucide-react'

const LOCATION_TYPES = {
  home: { label: 'Home', icon: Home, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  apartment: { label: 'Apartment', icon: Building2, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  office: { label: 'Office', icon: Briefcase, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  shop: { label: 'Shop', icon: MapPin, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState(null)
  const [usersList, setUsersList] = useState([])
  const [locationsList, setLocationsList] = useState([])
  const [otpLogs, setOtpLogs] = useState([])
  const [activeTab, setActiveTab] = useState('stats') // 'stats', 'users', 'locations', 'otps'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [statsData, usersData, locationsData, otpsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getLocations(true), // Fetch all locations
        api.getOtpLogs()
      ])
      
      setStats(statsData)
      setUsersList(usersData)
      setLocationsList(locationsData)
      setOtpLogs(otpsData)
    } catch (err) {
      setError(err.message || 'Failed to fetch administrative data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    if (userId === user.id) {
      alert('You cannot revoke your own admin rights!')
      return
    }
    
    setUpdatingUserId(userId)
    try {
      await api.updateUserRole(userId, newRole)
      // Reload users list & stats
      const [usersData, statsData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats()
      ])
      setUsersList(usersData)
      setStats(statsData)
    } catch (err) {
      alert(err.message || 'Failed to update user role')
    } finally {
      setUpdatingUserId(null)
    }
  }

  // Filters
  const filteredUsers = usersList.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredLocations = locationsList.filter(l => 
    l.locode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.addressLine1?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-lc-dark text-white">
      {/* Background glow */}
      <div className="blob-blue -top-20 -left-20 opacity-30" style={{ position: 'fixed' }} />
      <div className="blob-pink bottom-0 -right-20 opacity-20" style={{ position: 'fixed' }} />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b px-5 py-4"
        style={{ background: 'rgba(13,10,26,0.9)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <BrandName size={34} />
          
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="hidden sm:flex items-center gap-1.5 text-[#42A5F5] hover:text-white transition-colors text-sm font-semibold">
              <ArrowLeftRight size={14} /> Go to User View
            </Link>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-[#1565C0]">
                {user?.avatar}
              </div>
              <span className="text-[#42A5F5] text-xs font-semibold uppercase tracking-wider hidden md:block">System Admin</span>
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-white flex items-center gap-2.5">
              <Shield className="text-[#42A5F5]" size={28} /> Control Center
            </h1>
            <p className="text-white/35 text-sm mt-1">Monitor digital location identity system metrics and logs.</p>
          </div>
          <button onClick={loadData} disabled={loading} className="btn-secondary self-start py-2.5 px-4 text-sm flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
          {['stats', 'locations', 'users', 'otps'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearchQuery('') }}
              className={`py-3.5 px-5 font-semibold text-sm transition-all border-b-2 capitalize whitespace-nowrap ${activeTab === tab ? 'border-[#42A5F5] text-[#42A5F5]' : 'border-transparent text-white/40 hover:text-white/70'}`}>
              {tab === 'otps' ? 'OTP Logs' : tab}
            </button>
          ))}
        </div>

        {loading && !stats ? (
          <div className="text-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#42A5F5] mx-auto mb-4" />
            <p className="text-white/35 text-sm">Loading admin dashboard metrics...</p>
          </div>
        ) : (
          <>
            {/* ── STATS TAB ── */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-8">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="card" style={{ borderColor: 'rgba(21,101,192,0.15)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/35 text-xs uppercase tracking-wider font-semibold">Total LoCodes</span>
                      <div className="w-9 h-9 rounded-lg bg-[#FF8F00]/10 flex items-center justify-center text-[#FF8F00]">
                        <MapPin size={16} />
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-3xl text-white">{stats.totalLocations}</h3>
                    <p className="text-white/20 text-xs mt-1.5">Registered physical coordinates</p>
                  </div>

                  <div className="card" style={{ borderColor: 'rgba(21,101,192,0.15)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/35 text-xs uppercase tracking-wider font-semibold">Registered Users</span>
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Users size={16} />
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-3xl text-white">{stats.totalUsers}</h3>
                    <p className="text-white/20 text-xs mt-1.5">Active user base</p>
                  </div>

                  <div className="card" style={{ borderColor: 'rgba(21,101,192,0.15)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/35 text-xs uppercase tracking-wider font-semibold">System Admins</span>
                      <div className="w-9 h-9 rounded-lg bg-[#1565C0]/15 flex items-center justify-center text-[#42A5F5]">
                        <Shield size={16} />
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-3xl text-white">{stats.totalAdmins}</h3>
                    <p className="text-white/20 text-xs mt-1.5">Administrative operators</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Location Type Distribution */}
                  <div className="card">
                    <h3 className="font-display font-bold text-base text-white mb-6">Location Type Breakdown</h3>
                    <div className="space-y-4">
                      {Object.entries(LOCATION_TYPES).map(([typeId, typeInfo]) => {
                        const dbMatch = stats.typeDistribution.find(x => x.type === typeId)
                        const count = dbMatch ? dbMatch.count : 0
                        const total = stats.totalLocations || 1
                        const pct = Math.round((count / total) * 100)
                        const Icon = typeInfo.icon
                        
                        return (
                          <div key={typeId} className="space-y-1.5">
                            <div className="flex justify-between items-center text-sm">
                              <span className="flex items-center gap-2 text-white/60">
                                <Icon size={14} style={{ color: typeInfo.color }} /> {typeInfo.label}
                              </span>
                              <span className="font-semibold text-white">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: typeInfo.color }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Recent Signups */}
                  <div className="card">
                    <h3 className="font-display font-bold text-base text-white mb-5">Recent Signups</h3>
                    <div className="divide-y divide-white/5">
                      {stats.recentUsers.map(u => (
                        <div key={u.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-white/5">
                              {u.name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{u.name}</p>
                              <p className="text-white/35 text-xs truncate max-w-[180px]">{u.email || u.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-[#1565C0]/20 text-[#42A5F5] border border-[#1565C0]/30' : 'bg-white/5 text-white/50'}`}>
                              {u.role}
                            </span>
                            <p className="text-white/20 text-[10px] mt-1 flex items-center gap-1 justify-end">
                              <Calendar size={8} /> {new Date(u.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── LOCATIONS TAB ── */}
            {activeTab === 'locations' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input className="input-field pl-10 text-sm" placeholder="Search locations by LoCode, city, street, or user..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>

                {/* Table */}
                <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/[0.02]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/[0.03] text-white/45 text-xs uppercase tracking-wider">
                          <th className="p-4 font-semibold">LoCode</th>
                          <th className="p-4 font-semibold">Owner</th>
                          <th className="p-4 font-semibold">Type</th>
                          <th className="p-4 font-semibold">Address</th>
                          <th className="p-4 font-semibold">Created At</th>
                          <th className="p-4 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredLocations.map(loc => {
                          const t = LOCATION_TYPES[loc.type] || LOCATION_TYPES.home
                          const Icon = t.icon
                          return (
                            <tr key={loc.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="p-4 font-semibold">
                                <span className="locode-badge text-sm">{loc.locode}</span>
                              </td>
                              <td className="p-4">
                                <div className="font-medium text-white">{loc.userName || 'Unknown'}</div>
                                <div className="text-white/35 text-xs mt-0.5">{loc.userEmail || loc.userPhone || '—'}</div>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                  style={{ color: t.color, background: t.bg }}>
                                  <Icon size={12} /> {t.label}
                                </span>
                              </td>
                              <td className="p-4 text-white/55 max-w-xs truncate">
                                {loc.addressLine1}, {loc.city} ({loc.pincode})
                              </td>
                              <td className="p-4 text-white/35 text-xs">
                                {new Date(loc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="p-4 text-center">
                                <button onClick={() => navigate(`/locode/${loc.id}`)}
                                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/35 hover:text-white/70 transition-colors inline-block">
                                  <Eye size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredLocations.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center p-8 text-white/25">No system LoCodes match the query</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS TAB ── */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input className="input-field pl-10 text-sm" placeholder="Search users by name, email, or mobile..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>

                {/* Table */}
                <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/[0.02]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/[0.03] text-white/45 text-xs uppercase tracking-wider">
                          <th className="p-4 font-semibold">User Details</th>
                          <th className="p-4 font-semibold">Mobile Number</th>
                          <th className="p-4 font-semibold">Email Address</th>
                          <th className="p-4 font-semibold">Role</th>
                          <th className="p-4 font-semibold text-center">LoCodes</th>
                          <th className="p-4 font-semibold">Joined Date</th>
                          <th className="p-4 font-semibold text-center">Admin Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 font-semibold flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-white/5">
                                {u.name[0]}
                              </div>
                              <span className="text-white font-semibold">{u.name}</span>
                            </td>
                            <td className="p-4 text-white/55 font-mono text-xs">{u.phone || '—'}</td>
                            <td className="p-4 text-white/55 text-xs">{u.email || '—'}</td>
                            <td className="p-4">
                              <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-[#1565C0]/20 text-[#42A5F5] border border-[#1565C0]/30' : 'bg-white/5 text-white/50'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 text-center font-semibold text-white/70">{u.locationsCount}</td>
                            <td className="p-4 text-white/35 text-xs">
                              {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="p-4 text-center">
                              {u.id !== user.id ? (
                                <button onClick={() => handleRoleChange(u.id, u.role)} disabled={updatingUserId === u.id}
                                  className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1 text-white/60 hover:text-[#42A5F5] hover:border-[#1565C0]/40 disabled:opacity-50">
                                  <UserCheck size={11} /> Switch to {u.role === 'admin' ? 'User' : 'Admin'}
                                </button>
                              ) : (
                                <span className="text-white/20 text-xs italic">Current Admin</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center p-8 text-white/25">No system users match the query</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── OTP LOGS TAB ── */}
            {activeTab === 'otps' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-white/35 text-sm">Showing the last 30 OTP requests issued by the backend.</p>
                </div>

                {/* Table */}
                <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/[0.02]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/[0.03] text-white/45 text-xs uppercase tracking-wider">
                          <th className="p-4 font-semibold">Identity (Phone/Email)</th>
                          <th className="p-4 font-semibold">OTP Code</th>
                          <th className="p-4 font-semibold">Expiry Date</th>
                          <th className="p-4 font-semibold">Requested At</th>
                          <th className="p-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {otpLogs.map(log => {
                          const isExpired = new Date(log.expires_at) < new Date()
                          return (
                            <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="p-4 font-semibold text-white/70">{log.identity}</td>
                              <td className="p-4 font-mono font-bold tracking-widest text-[#FFC107] text-sm">{log.code}</td>
                              <td className="p-4 text-white/35 text-xs">{new Date(log.expires_at).toLocaleTimeString()}</td>
                              <td className="p-4 text-white/35 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/15' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'}`}>
                                  {isExpired ? 'Expired' : 'Active'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {otpLogs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center p-8 text-white/25">No OTP requests found in SQL registry</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
