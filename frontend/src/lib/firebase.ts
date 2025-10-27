import type { Auth } from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const cfg = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID,
}

let auth: Auth
let googleProvider: GoogleAuthProvider | null = null
let isFirebaseConfigured = false

if (cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId) {
  const app = getApps().length ? getApps()[0] : initializeApp(cfg as any)
  auth = getAuth(app)
  googleProvider = new GoogleAuthProvider()
  isFirebaseConfigured = true
} else {
  auth = { currentUser: null } as unknown as Auth
}

export { auth, googleProvider, isFirebaseConfigured }
