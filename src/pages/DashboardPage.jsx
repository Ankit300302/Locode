import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BrandName } from './AuthPage'
import { 
  MapPin, Plus, Home, Building2, Briefcase, ChevronRight, 
  LogOut, Search, Copy, CheckCircle, Navigation, X, Shield, Sparkles, Zap
} from 'lucide-react'

const LOCATION_TYPES = [
  { id:'home', label:'Home', icon:Home, color:'#10B981', bg:'rgba(16,185,129,0.1)' },
  { id:'apartment', label:'Apartment', icon:Building2, color:'#3B82F6', bg:'rgba(59,130,246,0.1)' },
  { id:'office', label:'Office', icon:Briefcase, color:'#F59E0B', bg:'rgba(245,158,11,0.1)' },
  { id:'shop', label:'Shop/Business', icon:MapPin, color:'#EF4444', bg:'rgba(239,68,68,0.1)' },
]

const STATES = ['Andhra Pradesh','Delhi','Goa','Gujarat','Haryana','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal']

export default function DashboardPage() {
  const { user, locations, fetchLocations, addLocation, logout } = useAuth()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [gpsLoading, setGpsLoading] = useState(false)
  
  const [form, setForm] = useState({ 
    type:'home', label:'', addressLine1:'', addressLine2:'', area:'', 
    city:'', state:'Maharashtra', pincode:'', landmark:'', 
    latitude: null, longitude: null 
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Decode Any LoCode panel states
  const [decodeInput, setDecodeInput] = useState('')
  const [decoding, setDecoding] = useState(false)
  const [decodedData, setDecodedData] = useState(null)
  const [decodeError, setDecodeError] = useState('')

  useEffect(() => {
    fetchLocations()
  }, [])

  // Real GPS Geolocation & Nominatim Reverse Geocoding
  const handleGPS = () => {
    setGpsLoading(true)
    setFormError('')
    
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser')
      setGpsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          // Query free OpenStreetMap Nominatim reverse geocoder
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`, {
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'LoCodeAddressSystem/1.0'
            }
          })
          if (!res.ok) throw new Error('Failed to fetch address details')
          const data = await res.json()
          const addr = data.address || {}

          // Map OSM Nominatim properties to our form
          const street = addr.road || addr.suburb || addr.neighbourhood || addr.industrial || ''
          const house = addr.house_number || addr.building || ''
          const addressLine1 = house ? `${house}, ${street}` : street
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || ''
          const area = addr.suburb || addr.neighbourhood || addr.city_district || ''
          const state = addr.state || ''
          const pincode = addr.postcode || ''
          const landmark = addr.amenity || addr.shop || addr.tourism || ''

          setForm(f => ({
            ...f,
            addressLine1: addressLine1 || f.addressLine1,
            area: area || f.area,
            city: city || f.city,
            state: STATES.includes(state) ? state : f.state,
            pincode: pincode ? pincode.replace(/\s/g,'').slice(0, 6) : f.pincode,
            landmark: landmark || f.landmark,
            latitude,
            longitude
          }))
        } catch (err) {
          console.error(err)
          setFormError('GPS coordinates resolved, but address decoding failed. Please complete manually.')
          // Set raw coordinates anyway
          setForm(f => ({ ...f, latitude, longitude }))
        } finally {
          setGpsLoading(false)
        }
      },
      (err) => {
        console.error(err)
        setFormError('GPS access denied or timed out. Please enter details manually.')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async () => {
    setFormError('')
    if (!form.addressLine1.trim()) { setFormError('Street address is required'); return }
    if (!form.city.trim()) { setFormError('City is required'); return }
    if (!form.pincode || form.pincode.length !== 6) { setFormError('Enter a valid 6-digit PIN code'); return }
    setSubmitting(true)
    
    try {
      const savedLoc = await addLocation(form)
      setSubmitting(false)
      setShowForm(false)
      resetForm()
      navigate(`/locode/${savedLoc.id}`)
    } catch (err) {
      setFormError(err.message || 'Failed to register location')
      setSubmitting(false)
    }
  }

  const resetForm = () => setForm({ 
    type:'home', label:'', addressLine1:'', addressLine2:'', area:'', 
    city:'', state:'Maharashtra', pincode:'', landmark:'', 
    latitude: null, longitude: null 
  })

  const handleCopy = (locode) => {
    navigator.clipboard.writeText(locode).catch(() => {})
    setCopied(locode); setTimeout(() => setCopied(null), 2000)
  }

  const handleDecodePanelSubmit = async (e) => {
    e?.preventDefault()
    setDecodeError('')
    setDecodedData(null)
    
    if (!decodeInput.trim()) {
      setDecodeError('Please enter a code')
      return
    }

    setDecoding(true)
    try {
      const data = await api.decodeLoCode(decodeInput.trim())
      setDecodedData(data)
    } catch (err) {
      setDecodeError(err.message || 'LoCode not found or invalid format')
    } finally {
      setDecoding(false)
    }
  }

  const filtered = locations.filter(l =>
    l.locode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.addressLine1?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-lc-dark">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b px-5 py-4"
        style={{ background:'rgba(13,10,26,0.85)', backdropFilter:'blur(20px)', borderColor:'rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <BrandName size={34} />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background:'linear-gradient(135deg,#FF8F00,#E91E8C)' }}>
                {user?.avatar}
              </div>
              <span className="text-white/60 text-sm hidden sm:block">{user?.name}</span>
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-white">My Locations</h1>
            <p className="text-white/35 text-sm mt-0.5">{locations.length} location{locations.length !== 1 ? 's' : ''} registered</p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="btn-secondary py-2.5 px-4 text-sm flex items-center gap-2 hover:border-[#1565C0]/40">
                <Shield size={14} className="text-[#42A5F5]" /> Admin Panel
              </Link>
            )}
            <Link to="/checkout-demo" className="btn-secondary py-2.5 px-4 text-sm flex items-center gap-2 hover:border-orange-500/30">
              <Sparkles size={14} className="text-[#FF8F00]" /> API Decoder Demo
            </Link>
            <button onClick={() => setShowForm(true)} className="btn-primary py-2.5 px-4 text-sm">
              <Plus size={15} /> Add Location
            </button>
          </div>
        </div>

        {/* ── DECODE ANYONE'S LOCODE PANEL ── */}
        <div className="card mb-6" style={{ borderColor:'rgba(255,143,0,0.18)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={15} className="text-[#FF8F00]" />
            <h3 className="font-semibold text-white text-sm">Decode Any LoCode</h3>
          </div>
          <p className="text-white/35 text-xs mb-4">
            Do you have someone else's code? Enter it below to fetch and display their verified coordinates and physical address.
          </p>

          <form onSubmit={handleDecodePanelSubmit} className="flex gap-2">
            <input className="input-field text-sm font-semibold tracking-wider font-mono py-2 flex-1"
              placeholder="e.g. LC-MUBKC-7821XP" value={decodeInput}
              onChange={e => setDecodeInput(e.target.value.toUpperCase())} disabled={decoding} />
            <button type="submit" disabled={decoding} className="btn-primary py-2.5 px-5 text-sm font-medium whitespace-nowrap">
              {decoding ? 'Resolving...' : 'Decode Code'}
            </button>
          </form>

          {decodeError && <p className="text-red-400 text-xs mt-2">{decodeError}</p>}

          {decodedData && (
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 mt-4 space-y-3 relative animate-fadeIn">
              <button onClick={() => setDecodedData(null)} className="absolute right-3 top-3 text-white/35 hover:text-white/60 p-1">
                <X size={14} />
              </button>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">Address Resolved</span>
                  <h4 className="font-semibold text-white text-base mt-0.5">{decodedData.label || 'Digital Address Node'}</h4>
                </div>
                <span className="locode-badge text-xs px-2.5 py-1">{decodedData.locode}</span>
              </div>

              <div className="text-xs text-white/60 space-y-1.5 pb-2 border-b border-white/5">
                <p><strong className="text-white/45">Street:</strong> {decodedData.addressLine1}</p>
                {decodedData.addressLine2 && <p><strong className="text-white/45">Building:</strong> {decodedData.addressLine2}</p>}
                {decodedData.area && <p><strong className="text-white/45">Area:</strong> {decodedData.area}</p>}
                <p><strong className="text-white/45">Locality:</strong> {decodedData.city}, {decodedData.state} - {decodedData.pincode}</p>
                {decodedData.landmark && <p><strong className="text-white/45">Landmark:</strong> {decodedData.landmark}</p>}
                <p><strong className="text-white/45">Registrant:</strong> {decodedData.userName || 'Verified User'}</p>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/30 font-mono">
                  Coordinates: {decodedData.latitude && decodedData.longitude ? `${decodedData.latitude.toFixed(6)}, ${decodedData.longitude.toFixed(6)}` : 'Not recorded'}
                </span>
                {decodedData.latitude && decodedData.longitude && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${decodedData.latitude},${decodedData.longitude}`}
                    target="_blank" rel="noreferrer" className="text-xs text-[#FF8F00] hover:underline flex items-center gap-1 font-semibold">
                    <MapPin size={11} /> View on Google Maps
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        {locations.length > 0 && (
          <div className="relative mb-5">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input className="input-field pl-10 text-sm" placeholder="Search my registered locations..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        )}

        {/* Empty state */}
        {locations.length === 0 && !showForm && (
          <div className="card text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background:'rgba(255,143,0,0.08)', border:'1px solid rgba(255,143,0,0.2)' }}>
              <MapPin size={26} style={{ color:'#FF8F00' }} />
            </div>
            <h3 className="font-display font-semibold text-white mb-2">No locations yet</h3>
            <p className="text-white/35 text-sm mb-6">Add your first location to get your unique LoCode</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
              <Plus size={16} /> Add Your First Location
            </button>
          </div>
        )}

        {/* Location Cards */}
        <div className="space-y-3 mb-6">
          {filtered.map(loc => {
            const t = LOCATION_TYPES.find(x => x.id === loc.type) || LOCATION_TYPES[0]
            const Icon = t.icon
            return (
              <div key={loc.id} onClick={() => navigate(`/locode/${loc.id}`)}
                className="card hover:border-white/18 transition-all duration-200 cursor-pointer group"
                style={{ borderColor:'rgba(255,255,255,0.07)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background:t.bg }}>
                    <Icon size={17} style={{ color:t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-white text-sm">{loc.label || t.label}</p>
                      <span className="text-white/20 text-xs">·</span>
                      <span className="text-white/25 text-xs">
                        {new Date(loc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-white/40 text-sm truncate">
                      {loc.addressLine1}{loc.area ? `, ${loc.area}` : ''}, {loc.city} — {loc.pincode}
                    </p>
                    <p className="locode-badge text-base mt-2">{loc.locode}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); handleCopy(loc.locode) }}
                      className="p-2 rounded-lg hover:bg-white/8 text-white/25 hover:text-white/60 transition-colors">
                      {copied === loc.locode ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <ChevronRight size={15} className="text-white/15 group-hover:text-white/40 transition-colors" />
                  </div>
                </div>
              </div>
            )
          })}
          {searchQuery && filtered.length === 0 && (
            <p className="text-center text-white/25 text-sm py-8">No locations match your search</p>
          )}
        </div>
      </div>

      {/* Add Location Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border"
            style={{ background:'#111020', borderColor:'rgba(255,255,255,0.1)' }}>

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b sticky top-0 rounded-t-2xl"
              style={{ background:'#111020', borderColor:'rgba(255,255,255,0.06)' }}>
              <h2 className="font-display font-bold text-lg text-white">Add New Location</h2>
              <button onClick={() => { setShowForm(false); resetForm(); setFormError('') }}
                className="p-2 rounded-lg hover:bg-white/5 text-white/35 hover:text-white/60 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Type selector */}
              <div>
                <label className="text-white/45 text-xs uppercase tracking-wider mb-2.5 block">Location Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {LOCATION_TYPES.map(t => {
                    const Icon = t.icon
                    const active = form.type === t.id
                    return (
                      <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
                        className="flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                        style={active
                          ? { borderColor:'rgba(255,143,0,0.5)', background:'rgba(255,143,0,0.1)', color:'white' }
                          : { borderColor:'rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.45)' }}>
                        <Icon size={15} style={{ color: active ? t.color : 'inherit' }} />
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Label */}
              <input className="input-field" placeholder="Location label (e.g. Mom's House, Main Office)"
                value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />

              {/* GPS Fetch Button */}
              <button onClick={handleGPS} disabled={gpsLoading} className="btn-secondary w-full text-sm py-2.5"
                style={{ borderStyle:'dashed' }}>
                {gpsLoading ? <><Spinner /> Geocoding address coordinates...</> : <><Navigation size={14} /> Fetch GPS Coordinates & Autofill</>}
              </button>

              {/* Map placeholder */}
              <div className="map-container">
                <div className="absolute inset-0"
                  style={{ background:'linear-gradient(135deg,#0d0d1a,#111020)', opacity:1 }} />
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(255,143,0,0.4) 31px,rgba(255,143,0,0.4) 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,rgba(255,143,0,0.4) 31px,rgba(255,143,0,0.4) 32px)' }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <MapPin size={26} style={{ color:'#FF8F00' }} />
                  {form.latitude && form.longitude ? (
                    <>
                      <p className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                        <CheckCircle size={14} /> GPS Active
                      </p>
                      <p className="text-white/20 text-xs">{form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white/35 text-sm">Interactive GPS Node</p>
                      <p className="text-white/20 text-xs">Awaiting Geolocation Fetch</p>
                    </>
                  )}
                </div>
              </div>

              {/* Address fields */}
              <div className="space-y-3">
                <label className="text-white/45 text-xs uppercase tracking-wider block">Verify & Edit Address</label>
                <input className="input-field" placeholder="Street address, House / Flat No. *"
                  value={form.addressLine1} onChange={e => setForm(f => ({ ...f, addressLine1: e.target.value }))} />
                <input className="input-field" placeholder="Apartment, Floor, Building name"
                  value={form.addressLine2} onChange={e => setForm(f => ({ ...f, addressLine2: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="input-field" placeholder="Area / Locality"
                    value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
                  <input className="input-field" placeholder="PIN Code *" inputMode="numeric" maxLength={6}
                    value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g,'') }))} />
                </div>
                <select className="input-field" style={{ background:'#111020' }}
                  value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value, city:'' }))}>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="input-field" placeholder="City *"
                  value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                <input className="input-field" placeholder="Nearby landmark (optional)"
                  value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} />
              </div>

              {formError && <p className="text-red-400 text-sm">{formError}</p>}

              <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">
                {submitting ? <><Spinner /> Verifying details...</> : <>Confirm & Generate LoCode <ChevronRight size={15} /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}
