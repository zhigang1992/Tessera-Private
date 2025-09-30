import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async () => {
  // TODO: Aggregate affiliate metrics including tree summary.
  return Response.json({ error: 'Affiliate endpoint not implemented' }, { status: 501 });
};
