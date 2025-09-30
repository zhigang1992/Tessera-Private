import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestPost: PagesFunction = async () => {
  // TODO: Handle referral binding mutation with signature validation.
  return Response.json({ error: 'Bind endpoint not implemented' }, { status: 501 });
};
