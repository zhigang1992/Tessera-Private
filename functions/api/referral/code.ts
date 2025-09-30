import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestPost: PagesFunction = async () => {
  // TODO: Upsert referral code for affiliate wallet.
  return Response.json({ error: 'Referral code endpoint not implemented' }, { status: 501 });
};
