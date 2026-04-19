const ADVANCED_SEARCH_URL = 'https://api.twitterapi.io/twitter/tweet/advanced_search'

export type TweetSearchResult = {
  found: boolean
  tweet?: {
    id: string
    url: string
    text: string
    createdAt: string
  }
}

type RawTweet = {
  id?: string
  id_str?: string
  text?: string
  full_text?: string
  createdAt?: string
  created_at?: string
  url?: string
  author?: { userName?: string; screen_name?: string; username?: string }
}

type RawResponse = {
  tweets?: RawTweet[]
  data?: RawTweet[]
  results?: RawTweet[]
}

export class TwitterApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'TwitterApiError'
    this.status = status
  }
}

function buildTweetUrl(handle: string, tweet: RawTweet): string {
  if (tweet.url) return tweet.url
  const id = tweet.id_str ?? tweet.id
  const username =
    tweet.author?.userName ?? tweet.author?.screen_name ?? tweet.author?.username ?? handle
  return `https://twitter.com/${username}/status/${id}`
}

export async function searchTweetsByUser(params: {
  apiKey: string
  handle: string
  query: string
  fetchImpl?: typeof fetch
}): Promise<TweetSearchResult> {
  const { apiKey, handle, query, fetchImpl = fetch } = params

  const searchQuery = `from:${handle} "${query}"`
  const url = new URL(ADVANCED_SEARCH_URL)
  url.searchParams.set('query', searchQuery)
  url.searchParams.set('queryType', 'Latest')

  const res = await fetchImpl(url.toString(), {
    method: 'GET',
    headers: {
      'X-API-Key': apiKey,
      accept: 'application/json',
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new TwitterApiError(
      `twitterapi.io advanced_search failed (${res.status}): ${body.slice(0, 200)}`,
      res.status,
    )
  }

  const body = (await res.json().catch(() => ({}))) as RawResponse
  const tweets = body.tweets ?? body.data ?? body.results ?? []
  const first = tweets[0]
  if (!first) {
    return { found: false }
  }

  const id = first.id_str ?? first.id
  if (!id) {
    return { found: false }
  }

  return {
    found: true,
    tweet: {
      id,
      url: buildTweetUrl(handle, first),
      text: first.full_text ?? first.text ?? '',
      createdAt: first.createdAt ?? first.created_at ?? '',
    },
  }
}
