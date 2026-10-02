// VAPID key pair generator for the push Worker (Bun only): `bun tools/vapid.ts`.
// Prints a fresh P-256 pair, base64url, in the format workers/push/src/vapid.ts and the client expect:
//   public  = 65-byte uncompressed point (the client's applicationServerKey and the Worker's VAPID_PUBLIC_KEY)
//   private = 32-byte scalar d (the Worker's VAPID_PRIVATE_KEY secret, never committed)

import { b64urlEncode } from '../workers/push/src/vapid.ts'

export interface VapidKeyPair {
  publicKey: string
  privateKey: string
}

export async function generateVapidKeyPair(): Promise<VapidKeyPair> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const publicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey)
  if (!jwk.d) throw new Error('exported key has no private scalar')
  return { publicKey: b64urlEncode(publicRaw), privateKey: jwk.d }
}

if (import.meta.main) {
  const { publicKey, privateKey } = await generateVapidKeyPair()
  console.log(`VAPID_PUBLIC_KEY=${publicKey}`)
  console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
  console.log('\nPublic key: paste into src/pwa/reminder.ts (vapidPublicKey) and `wrangler secret put VAPID_PUBLIC_KEY`.')
  console.log('Private key: only `wrangler secret put VAPID_PRIVATE_KEY`. Do not commit it or share it.')
}
