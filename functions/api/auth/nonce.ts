import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async ({ env }) => {
  // TODO: Implement nonce issuance using SESSION_KV + random token generation.
  const placeholder = {
    message: 'Nonce endpoint not yet implemented',
    kvBinding: 'SESSION_KV' in env,
  };

  return Response.json(placeholder, { status: 501 });
};
