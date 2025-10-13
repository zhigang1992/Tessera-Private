export const SIGN_IN_MESSAGE_HEADER = 'Sign in to Tessera Referral Program';
export const NONCE_TTL_SECONDS = 5 * 60; // 5 minutes
export const SESSION_TTL_SECONDS = 2 * 60 * 60; // 2 hours
export const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_FUTURE_DRIFT_MS = 60 * 1000; // 1 minute skew allowance

export function buildSignInMessage(nonce: string, timestampIso: string): string {
  return `${SIGN_IN_MESSAGE_HEADER}\nNonce: ${nonce}\nTimestamp: ${timestampIso}`;
}
