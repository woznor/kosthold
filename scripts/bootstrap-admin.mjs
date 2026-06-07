import process from 'node:process'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { initializeFirebaseAdmin } from './firebase-admin-app.mjs'

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

const email = normalizeEmail(process.argv[2] || process.env.ADMIN_EMAIL)
const password = process.argv[3] || process.env.ADMIN_PASSWORD

if (!email) {
  console.error('Usage: npm run bootstrap:admin -- your@email.com optional-password')
  process.exit(1)
}

const { projectId } = initializeFirebaseAdmin()
const auth = getAuth()
const db = getFirestore()

let user
try {
  user = await auth.getUserByEmail(email)
} catch (error) {
  if (error.code !== 'auth/user-not-found') throw error
  const userPayload = {
    email,
    emailVerified: true,
  }
  if (password) userPayload.password = password
  user = await auth.createUser(userPayload)
}

if (password && user) {
  await auth.updateUser(user.uid, {
    password,
    emailVerified: true,
  })
}

await Promise.all([
  db.collection('allowlist').doc(email).set({
    email,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: 'bootstrap',
  }, { merge: true }),
  db.collection('users').doc(user.uid).set({
    email,
    role: 'admin',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true }),
])

console.log(`Bootstrapped admin ${email} (${user.uid}) in ${projectId}.`)
