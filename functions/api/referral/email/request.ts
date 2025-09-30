import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestPost: PagesFunction = async () => {
  // TODO: Persist email + token, enqueue Cloudflare Email Worker message.
  return Response.json({ error: 'Email request endpoint not implemented' }, { status: 501 });
};
