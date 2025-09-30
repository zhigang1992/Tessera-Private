import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestPost: PagesFunction = async () => {
  // TODO: Verify email token and mark wallet email as confirmed.
  return Response.json({ error: 'Email verify endpoint not implemented' }, { status: 501 });
};
