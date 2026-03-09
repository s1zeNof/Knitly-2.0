/**
 * @fileoverview Firebase Admin SDK — singleton initializer for Vercel serverless functions.
 *
 * Firebase Admin is heavy. We initialise it once per cold-start and reuse the
 * instance across invocations on the same container (Vercel warm instances).
 *
 * Required environment variable (set in Vercel dashboard):
 *   FIREBASE_SERVICE_ACCOUNT — the full JSON content of your service account key,
 *                               stringified (JSON.stringify the .json file).
 *
 * Optional fallback:
 *   If FIREBASE_SERVICE_ACCOUNT is absent, the SDK falls back to
 *   Application Default Credentials (useful in Google Cloud environments).
 *
 * @example
 *   import { getDb, getAuth } from '../_lib/firebase.js';
 *   const db   = getDb();
 *   const auth = getAuth();
 */

import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore }  from 'firebase-admin/firestore';
import { getAuth }       from 'firebase-admin/auth';

// ─── Lazy singletons ─────────────────────────────────────────────────────────

let _db   = null;
let _auth = null;

function ensureInitialised() {
    if (getApps().length > 0) return;

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    const credential = raw
        ? cert(JSON.parse(raw))
        : applicationDefault();

    initializeApp({
        credential,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    });
}

/**
 * Returns the Firestore Admin instance (initialises Firebase on first call).
 * @returns {import('firebase-admin/firestore').Firestore}
 */
export function getDb() {
    if (_db) return _db;
    ensureInitialised();
    _db = getFirestore();
    return _db;
}

/**
 * Returns the Firebase Auth Admin instance (initialises Firebase on first call).
 * @returns {import('firebase-admin/auth').Auth}
 */
export function getAdminAuth() {
    if (_auth) return _auth;
    ensureInitialised();
    _auth = getAuth();
    return _auth;
}

/**
 * Re-exports FieldValue for convenience.
 * @example
 *   import { FieldValue } from '../_lib/firebase.js';
 *   batch.update(ref, { count: FieldValue.increment(1) });
 */
export { FieldValue } from 'firebase-admin/firestore';
