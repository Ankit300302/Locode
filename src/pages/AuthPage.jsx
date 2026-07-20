import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogoMark } from '../components/Logo'
import { api } from '../utils/api'
import { ArrowRight, ChevronLeft, Shield, CheckCircle, Phone, User, Mail, Sparkles, Navigation } from 'lucide-react'

export default function AuthPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('landing') // 'landing', 'login', 'signup', 'otp'
  const [method, setMethod] = useState('phone') // 'phone' or 'email'
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(30)
  const [loading, setLoading] = useState(false)
  const [demoOtp, setDemoOtp] = useState(null)
  const otpRefs = useRef([])

  useEffect(() => {
    let interval
    if (mode === 'otp' && timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(interval)
  }, [mode, timer])

  const getIdentity = () => {
    return method === 'phone' ? form.phone : form.email
  }

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    setError('')
    setDemoOtp(null)
    const identity = getIdentity()

    if (method === 'phone' && (!form.phone || form.phone.length < 10)) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    if (method === 'email' && (!form.email || !form.email.includes('@'))) {
      setError('Enter a valid email address')
      return
    }
    if (mode === 'signup' && !form.name.trim()) {
      setError('Please enter your full name')
      return
    }

    setLoading(true)
    try {
      const response = await api.sendOtp(identity, form.name, 'user')
      setDemoOtp(response.demoOtp)
      setTimer(30)
      setMode('otp')
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
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
    const identity = getIdentity()

    setLoading(true)
    try {
      const response = await api.verifyOtp(identity, code, form.name, 'user')
      login(response.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Incorrect OTP code')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setTimer(30)
    setOtp(['','','','','',''])
    setError('')
    const identity = getIdentity()
    try {
      const response = await api.sendOtp(identity, form.name, 'user')
      setDemoOtp(response.demoOtp)
    } catch (err) {
      setError(err.message)
    }
  }

  // ── LANDING ──
  if (mode === 'landing') return (
    <div className="min-h-screen bg-lc-dark overflow-hidden">
      {/* Ambient blobs */}
      <div className="blob-orange -top-20 -left-20 opacity-60" style={{position:'fixed'}} />
      <div className="blob-pink top-1/2 -right-20 opacity-40" style={{position:'fixed'}} />
      <div className="blob-blue bottom-20 left-1/4 opacity-50" style={{position:'fixed'}} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <BrandName size={38} />
        <div className="flex items-center gap-4">
          <Link to="/checkout-demo" className="text-white/45 hover:text-white/70 text-sm font-semibold transition-colors">
            Checkout Demo
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <button onClick={() => { setMode('login'); setMethod('phone'); setError('') }} className="btn-secondary text-sm py-2.5 px-5">Sign In</button>
          <button onClick={() => { setMode('signup'); setMethod('phone'); setError('') }} className="btn-primary text-sm py-2.5 px-5">Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center text-center px-6 pt-12 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 border text-sm font-medium px-4 py-2 rounded-full mb-8"
          style={{ borderColor:'rgba(255,143,0,0.3)', background:'rgba(255,143,0,0.08)', color:'#FFB300' }}>
          <Shield size={13} /> Digital Location Identity Platform
        </div>

        <h1 className="font-display font-bold text-5xl md:text-7xl text-white leading-tight mb-6">
          Your address,<br />
          <span className="gradient-text-brand">one smart code.</span>
        </h1>

        <p className="text-white/45 text-lg md:text-xl max-w-xl mb-12 leading-relaxed">
          LoCode gives every physical location a unique digital identity. Share it instantly. No long addresses. No confusion.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button onClick={() => { setMode('signup'); setMethod('phone'); setError('') }} className="btn-primary text-base px-8 py-4">
            Create Your LoCode <ArrowRight size={18} />
          </button>
          <button onClick={() => { setMode('login'); setMethod('phone'); setError('') }} className="btn-secondary text-base px-8 py-4">
            Sign In
          </button>
          <Link to="/checkout-demo" className="btn-secondary text-base px-8 py-4 hover:border-orange-500/30 flex items-center gap-2">
            <Sparkles size={16} className="text-[#FF8F00]" /> Use Case Demo
          </Link>
        </div>

        {/* Sample LoCode card */}
        <div className="card-glow max-w-sm w-full text-center mb-16">
          <p className="text-white/30 text-xs uppercase tracking-[0.3em] mb-3">Sample LoCode</p>
          <p className="locode-badge text-3xl mb-2">LC-MUBKC-7821XP</p>
          <p className="text-white/35 text-sm">42, Linking Rd, Bandra West, Mumbai 400050</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-10 w-full max-w-md">
          {[['10K+','Locations'], ['99.9%','Uptime'], ['50+','Partners']].map(([n,l]) => (
            <div key={l} className="text-center">
              <p className="font-display font-bold text-3xl gradient-text-brand">{n}</p>
              <p className="text-white/35 text-xs mt-1 uppercase tracking-wide">{l}</p>
            </div>
          ))}
        </div>

        {/* Link to Admin Portal */}
        <div className="mt-20">
          <Link to="/admin-portal" className="text-white/20 hover:text-white/40 text-xs flex items-center justify-center gap-1.5 transition-colors">
            <Shield size={11} /> Access Administrator Gateway
          </Link>
        </div>
      </main>
    </div>
  )

  // ── OTP ──
  if (mode === 'otp') return (
    <AuthShell onBack={() => { setMode(form.name ? 'signup' : 'login'); setOtp(['','','','','','']); setError(''); setDemoOtp(null) }}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background:'rgba(255,143,0,0.12)', border:'1px solid rgba(255,143,0,0.25)' }}>
          <Shield size={28} style={{ color:'#FF8F00' }} />
        </div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Verify identity</h2>
        <p className="text-white/40 text-sm mb-2">We sent a 6-digit OTP to <span className="text-white/70">{getIdentity()}</span></p>
        <p className="text-white/25 text-xs">Please check your email inbox (or server logs/Ethereal dashboard link) for the passcode.</p>
      </div>


      <div className="flex gap-2.5 justify-center mb-6" onPaste={handleOtpPaste}>
        {otp.map((d, i) => (
          <input key={i} ref={el => otpRefs.current[i] = el} className="otp-input"
            maxLength={1} value={d} onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)} inputMode="numeric" autoFocus={i === 0} />
        ))}
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

      <button onClick={handleVerify} disabled={loading} className="btn-primary w-full mb-4">
        {loading ? <Spinner /> : <>Verify & Continue <ArrowRight size={16} /></>}
      </button>

      <div className="text-center">
        {timer > 0
          ? <p className="text-white/25 text-sm">Resend in <span className="text-white/50">{timer}s</span></p>
          : <button onClick={handleResend} className="text-sm font-medium" style={{ color:'#FF8F00' }}>Resend OTP</button>
        }
      </div>
    </AuthShell>
  )

  // ── LOGIN / SIGNUP ──
  const isSignup = mode === 'signup'
  return (
    <AuthShell onBack={() => setMode('landing')}>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <LogoMark size={52} />
        </div>
        <h2 className="font-display font-bold text-2xl text-white mb-1">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-white/35 text-sm">
          {isSignup ? 'Get your unique digital location identity' : 'Sign in to access your dashboard'}
        </p>
      </div>

      {/* Method selector for Login / Signup */}
      <div className="flex rounded-xl p-1 mb-5 bg-white/5 border border-white/5">
        <button onClick={() => { setMethod('phone'); setError('') }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${method === 'phone' ? 'bg-[#FF8F00] text-white shadow-md shadow-orange-500/20' : 'text-white/40 hover:text-white/70'}`}>
          <Phone size={14} /> Phone
        </button>
        <button onClick={() => { setMethod('email'); setError('') }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${method === 'email' ? 'bg-[#FF8F00] text-white shadow-md shadow-orange-500/20' : 'text-white/40 hover:text-white/70'}`}>
          <Mail size={14} /> Email
        </button>
      </div>

      <div className="space-y-3 mb-5">
        {isSignup && (
          <div className="relative">
            <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input className="input-field pl-10" placeholder="Full Name"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
        )}

        {method === 'phone' ? (
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <span className="text-white/35 text-sm">🇮🇳 +91</span>
              <div className="w-px h-4 bg-white/10" />
            </div>
            <input className="input-field pl-[68px]" placeholder="10-digit mobile number"
              inputMode="numeric" maxLength={10} value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,''), email: '' }))} />
          </div>
        ) : (
          <div className="relative">
            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input className="input-field pl-10" placeholder="email@example.com" type="email"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value, phone: '' }))} />
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button onClick={handleSendOtp} disabled={loading} className="btn-primary w-full mb-5">
        {loading ? <Spinner /> : <>Send OTP <ArrowRight size={16} /></>}
      </button>

      <p className="text-center text-white/30 text-sm">
        {isSignup ? 'Already have an account? ' : "Don't have an account? "}
        <button onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); setForm({ name: '', phone: '', email: '' }) }}
          className="font-semibold" style={{ color:'#FF8F00' }}>
          {isSignup ? 'Log in' : 'Sign up'}
        </button>
      </p>
    </AuthShell>
  )
}

function AuthShell({ children, onBack }) {
  return (
    <div className="min-h-screen bg-lc-dark bg-dots flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="blob-orange -top-32 -left-32 opacity-40" />
      <div className="blob-pink bottom-0 -right-20 opacity-30" />
      <div className="relative z-10 w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/35 hover:text-white/60 text-sm mb-5 transition-colors">
          <ChevronLeft size={15} /> Back
        </button>
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <BrandName size={32} />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export function BrandName({ size = 36 }) {
  const fs = Math.round(size * 0.65)
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="font-display font-bold" style={{ fontSize: fs }}>
        <span style={{ color: '#1565C0' }}>Lo</span>
        <span style={{ background:'linear-gradient(90deg,#FF8F00,#FF5722)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Code</span>
      </span>
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
