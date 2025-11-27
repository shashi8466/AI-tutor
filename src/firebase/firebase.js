import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

    // Initialize Firebase using Vite env vars
    // Resolve a valid storage bucket; default to `${projectId}.appspot.com`
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
    let storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined)
    if (storageBucket && storageBucket.endsWith('.firebasestorage.app')) {
      storageBucket = storageBucket.replace('.firebasestorage.app', '.appspot.com')
    }

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: projectId,
      storageBucket: storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    }

    const app = initializeApp(firebaseConfig)
    export const firestore = getFirestore(app)
    export const firebaseStorage = getStorage(app, storageBucket ? `gs://${storageBucket}` : undefined)

    export default app


