import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogoMark } from '../components/Logo'
import { BrandName } from './AuthPage'
import { api } from '../utils/api'
import { ArrowRight, ChevronLeft, Shield, CheckCircle, Mail, Phone, Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [method, setMethod] = useState('email') // 'email' or 'phone'
  const [identity, setIdentity] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(30)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') // 'login' or 'otp'
  const [demoOtp, setDemoOtp] = useState(null)
  const otpRefs = useRef([])

  useEffect(() => {
    let interval
    if (mode === 'otp' && timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(interval)
  }, [mode, timer])

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    setError('')
    setDemoOtp(null)

    if (!identity.trim()) {
      setError(method === 'email' ? 'Please enter an admin email' : 'Please enter an admin mobile number')
      return
    }

    if (method === 'phone' && identity.length < 10) {
      setError('Enter a valid 10-digit mobile number')
      return
    }

    if (method === 'email' && !identity.includes('@')) {
      setError('Enter a valid email address')
      return
    }

    setLoading(true)
    try {
      // Role is hardcoded as 'admin'
      const response = await api.sendOtp(identity, 'Admin', 'admin')
      setDemoOtp(response.demoOtp)
      setTimer(30)
      setMode('otp')
    } catch (err) {
      setError(err.message || 'Verification failed. Are you sure you are an admin?')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const newOtp = [...otp]; newOtp[i] = val.slice(-1); setOtp(newOtp)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) { setOtp(paste.split('')); otpRefs.current[5]?.focus() }
  }

  const handleVerify = async () => {
    setError('')
    const code = otp.join('')
    if (code.length < 6) { setError('Enter the 6-digit OTP'); return }
    
    setLoading(true)
    try {
      const response = await api.verifyOtp(identity, code, 'LoCode Admin', 'admin')
      login(response.user)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Incorrect OTP code')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setOtp(['', '', '', '', '', ''])
    try {
      const response = await api.sendOtp(identity, 'Admin', 'admin')
      setDemoOtp(response.demoOtp)
      setTimer(30)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-lc-dark bg-dots flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background blobs with blueish control room tint */}
      <div className="blob-blue -top-32 -left-32 opacity-40" />
      <div className="blob-orange bottom-0 -right-20 opacity-30" />

      <div className="relative z-10 w-full max-w-md">

        <Link to="/" className="flex items-center gap-1.5 text-white/35 hover:text-white/60 text-sm mb-5 transition-colors">
          <ChevronLeft size={15} /> Back to User Portal
        </Link>

        <div className="card" style={{ borderColor: 'rgba(21,101,192,0.25)', boxShadow: '0 8px 32px rgba(21,101,192,0.08)' }}>
          <div className="flex items-center justify-between mb-8">
            <BrandName size={32} />
            <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#42A5F5] bg-[#1565C0]/15 px-2.5 py-1 rounded-md border border-[#1565C0]/25">
              <Shield size={12} /> Admin Portal
            </div>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleSendOtp}>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[#1565C0]/10 border border-[#1565C0]/20">
                  <Lock size={24} className="text-[#42A5F5]" />
                </div>
                <h2 className="font-display font-bold text-2xl text-white mb-1">Administrative Sign In</h2>
                <p className="text-white/35 text-sm">Please verify your admin identity to proceed</p>
              </div>

              {/* Login Method Toggle */}
              <div className="flex rounded-xl p-1 mb-5 bg-white/5 border border-white/5">
                <button type="button" onClick={() => { setMethod('email'); setIdentity(''); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${method === 'email' ? 'bg-[#1565C0] text-white' : 'text-white/40 hover:text-white/70'}`}>
                  <Mail size={14} /> Email
                </button>
                <button type="button" onClick={() => { setMethod('phone'); setIdentity(''); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${method === 'phone' ? 'bg-[#1565C0] text-white' : 'text-white/40 hover:text-white/70'}`}>
                  <Phone size={14} /> Mobile
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {method === 'email' ? (
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                    <input className="input-field pl-10" placeholder="admin@locode.in" type="email"
                      value={identity} onChange={e => setIdentity(e.target.value)} />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                      <span className="text-white/35 text-sm">🇮🇳 +91</span>
                      <div className="w-px h-4 bg-white/10" />
                    </div>
                    <input className="input-field pl-[68px]" placeholder="9999999999"
                      inputMode="numeric" maxLength={10} value={identity}
                      onChange={e => setIdentity(e.target.value.replace(/\D/g,''))} />
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <button type="submit" disabled={loading} className="btn-blue w-full">
                {loading ? <Spinner /> : <>Request Secure OTP <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <div>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/20">
                  <Shield size={24} className="text-emerald-400" />
                </div>
                <h2 className="font-display font-bold text-2xl text-white mb-2">Secure OTP Sent</h2>
                <p className="text-white/40 text-sm mb-2">We sent a 6-digit OTP code to <span className="text-white/70">{identity}</span></p>
                <p className="text-white/25 text-xs">Please verify your email inbox or server debugger console logs for the passcode.</p>
              </div>


              <div className="flex gap-2.5 justify-center mb-6" onPaste={handleOtpPaste}>
                {otp.map((d, i) => (
                  <input key={i} ref={el => otpRefs.current[i] = el} className="otp-input"
                    maxLength={1} value={d} onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)} inputMode="numeric" autoFocus={i === 0} />
                ))}
              </div>

              {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

              <button onClick={handleVerify} disabled={loading} className="btn-blue w-full mb-5">
                {loading ? <Spinner /> : <>Verify & Authorize <ArrowRight size={16} /></>}
              </button>

              <div className="text-center">
                {timer > 0
                  ? <p className="text-white/25 text-sm">Resend in <span className="text-white/50">{timer}s</span></p>
                  : <button onClick={handleResend} className="text-sm font-semibold text-[#42A5F5] hover:underline">Resend OTP Code</button>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}
