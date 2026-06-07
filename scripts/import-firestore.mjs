import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeFirebaseAdmin } from './firebase-admin-app.mjs'

const rootDir = path.resolve(process.cwd())
const { projectId } = initializeFirebaseAdmin()
const db = getFirestore()
const meals = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/meals.json'), 'utf8'))
const ingredientMatching = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'public/ingredient-matching.json'), 'utf8'),
)

async function commitInBatches(writes) {
  const batchSize = 450
  for (let index = 0; index < writes.length; index += batchSize) {
    const batch = db.batch()
    writes.slice(index, index + batchSize).forEach((write) => write(batch))
    await batch.commit()
  }
}

const now = Timestamp.now()
const writes = []

meals.forEach((meal) => {
  writes.push((batch) => {
    batch.set(db.collection('meals').doc(String(meal.id)), {
      ...meal,
      updatedAt: now,
    })
  })
})

writes.push((batch) => {
  batch.set(db.collection('appData').doc('ingredientMatching'), {
    ...ingredientMatching,
    updatedAt: now,
  })
})

await commitInBatches(writes)

console.log(`Imported ${meals.length} meals and ingredient matching into project ${projectId}.`)
