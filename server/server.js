import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { getDbConnection, initializeDatabase } from './db.js'

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 5000

// Initialize Database
await initializeDatabase()

// Configure SMTP transporter
const smtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.SMTP_PASS !== 'YOUR_GMAIL_APP_PASSWORD_HERE'
)
let transporter

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
} else {
  console.log('⚠️ SMTP Credentials not configured. Creating Ethereal SMTP fallback on the fly...')
}

async function sendEmailOTP(email, code) {
  const mailOptions = {
    from: smtpConfigured ? `"LoCode Security" <${process.env.SMTP_USER}>` : '"LoCode Security" <noreply@locode.in>',
    to: email,
    subject: 'Your LoCode OTP Verification Code',
    text: `Your verification code is: ${code}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; background-color: #111020; color: white; border-radius: 12px; max-width: 400px; border: 1px solid rgba(255,255,255,0.06)">
        <h2 style="color: #FF8F00; margin-top: 0;">LoCode Verification</h2>
        <p style="color: rgba(255,255,255,0.6);">Your secure one-time passcode is:</p>
        <h1 style="letter-spacing: 6px; font-family: monospace; color: #42A5F5; background: rgba(255,255,255,0.04); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.05); margin: 20px 0;">${code}</h1>
        <p style="color: rgba(255,255,255,0.35); font-size: 11px; margin-bottom: 0;">This passcode is valid for 5 minutes. If you did not request this, please ignore this message.</p>
      </div>
    `
  }

  if (smtpConfigured) {
    try {
      await transporter.sendMail(mailOptions)
      console.log(`📧 OTP Email successfully sent to ${email} (Production SMTP)`)
    } catch (err) {
      console.error('Production SMTP send error:', err)
    }
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount()
      const tempTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      })
      const info = await tempTransporter.sendMail(mailOptions)
      console.log(`\n==================================================`)
      console.log(`📧 SECURE MOCK EMAIL LOGGED (Ethereal SMTP):`)
      console.log(`👉 Inbox Link: ${nodemailer.getTestMessageUrl(info)}`)
      console.log(`👉 OTP Code:   ${code}`)
      console.log(`==================================================\n`)
    } catch (err) {
      console.error('Failed to send Ethereal fallback email:', err)
    }
  }
}

app.use(cors())
app.use(express.json())

// Middleware: Authenticate request via Authorization header (simple token: 'Bearer <userId>')
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' })
    }
    
    const userId = authHeader.split(' ')[1]
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' })
    }

    const db = await getDbConnection()
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId])
    await db.close()

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' })
    }

    req.user = user
    next()
  } catch (err) {
    console.error('Auth Middleware Error:', err)
    res.status(500).json({ error: 'Internal Server Error during auth' })
  }
}

// ── AUTH ROUTES ──

// POST /api/auth/send-otp
app.post('/api/auth/send-otp', async (req, res) => {
  const { identity, name, role } = req.body // identity can be phone number or email

  if (!identity) {
    return res.status(400).json({ error: 'Phone or email is required' })
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 mins expiry

  try {
    const db = await getDbConnection()
    
    // Save to OTP table
    await db.run(
      'INSERT INTO otps (identity, code, expires_at) VALUES (?, ?, ?)',
      [identity, code, expiresAt]
    )

    await db.close()

    // Send email OTP via SMTP if the identity is an email address
    const isEmail = identity.includes('@')
    if (isEmail) {
      await sendEmailOTP(identity, code)
    } else {
      console.log(`\n========================================`)
      console.log(`🔑 OTP SENT TO (SMS Simulator): ${identity}`)
      console.log(`👉 CODE: ${code}`)
      console.log(`========================================\n`)
    }

    // Do NOT return the OTP code in the JSON response (prevents screen popping for security)
    res.json({
      message: 'OTP sent successfully',
      identity
    })
  } catch (err) {
    console.error('Send OTP Error:', err)
    res.status(500).json({ error: 'Database error while sending OTP' })
  }
})


// POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req, res) => {
  const { identity, code, name, role } = req.body // role could be 'user' or 'admin'

  if (!identity || !code) {
    return res.status(400).json({ error: 'Identity and OTP code are required' })
  }

  try {
    const db = await getDbConnection()

    // Find latest OTP for this identity
    const otpRecord = await db.get(
      'SELECT * FROM otps WHERE identity = ? ORDER BY created_at DESC LIMIT 1',
      [identity]
    )

    if (!otpRecord || otpRecord.code !== code) {
      await db.close()
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' })
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await db.close()
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' })
    }

    // Delete OTP record once verified (prevents replay attacks)
    await db.run('DELETE FROM otps WHERE id = ?', [otpRecord.id])

    // Find if user exists
    const isEmail = identity.includes('@')
    let user
    if (isEmail) {
      user = await db.get('SELECT * FROM users WHERE email = ?', [identity])
    } else {
      user = await db.get('SELECT * FROM users WHERE phone = ?', [identity])
    }

    // Register user if they do not exist
    if (!user) {
      const displayRole = role === 'admin' ? 'admin' : 'user'
      const displayName = name && name.trim() ? name : (isEmail ? identity.split('@')[0] : 'User_' + identity.slice(-4))
      const avatar = displayName[0].toUpperCase()

      const result = await db.run(
        'INSERT INTO users (name, phone, email, role, avatar) VALUES (?, ?, ?, ?, ?)',
        [
          displayName,
          isEmail ? null : identity,
          isEmail ? identity : null,
          displayRole,
          avatar
        ]
      )

      user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID])
    } else {
      // If user exists and tries to login as admin, but is a user (or vice versa), we validate role
      if (role && user.role !== role) {
        await db.close()
        return res.status(403).json({ error: `Access denied: Account is registered as ${user.role}, not ${role}.` })
      }
    }

    await db.close()

    res.json({
      message: 'Authentication successful',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    })
  } catch (err) {
    console.error('Verify OTP Error:', err)
    res.status(500).json({ error: 'Database error during verification' })
  }
})

// ── LOCATION ROUTES ──

// GET /api/locations (Auth Required)
app.get('/api/locations', authenticate, async (req, res) => {
  try {
    const db = await getDbConnection()
    let locations = []

    // If admin requests all, return all locations
    if (req.user.role === 'admin' && req.query.all === 'true') {
      locations = await db.all(`
        SELECT l.*, u.name as userName, u.email as userEmail, u.phone as userPhone
        FROM locations l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
      `)
    } else {
      locations = await db.all(
        'SELECT * FROM locations WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
      )
    }

    await db.close()
    res.json(locations)
  } catch (err) {
    console.error('Fetch Locations Error:', err)
    res.status(500).json({ error: 'Database error while fetching locations' })
  }
})

// POST /api/locations (Auth Required)
app.post('/api/locations', authenticate, async (req, res) => {
  const { type, label, addressLine1, addressLine2, area, city, state, pincode, landmark, latitude, longitude } = req.body

  if (!addressLine1 || !city || !state || !pincode) {
    return res.status(400).json({ error: 'Missing required address fields' })
  }

  try {
    const db = await getDbConnection()

    // ── ADDRESS DEDUPLICATION CHECK ──
    // Check if the user already has this location registered (matches addressLine1, city, pincode)
    const existingLocation = await db.get(`
      SELECT * FROM locations 
      WHERE user_id = ? 
        AND LOWER(TRIM(addressLine1)) = LOWER(TRIM(?))
        AND LOWER(TRIM(city)) = LOWER(TRIM(?))
        AND LOWER(TRIM(pincode)) = LOWER(TRIM(?))
    `, [req.user.id, addressLine1, city, pincode])

    if (existingLocation) {
      await db.close()
      console.log(`📍 Duplicate location detected for user ${req.user.id}. Returning existing LoCode: ${existingLocation.locode}`)
      return res.status(200).json(existingLocation)
    }

    // Generate Unique LoCode
    const prefix = (city || 'XX').slice(0, 2).toUpperCase()
    const cleanArea = (area || 'YY').slice(0, 3).toUpperCase().replace(/\s/g, '')
    const num = Math.floor(1000 + Math.random() * 9000)
    const suffix = Math.random().toString(36).slice(2, 4).toUpperCase()
    const locode = `LC-${prefix}${cleanArea}-${num}${suffix}`

    const result = await db.run(`
      INSERT INTO locations (user_id, type, label, addressLine1, addressLine2, area, city, state, pincode, landmark, locode, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      type || 'home',
      label || '',
      addressLine1,
      addressLine2 || '',
      area || '',
      city,
      state,
      pincode,
      landmark || '',
      locode,
      latitude || null,
      longitude || null
    ])

    const newLocation = await db.get('SELECT * FROM locations WHERE id = ?', [result.lastID])
    await db.close()

    res.status(201).json(newLocation)
  } catch (err) {
    console.error('Create Location Error:', err)
    res.status(500).json({ error: 'Database error while creating location' })
  }
})


// GET /api/locations/decode/:locode (Public)
app.get('/api/locations/decode/:locode', async (req, res) => {
  const { locode } = req.params

  if (!locode) {
    return res.status(400).json({ error: 'LoCode parameter is required' })
  }

  try {
    const db = await getDbConnection()
    const location = await db.get(
      'SELECT l.*, u.name as userName FROM locations l LEFT JOIN users u ON l.user_id = u.id WHERE LOWER(l.locode) = LOWER(?)',
      [locode]
    )
    await db.close()

    if (!location) {
      return res.status(404).json({ error: 'LoCode not found' })
    }

    res.json(location)
  } catch (err) {
    console.error('Decode LoCode Error:', err)
    res.status(500).json({ error: 'Database error while decoding LoCode' })
  }
})

// ── ADMIN ROUTES (Auth & Admin Role Required) ──

// Admin Authorization Middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required' })
  }
  next()
}

// GET /api/admin/stats
app.get('/api/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = await getDbConnection()

    const usersCount = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'user'")
    const adminsCount = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
    const locationsCount = await db.get("SELECT COUNT(*) as count FROM locations")
    
    // Type distribution
    const typeDistribution = await db.all(`
      SELECT type, COUNT(*) as count 
      FROM locations 
      GROUP BY type
    `)

    // Recent signups
    const recentUsers = await db.all(`
      SELECT id, name, email, phone, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `)

    await db.close()

    res.json({
      totalUsers: usersCount.count,
      totalAdmins: adminsCount.count,
      totalLocations: locationsCount.count,
      typeDistribution,
      recentUsers
    })
  } catch (err) {
    console.error('Admin Stats Error:', err)
    res.status(500).json({ error: 'Database error while fetching admin stats' })
  }
})

// GET /api/admin/users
app.get('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = await getDbConnection()
    const users = await db.all(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, COUNT(l.id) as locationsCount
      FROM users u
      LEFT JOIN locations l ON u.id = l.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `)
    await db.close()
    res.json(users)
  } catch (err) {
    console.error('Admin Users List Error:', err)
    res.status(500).json({ error: 'Database error while listing users' })
  }
})

// POST /api/admin/users/:userId/role
app.post('/api/admin/users/:userId/role', authenticate, requireAdmin, async (req, res) => {
  const { userId } = req.params
  const { role } = req.body

  if (role !== 'user' && role !== 'admin') {
    return res.status(400).json({ error: 'Invalid role' })
  }

  try {
    const db = await getDbConnection()
    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId])
    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [userId])
    await db.close()
    
    res.json(updatedUser)
  } catch (err) {
    console.error('Update Role Error:', err)
    res.status(500).json({ error: 'Database error while updating role' })
  }
})

// GET /api/admin/otps
app.get('/api/admin/otps', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = await getDbConnection()
    const otps = await db.all(`
      SELECT * FROM otps 
      ORDER BY created_at DESC 
      LIMIT 30
    `)
    await db.close()
    res.json(otps)
  } catch (err) {
    console.error('Fetch OTP Logs Error:', err)
    res.status(500).json({ error: 'Database error while fetching OTP logs' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 LoCode Backend running on http://localhost:${PORT}`)
})
