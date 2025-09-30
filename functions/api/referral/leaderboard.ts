import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async () => {
  // TODO: Return leaderboard results using cached snapshot or live query.
  return Response.json({ error: 'Leaderboard endpoint not implemented' }, { status: 501 });
};
