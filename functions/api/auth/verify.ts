import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async () => {
  // TODO: Validate signed payload, issue short-lived session token.
  return new Response('Auth verify not implemented', { status: 501 });
};
