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

export async function fetchIngredientMatchingFromFirestore() {
  if (!isFirebaseConfigured) return null

  const snapshot = await getDoc(doc(db, 'appData', 'ingredientMatching'))
  return snapshot.exists() ? snapshot.data() : null
}
