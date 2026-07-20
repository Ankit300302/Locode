import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../utils/api'
import { BrandName } from './AuthPage'
import { 
  ArrowLeft, ShieldCheck, MapPin, CheckCircle, 
  AlertCircle, Sparkles, Terminal, Globe, RefreshCw, Copy, Check 
} from 'lucide-react'

export default function CheckoutDemoPage() {
  const [searchParams] = useSearchParams()
  const [locode, setLocode] = useState(searchParams.get('code') || '')
  
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    addressLine1: '', addressLine2: '', area: '',
    city: '', state: '', pincode: '', landmark: '',
    latitude: null, longitude: null
  })
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0) // 0: idle, 1: syntax, 2: DB query, 3: parsing, 4: complete
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [copiedPayload, setCopiedPayload] = useState(false)

  const handleDecode = async (e) => {
    e?.preventDefault()
    setError('')
    setSuccess(false)

    if (!locode.trim()) {
      setError('Please enter a LoCode to decode')
      return
    }

    setLoading(true)
    
    // Step 1: Syntax check
    setStep(1)
    await new Promise(r => setTimeout(r, 450))
    
    // Step 2: Database lookup
    setStep(2)
    await new Promise(r => setTimeout(r, 450))

    try {
      const response = await api.decodeLoCode(locode.trim())
      
      // Step 3: Parsing details
      setStep(3)
      await new Promise(r => setTimeout(r, 450))

      // Step 4: Autofill
      setForm({
        name: response.userName || 'Rudraksh',
        phone: response.userPhone || '9876543210',
        email: response.userEmail || 'rudraksh@locode.in',
        addressLine1: response.addressLine1 || '',
        addressLine2: response.addressLine2 || '',
        area: response.area || '',
        city: response.city || '',
        state: response.state || '',
        pincode: response.pincode || '',
        landmark: response.landmark || '',
        latitude: response.latitude || null,
        longitude: response.longitude || null
      })

      setSuccess(true)
      setStep(4)
    } catch (err) {
      setError(err.message || 'LoCode not found in database')
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(form, null, 2))
    setCopiedPayload(true)
    setTimeout(() => setCopiedPayload(false), 2000)
  }

  const handleReset = () => {
    setLocode('')
    setForm({
      name: '', phone: '', email: '',
      addressLine1: '', addressLine2: '', area: '',
      city: '', state: '', pincode: '', landmark: '',
      latitude: null, longitude: null
    })
    setSuccess(false)
    setStep(0)
  }

  return (
    <div className="min-h-screen bg-lc-dark text-white">
      <div className="blob-orange -top-20 -left-20 opacity-30" style={{position:'fixed'}} />
      <div className="blob-blue bottom-20 -right-20 opacity-20" style={{position:'fixed'}} />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b px-5 py-4"
        style={{ background: 'rgba(13,10,26,0.9)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm">
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
          <BrandName size={30} />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-white flex items-center gap-2">
            <Globe className="text-[#FF8F00]" size={28} /> API Resolver Tool
          </h1>
          <p className="text-white/35 text-sm mt-1">
            Simulate a third-party merchant or logistics portal resolving coordinates using a LoCode.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* LoCode Autofiller */}
            <div className="card" style={{ borderColor: success ? 'rgba(16,185,129,0.3)' : 'rgba(255,143,0,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[#FF8F00]" />
                <h3 className="font-semibold text-white text-sm">Autofill with LoCode API</h3>
              </div>
              <p className="text-white/40 text-xs mb-4">
                Enter any LoCode to resolve full physical coordinates and address details.
              </p>

              <form onSubmit={handleDecode} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input className="input-field pl-10 text-sm font-semibold tracking-wider font-mono"
                    placeholder="e.g. LC-MUBKC-7821XP" value={locode}
                    onChange={e => setLocode(e.target.value.toUpperCase())}
                    disabled={loading} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="btn-primary py-3 px-6 text-sm font-medium whitespace-nowrap">
                    {loading ? 'Decoding...' : 'Decode'}
                  </button>
                  <button type="button" onClick={handleReset} className="btn-secondary p-3 text-white/40 hover:text-white">
                    <RefreshCw size={15} />
                  </button>
                </div>
              </form>

              {/* Decoding Steps Animation */}
              {loading && (
                <div className="mt-5 space-y-2.5 bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-white/35">
                    <span>Decryption Engine Status</span>
                    <span className="animate-pulse text-[#FF8F00]">Processing...</span>
                  </div>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${step >= 1 ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <span className={step === 1 ? 'text-white font-semibold' : 'text-white/40'}>Checking LoCode format constraints...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${step >= 2 ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <span className={step === 2 ? 'text-white font-semibold' : 'text-white/40'}>Querying secure database...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${step >= 3 ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <span className={step === 3 ? 'text-white font-semibold' : 'text-white/40'}>Extracting geocoding parameters...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Success / Error Messages */}
              {success && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle size={14} /> LoCode successfully resolved. Form fields populated!
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
            </div>

            {/* Resolved Address Data Sheet */}
            <div className="card space-y-5">
              <div>
                <h3 className="font-display font-semibold text-lg text-white mb-1">Decoded Address Sheet</h3>
                <p className="text-white/35 text-xs">The resolved location values are populated below.</p>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium">Registrant Name</label>
                  <input className="input-field text-sm" value={form.name} readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium">Mobile Number</label>
                  <input className="input-field text-sm" value={form.phone} readOnly />
                </div>
              </div>

              {/* Address details */}
              <div className="space-y-4 pt-2 border-t border-white/5">
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium">Street Address, House/Room No</label>
                  <input className={`input-field text-sm ${success ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`} value={form.addressLine1} readOnly />
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium">Apartment, Building, Floor</label>
                  <input className={`input-field text-sm ${success ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`} value={form.addressLine2} readOnly />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-white/40 text-xs font-medium">Area / Locality</label>
                    <input className={`input-field text-sm ${success ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`} value={form.area} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-white/40 text-xs font-medium">PIN Code</label>
                    <input className={`input-field text-sm ${success ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`} value={form.pincode} readOnly />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-white/40 text-xs font-medium">City</label>
                    <input className={`input-field text-sm ${success ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`} value={form.city} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-white/40 text-xs font-medium">State</label>
                    <input className={`input-field text-sm ${success ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`} value={form.state} readOnly />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-white/40 text-xs font-medium">Latitude Coordinates</label>
                    <input className="input-field text-sm font-mono text-white/50" value={form.latitude || ''} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-white/40 text-xs font-medium">Longitude Coordinates</label>
                    <input className="input-field text-sm font-mono text-white/50" value={form.longitude || ''} readOnly />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API payload logger (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-[#FF8F00]" />
                  <h3 className="font-semibold text-white text-sm">JSON Response Payload</h3>
                </div>
                {success && (
                  <button onClick={handleCopyPayload} className="text-xs text-white/45 hover:text-white flex items-center gap-1">
                    {copiedPayload ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />} Copy
                  </button>
                )}
              </div>

              <div className="bg-[#0b0818] rounded-xl p-4 font-mono text-xs overflow-x-auto text-[#FFC107] border border-white/5 min-h-[220px]">
                {success ? (
                  <pre>{JSON.stringify({
                    status: "success",
                    data: {
                      locode: locode,
                      registrant: form.name,
                      coordinates: {
                        latitude: form.latitude,
                        longitude: form.longitude
                      },
                      address: {
                        street: form.addressLine1,
                        apartment: form.addressLine2,
                        area: form.area,
                        city: form.city,
                        state: form.state,
                        pincode: form.pincode,
                        landmark: form.landmark
                      }
                    }
                  }, null, 2)}</pre>
                ) : (
                  <p className="text-white/20 italic">// Decoded API payload will be logged here once a code is resolved.</p>
                )}
              </div>

              <div className="mt-4 p-3.5 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex gap-2.5 text-[10px] text-white/35 leading-snug">
                  <ShieldCheck size={16} className="text-[#FF8F00] flex-shrink-0 mt-0.5" />
                  <span>This portal queries the public decode endpoint `/api/locations/decode/:locode` which is fully open to delivery integrations.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
