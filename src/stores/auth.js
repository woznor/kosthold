import { defineStore } from 'pinia'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured, normalizeEmail } from '../services/firebase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    initialized: false,
    loading: false,
    user: null,
    allowed: false,
    isAdmin: false,
    error: '',
    unsubscribe: null,
  }),

  getters: {
    isAuthenticated(state) {
      return Boolean(state.user && state.allowed)
    },

    userEmail(state) {
      return state.user?.email || ''
    },
  },

  actions: {
    async initializeAuth() {
      if (this.initialized || this.loading) return

      if (!isFirebaseConfigured) {
        this.error = 'Firebase mangler konfigurasjon.'
        this.initialized = true
        return
      }

      this.loading = true
      this.error = ''

      try {
        this.unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          this.user = firebaseUser
          if (firebaseUser) {
            await this.loadAccessProfile()
          } else {
            this.allowed = false
            this.isAdmin = false
          }
          this.initialized = true
          this.loading = false
        })
      } catch (error) {
        this.error = error.message || 'Innlogging feilet.'
        this.initialized = true
        this.loading = false
      }
    },

    async login(email, password) {
      if (!isFirebaseConfigured) {
        this.error = 'Firebase mangler konfigurasjon.'
        return
      }

      const normalizedEmail = normalizeEmail(email)
      if (!normalizedEmail) {
        this.error = 'Skriv inn e-post.'
        return
      }

      if (!password) {
        this.error = 'Skriv inn passord.'
        return
      }

      this.loading = true
      this.error = ''

      try {
        await signInWithEmailAndPassword(auth, normalizedEmail, password)
      } catch (error) {
        this.error = error.message || 'Innlogging feilet.'
      } finally {
        this.loading = false
      }
    },

    async loadAccessProfile() {
      if (!this.user?.email) return

      const email = normalizeEmail(this.user.email)
      const [allowlistSnapshot, userSnapshot] = await Promise.all([
        getDoc(doc(db, 'allowlist', email)),
        getDoc(doc(db, 'users', this.user.uid)),
      ])

      this.allowed = allowlistSnapshot.exists()
      this.isAdmin = userSnapshot.exists() && userSnapshot.data()?.role === 'admin'

      if (!this.allowed) {
        this.error = 'E-posten er ikke whitelisted for denne appen.'
        await signOut(auth)
      }
    },

    async logout() {
      if (isFirebaseConfigured) {
        await signOut(auth)
      }
      this.user = null
      this.allowed = false
      this.isAdmin = false
      this.error = ''
    },
  },
})
