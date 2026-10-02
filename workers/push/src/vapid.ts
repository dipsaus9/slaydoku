/** VAPID (RFC 8292) signing with Web Crypto. Keys are base64url: public = 65-byte uncompressed P-256 point, private = 32-byte scalar. */

const enc = new TextEncoder()

export function b64urlEncode(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function b64urlDecode(text: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (text.length % 4)) % 4)
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/') + pad)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

export async function importVapidKey(publicKey: string, privateKey: string): Promise<CryptoKey> {
  const pub = b64urlDecode(publicKey)
  if (pub.length !== 65 || pub[0] !== 4) throw new Error('VAPID public key must be an uncompressed P-256 point')
  return crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x: b64urlEncode(pub.slice(1, 33)), y: b64urlEncode(pub.slice(33)), d: privateKey },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
}

/** ES256 JWT for one push-service origin; Web Crypto already yields the raw r||s signature JWT wants. */
export async function signVapidJwt(key: CryptoKey, audience: string, subject: string, expSeconds: number): Promise<string> {
  const part = (o: unknown) => b64urlEncode(enc.encode(JSON.stringify(o)))
  const input = `${part({ typ: 'JWT', alg: 'ES256' })}.${part({ aud: audience, exp: expSeconds, sub: subject })}`
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(input))
  return `${input}.${b64urlEncode(new Uint8Array(sig))}`
}

export const authorizationHeader = (jwt: string, publicKey: string) => `vapid t=${jwt}, k=${publicKey}`
