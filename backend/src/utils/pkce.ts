import crypto from 'crypto';

export function generateCodeVerifier(length: number = 128): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.randomBytes(length);
  return Array.from(values)
    .map(x => possible[x % possible.length])
    .join('');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const base64Digest = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64');
  
  return base64Digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
} 