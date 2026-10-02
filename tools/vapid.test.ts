import { describe, expect, it } from 'vitest'
import { authorizationHeader, b64urlDecode, importVapidKey, signVapidJwt } from '../workers/push/src/vapid.ts'
import { generateVapidKeyPair } from './vapid.ts'

describe('generateVapidKeyPair', () => {
  it('prints a 65-byte uncompressed public key and a 32-byte private scalar, base64url', async () => {
    const { publicKey, privateKey } = await generateVapidKeyPair()
    expect(publicKey).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(privateKey).toMatch(/^[A-Za-z0-9_-]+$/)
    const pub = b64urlDecode(publicKey)
    expect(pub.length).toBe(65)
    expect(pub[0]).toBe(4)
    expect(b64urlDecode(privateKey).length).toBe(32)
  })

  it('makes a fresh pair each time', async () => {
    const a = await generateVapidKeyPair()
    const b = await generateVapidKeyPair()
    expect(a.privateKey).not.toBe(b.privateKey)
  })

  it('signs with the Worker vapid.ts and the signature verifies against the public key', async () => {
    const { publicKey, privateKey } = await generateVapidKeyPair()
    const key = await importVapidKey(publicKey, privateKey)
    const jwt = await signVapidJwt(key, 'https://push.example.com', 'mailto:owner@example.com', 2_000_000_000)
    const [head, body, sig] = jwt.split('.') as [string, string, string]
    const verifyKey = await crypto.subtle.importKey('raw', b64urlDecode(publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      verifyKey,
      b64urlDecode(sig),
      new TextEncoder().encode(`${head}.${body}`),
    )
    expect(ok).toBe(true)
    expect(authorizationHeader(jwt, publicKey)).toBe(`vapid t=${jwt}, k=${publicKey}`)
  })
})
