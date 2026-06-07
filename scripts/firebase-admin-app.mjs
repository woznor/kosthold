import fs from 'node:fs'
import process from 'node:process'
import { cert, getApps, initializeApp } from 'firebase-admin/app'

export function initializeFirebaseAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'kosthold-4fdd3'
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (!serviceAccountPath) {
    throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service-account JSON file.')
  }

  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    })
  }

  return { projectId }
}
