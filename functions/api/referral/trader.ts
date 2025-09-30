import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async () => {
  // TODO: Fetch trader referral metrics from D1 once schema exists.
  return Response.json({ error: 'Trader endpoint not implemented' }, { status: 501 });
};
