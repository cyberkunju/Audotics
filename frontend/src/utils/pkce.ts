import crypto from 'crypto';

export function generateCodeVerifier(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(values[i] % possible.length);
  }
  return text;
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const digestArray = Array.from(new Uint8Array(digest));
  
  return btoa(String.fromCharCode.apply(null, digestArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
} 