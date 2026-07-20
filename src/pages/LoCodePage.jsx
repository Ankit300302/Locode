import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BrandName } from './AuthPage'
import { MapPin, Copy, CheckCircle, Share2, ArrowLeft, Home, Building2, Briefcase, Shield, Zap, Globe, ChevronRight } from 'lucide-react'

function QRCanvas({ value, size = 180 }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); const s = size
    ctx.clearRect(0, 0, s, s)
    ctx.fillStyle = '#0d0a1a'; ctx.fillRect(0, 0, s, s)
    const cell = Math.floor(s / 21); const offset = (s - cell * 21) / 2
    let hash = 0
    for (let c of value) hash = ((hash << 5) - hash) + c.charCodeAt(0)
    const pattern = []
    for (let i = 0; i < 21 * 21; i++) {
      hash = ((hash * 1103515245) + 12345) & 0x7fffffff; pattern.push(hash % 3 !== 0)
    }
    const setFinder = (r, c) => {
      for (let dr = 0; dr < 7; dr++) for (let dc = 0; dc < 7; dc++)
        pattern[r * 21 + c + dc + dr * 21] = dr===0||dr===6||dc===0||dc===6||(dr>=2&&dr<=4&&dc>=2&&dc<=4)
    }
    setFinder(0,0); setFinder(0,14); setFinder(14,0)
    for (let r = 0; r < 21; r++) for (let c = 0; c < 21; c++) {
      if (pattern[r * 21 + c]) {
        const grad = ctx.createLinearGradient(offset+c*cell, offset+r*cell, offset+c*cell+cell, offset+r*cell+cell)
        grad.addColorStop(0,'#FF8F00'); grad.addColorStop(0.5,'#E91E8C'); grad.addColorStop(1,'#9C27B0')
        ctx.fillStyle = grad
      } else ctx.fillStyle = '#0d0a1a'
      ctx.fillRect(offset+c*cell, offset+r*cell, cell-0.5, cell-0.5)
    }
    const ls = cell * 3
    ctx.fillStyle = '#0d0a1a'
    ctx.fillRect(s/2-ls/2-2, s/2-ls/2-2, ls+4, ls+4)
    const lg = ctx.createLinearGradient(s/2-ls/2, s/2-ls/2, s/2+ls/2, s/2+ls/2)
    lg.addColorStop(0,'#FF8F00'); lg.addColorStop(1,'#E91E8C')
    ctx.fillStyle = lg
    ctx.beginPath(); ctx.roundRect(s/2-ls/2, s/2-ls/2, ls, ls, 5); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = `bold ${cell*1.4}px 'Space Grotesk',sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LC', s/2, s/2)
  }, [value, size])
  return <canvas ref={canvasRef} width={size} height={size} className="rounded-xl" />
}

const PARTNERS = [
  { name:'Amazon', emoji:'📦' }, { name:'Flipkart', emoji:'🛒' },
  { name:'Zomato', emoji:'🍔' }, { name:'Swiggy', emoji:'🛵' },
  { name:'DTDC', emoji:'📬' }, { name:'BigBasket', emoji:'🥦' },
  { name:'Dunzo', emoji:'⚡' }, { name:'Meesho', emoji:'👗' },
]

const FEATURES = [
  { icon:Shield, label:'Secure', desc:'Verified & encrypted location data' },
  { icon:Zap, label:'Instant', desc:'Share your code in one tap anywhere' },
  { icon:Globe, label:'Universal', desc:'Works across all delivery platforms' },
]

export default function LoCodePage() {
  const { id } = useParams()
  const { locations, fetchLocations, user } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const loc = locations.find(l => String(l.id) === id)

  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => { if (loc) setTimeout(() => setRevealed(true), 80) }, [loc])

  if (!loc) return (
    <div className="min-h-screen bg-lc-dark flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/35 mb-4">Location not found</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">Back to Dashboard</button>
      </div>
    </div>
  )

  const handleCopy = () => {
    navigator.clipboard.writeText(loc.locode).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  const handleShare = async () => {
    const text = `My LoCode: ${loc.locode}\nLocation: ${loc.addressLine1}, ${loc.city} ${loc.pincode}`
    if (navigator.share) { try { await navigator.share({ title:'My LoCode', text }) } catch {} }
    else navigator.clipboard.writeText(text).catch(() => {})
    setShared(true); setTimeout(() => setShared(false), 2500)
  }

  const fullAddress = [loc.addressLine1, loc.addressLine2, loc.area, loc.city, loc.state, loc.pincode].filter(Boolean).join(', ')
  const typeMap = { home:{label:'Home',icon:Home}, apartment:{label:'Apartment',icon:Building2}, office:{label:'Office',icon:Briefcase}, shop:{label:'Shop',icon:MapPin} }
  const typeInfo = typeMap[loc.type] || typeMap.home
  const TypeIcon = typeInfo.icon

  const anim = (delay = 0) => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`
  })

  return (
    <div className="min-h-screen bg-lc-dark">
      {/* Ambient blobs */}
      <div className="blob-orange opacity-30" style={{ position:'fixed', top:'-100px', right:'-100px' }} />
      <div className="blob-pink opacity-20" style={{ position:'fixed', bottom:'0', left:'-80px' }} />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b px-5 py-4"
        style={{ background:'rgba(13,10,26,0.85)', backdropFilter:'blur(20px)', borderColor:'rgba(255,255,255,0.06)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm">
            <ArrowLeft size={15} /> My Locations
          </button>
          <BrandName size={30} />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-5">

        {/* Success banner */}
        <div style={anim(0)} className="text-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full mb-4"
            style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', color:'#34D399' }}>
            <CheckCircle size={13} /> LoCode Generated Successfully
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Your location is now digital!</h1>
          <p className="text-white/35 text-sm">Share your LoCode with anyone, anywhere.</p>
        </div>

        {/* Main LoCode card */}
        <div style={anim(120)} className="rounded-2xl p-6 border"
          style2={{ ...anim(120) }}
          {...{ style: { ...anim(120), background:'linear-gradient(135deg,rgba(255,143,0,0.08) 0%,rgba(233,30,140,0.05) 100%)', borderColor:'rgba(255,143,0,0.2)' } }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background:'rgba(255,143,0,0.12)' }}>
              <TypeIcon size={17} style={{ color:'#FF8F00' }} />
            </div>
            <div>
              <p className="text-white font-semibold">{loc.label || typeInfo.label}</p>
              <p className="text-white/35 text-xs">{loc.createdAt}</p>
            </div>
          </div>

          {/* Big LoCode */}
          <div className="text-center rounded-2xl py-7 px-4 mb-5 border"
            style={{ background:'rgba(0,0,0,0.4)', borderColor:'rgba(255,255,255,0.05)' }}>
            <p className="text-white/25 text-xs uppercase tracking-[0.35em] mb-3">Your LoCode</p>
            <p className="locode-badge text-3xl sm:text-4xl">{loc.locode}</p>
            <p className="text-white/20 text-xs mt-2">Unique Digital Location Identity</p>
          </div>

          {/* Address */}
          <div className="flex items-start gap-3 mb-5 rounded-xl p-3.5"
            style={{ background:'rgba(255,255,255,0.04)' }}>
            <MapPin size={14} className="text-white/30 mt-0.5 flex-shrink-0" />
            <p className="text-white/55 text-sm leading-relaxed">{fullAddress}</p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200"
              style={copied ? { background:'rgba(16,185,129,0.2)', border:'1px solid rgba(16,185,129,0.4)', color:'#34D399' } : { background:'linear-gradient(135deg,#FF8F00,#FF5722,#E91E8C)', color:'white', boxShadow:'0 4px 16px rgba(255,87,34,0.3)' }}>
              {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
            </button>
            <button onClick={handleShare}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 border"
              style={shared ? { background:'rgba(16,185,129,0.12)', borderColor:'rgba(16,185,129,0.4)', color:'#34D399' } : { background:'rgba(255,255,255,0.06)', borderColor:'rgba(255,255,255,0.12)', color:'white' }}>
              {shared ? <><CheckCircle size={14} /> Shared!</> : <><Share2 size={14} /> Share</>}
            </button>
          </div>

          <Link to={`/checkout-demo?code=${loc.locode}`}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 border mt-4 text-center hover:border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10 text-white">
            <Zap size={14} className="text-[#FF8F00]" /> Use this LoCode in Checkout Demo
          </Link>
        </div>

        {/* QR Code */}
        <div style={anim(240)} className="card text-center">
          <p className="text-white/30 text-xs uppercase tracking-[0.3em] mb-5">Scan QR Code</p>
          <div className="flex justify-center mb-3">
            <QRCanvas value={loc.locode} size={176} />
          </div>
          <p className="text-white/20 text-xs">Scan to resolve location details</p>
        </div>

        {/* Features */}
        <div style={anim(340)} className="grid grid-cols-3 gap-3">
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <div key={f.label} className="card text-center py-4 px-3">
                <Icon size={20} className="mx-auto mb-2" style={{ color:'#FF8F00' }} />
                <p className="text-white text-xs font-semibold mb-1">{f.label}</p>
                <p className="text-white/28 text-xs leading-snug">{f.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Partners */}
        <div style={anim(440)}>
          <p className="text-white/30 text-xs uppercase tracking-[0.3em] text-center mb-4">Accepted by our partners</p>
          <div className="grid grid-cols-4 gap-2">
            {PARTNERS.map(p => (
              <div key={p.name} className="rounded-xl p-3 text-center transition-all hover:scale-105 cursor-pointer border"
                style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.07)' }}>
                <div className="text-2xl mb-1">{p.emoji}</div>
                <p className="text-white/50 text-xs font-medium">{p.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Founder Section ── */}
        <div style={anim(540)}>
          <div className="rounded-2xl p-6 border relative overflow-hidden"
            style={{ background:'linear-gradient(135deg,rgba(21,101,192,0.08) 0%,rgba(13,10,26,1) 100%)', borderColor:'rgba(21,101,192,0.2)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
              style={{ background:'radial-gradient(circle,rgba(255,143,0,0.06) 0%,transparent 70%)', transform:'translate(30%,-30%)' }} />

            <p className="text-white/30 text-xs uppercase tracking-[0.3em] mb-5">From the Founder</p>

            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background:'linear-gradient(135deg,#FF8F00,#E91E8C)', boxShadow:'0 8px 24px rgba(255,87,34,0.3)' }}>
                <span className="font-display font-bold text-2xl text-white">R</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">{user?.name || 'Rudraksh'}</h3>
                <p className="text-sm font-medium" style={{ color:'#FF8F00' }}>Founder & CEO, LoCode</p>
                <p className="text-white/30 text-xs mt-1">Digital Location Identity Platform</p>
              </div>
            </div>

            <blockquote className="text-white/55 text-sm leading-relaxed italic pl-4 mb-5"
              style={{ borderLeft:'2px solid rgba(255,143,0,0.4)' }}>
              "India has millions of addresses that delivery partners can never find — long descriptions, confusing lanes, missing landmarks. LoCode solves this by giving every physical location a clean, shareable, verifiable digital identity. This is the postal code of the digital age."
            </blockquote>

            <div className="flex items-center gap-4 text-xs text-white/25">
              <span className="flex items-center gap-1.5"><MapPin size={10} /> India</span>
              <span className="flex items-center gap-1.5"><Globe size={10} /> locode.in</span>
            </div>
          </div>
        </div>

        {/* About LoCode */}
        <div style={anim(640)} className="card">
          <p className="text-white/30 text-xs uppercase tracking-[0.3em] mb-4">About LoCode</p>
          <h3 className="font-display font-bold text-xl text-white mb-3">
            <span style={{ color:'#1565C0' }}>Lo</span><span style={{ background:'linear-gradient(90deg,#FF8F00,#FF5722)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Code</span>
            {' '}<span className="text-white">for Everyone</span>
          </h3>
          <p className="text-white/45 text-sm leading-relaxed mb-5">
            India's first Digital Location Identity Platform. We assign every physical location a unique, secure, and reusable digital identity — so you never have to repeat a long address again.
          </p>
          <div className="space-y-2.5 mb-6">
            {['No more repeating long addresses','Works with every delivery partner','QR code for instant scanning','Multiple locations per account','Business API integrations available'].map(item => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-white/55">
                <CheckCircle size={13} style={{ color:'#FF8F00', flexShrink:0 }} />
                {item}
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
            Add Another Location <ChevronRight size={15} />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <div className="flex justify-center mb-3"><BrandName size={30} /></div>
          <p className="text-white/18 text-xs">© 2025 LoCode. All rights reserved.</p>
          <p className="text-white/12 text-xs mt-1">Giving every place a digital identity.</p>
        </div>
      </div>
    </div>
  )
}
