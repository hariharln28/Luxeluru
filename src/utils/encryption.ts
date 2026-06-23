// E2E encryption for admin-salon messages using Web Crypto API (AES-GCM)
// Key is derived per-salon from salonId + app-level constant
// Server only ever stores ciphertext — never decrypts

const APP_MSG_KEY = import.meta.env.VITE_MSG_KEY || 'luxeluru-2026-messaging-secret-key';

async function deriveKey(salonId: string): Promise<CryptoKey> {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(APP_MSG_KEY + salonId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('luxeluru-salt-' + salonId),
      iterations: 10000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(plaintext: string, salonId: string): Promise<string> {
  const key = await deriveKey(salonId);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  // Prepend IV to ciphertext, then base64 encode the whole thing
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptMessage(ciphertext: string, salonId: string): Promise<string> {
  try {
    const key = await deriveKey(salonId);
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return '[Unable to decrypt message]';
  }
}
