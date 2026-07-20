import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, 'locode.db')

export async function getDbConnection() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  })
}

export async function initializeDatabase() {
  const db = await getDbConnection()
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      role TEXT DEFAULT 'user',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      label TEXT,
      addressLine1 TEXT NOT NULL,
      addressLine2 TEXT,
      area TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      landmark TEXT,
      locode TEXT UNIQUE NOT NULL,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identity TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Safely alter existing database tables if columns are missing
  try {
    await db.exec('ALTER TABLE locations ADD COLUMN latitude REAL;')
  } catch (e) {
    // Ignore if column already exists
  }
  try {
    await db.exec('ALTER TABLE locations ADD COLUMN longitude REAL;')
  } catch (e) {
    // Ignore if column already exists
  }


  // Check if users table is empty to preseed
  const usersCount = await db.get('SELECT COUNT(*) as count FROM users')
  if (usersCount.count === 0) {
    console.log('Seeding initial users and locations...')
    // Seed regular user
    const resultUser = await db.run(
      'INSERT INTO users (name, phone, email, role, avatar) VALUES (?, ?, ?, ?, ?)',
      ['Rudraksh', '9876543210', 'rudraksh@locode.in', 'user', 'R']
    )
    const rudrakshId = resultUser.lastID

    // Seed admin
    const resultAdmin = await db.run(
      'INSERT INTO users (name, phone, email, role, avatar) VALUES (?, ?, ?, ?, ?)',
      ['LoCode Admin', '9999999999', 'admin@locode.in', 'admin', 'A']
    )
    const adminId = resultAdmin.lastID

    // Seed locations for Rudraksh
    await db.run(`
      INSERT INTO locations (user_id, type, label, addressLine1, addressLine2, area, city, state, pincode, landmark, locode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      rudrakshId,
      'home',
      'Home',
      'Flat 402, Sunshine Heights',
      'Opposite National Park',
      'Bandra West',
      'Mumbai',
      'Maharashtra',
      '400050',
      'Sunshine Park',
      'LC-MUBKC-7821XP'
    ])

    await db.run(`
      INSERT INTO locations (user_id, type, label, addressLine1, addressLine2, area, city, state, pincode, landmark, locode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      rudrakshId,
      'office',
      'Bandra Co-Working Space',
      'Level 5, Maker Chambers V',
      'Nariman Point',
      'Fort',
      'Mumbai',
      'Maharashtra',
      '400021',
      'Near Air India Building',
      'LC-MUMNC-1029BK'
    ])

    // Seed locations for Admin
    await db.run(`
      INSERT INTO locations (user_id, type, label, addressLine1, addressLine2, area, city, state, pincode, landmark, locode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      adminId,
      'shop',
      'LoCode India HQ',
      'DLF Cyber City, Building 10C',
      'Phase II',
      'Sector 24',
      'Gurugram',
      'Haryana',
      '122002',
      'Cyber Hub',
      'LC-DLFGG-8843HQ'
    ])
    
    console.log('Database seeding complete.')
  }
  
  await db.close()
}
