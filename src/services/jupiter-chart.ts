export type ChartInterval = '15M' | '1H' | '4H' | '1D' | '1W'

export interface JupiterCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface JupiterChartResponse {
  candles: JupiterCandle[]
}

const INTERVAL_MAP: Record<ChartInterval, string> = {
  '15M': '15_MINUTE',
  '1H': '1_HOUR',
  '4H': '4_HOUR',
  '1D': '1_DAY',
  '1W': '1_WEEK',
}

const CANDLE_COUNTS: Record<ChartInterval, number> = {
  '15M': 96,
  '1H': 168,
  '4H': 180,
  '1D': 365,
  '1W': 200,
}

const REFETCH_INTERVALS: Record<ChartInterval, number> = {
  '15M': 60_000,
  '1H': 5 * 60_000,
  '4H': 15 * 60_000,
  '1D': 30 * 60_000,
  '1W': 60 * 60_000,
}

export function getRefetchInterval(interval: ChartInterval): number {
  return REFETCH_INTERVALS[interval]
}

export async function fetchJupiterCandles(
  mint: string,
  interval: ChartInterval
): Promise<JupiterCandle[]> {
  const jupInterval = INTERVAL_MAP[interval]
  const candles = CANDLE_COUNTS[interval]

  const url = `/api/charts/${mint}?interval=${jupInterval}&candles=${candles}&type=price&quote=usd`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Chart API error: ${response.status}`)
  }

  const data: JupiterChartResponse = await response.json()
  return data.candles ?? []
}
