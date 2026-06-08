import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'

export async function fetchMealsFromFirestore() {
  if (!isFirebaseConfigured) return null

  const snapshot = await getDocs(query(collection(db, 'meals'), orderBy('id')))
  if (snapshot.empty) return null

  return snapshot.docs.map((mealDoc) => ({
    ...mealDoc.data(),
    firestoreId: mealDoc.id,
  }))
}

export async function saveMealToFirestore(meal) {
  if (!isFirebaseConfigured) return
  await setDoc(doc(db, 'meals', String(meal.id)), meal)
}

export async function deleteMealFromFirestore(mealId) {
  if (!isFirebaseConfigured) return
  await deleteDoc(doc(db, 'meals', String(mealId)))
}

export async function fetchIngredientCatalogFromFirestore() {
  if (!isFirebaseConfigured) return null

  const snapshot = await getDoc(doc(db, 'appData', 'ingredientCatalog'))
  return snapshot.exists() ? snapshot.data() : null
}

export async function saveIngredientCatalogToFirestore(entries) {
  if (!isFirebaseConfigured) return

  await setDoc(doc(db, 'appData', 'ingredientCatalog'), {
    entries,
  })
}

export async function fetchAuditThresholdsFromFirestore() {
  if (!isFirebaseConfigured) return null

  const snapshot = await getDoc(doc(db, 'appData', 'auditThresholds'))
  return snapshot.exists() ? snapshot.data() : null
}

export async function saveAuditThresholdsToFirestore(thresholds) {
  if (!isFirebaseConfigured) return

  await setDoc(doc(db, 'appData', 'auditThresholds'), thresholds)
}

export async function fetchUserPlannerStateFromFirestore(uid) {
  if (!isFirebaseConfigured || !uid) return null

  const snapshot = await getDoc(doc(db, 'users', uid, 'preferences', 'mealPlanner'))
  return snapshot.exists() ? snapshot.data() : null
}

export async function saveUserPlannerStateToFirestore(uid, payload) {
  if (!isFirebaseConfigured || !uid) return

  await setDoc(doc(db, 'users', uid, 'preferences', 'mealPlanner'), payload, { merge: true })
}
