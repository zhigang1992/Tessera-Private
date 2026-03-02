import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { getExploreAssetById } from '@/services'
import { getTokenDetailStats } from '@/services/token-detail'
import { getAppToken } from '@/config'
import { AppTokenIcon } from '@/components/app-token-icon'
import { useMarketDepth, formatTvl } from '@/hooks/useMarketDepth'
import { Button } from '@/components/ui/button'
import { StatCard } from './components/stat-card'
import {
  ArrowLeftRight,
  DollarSign,
  TrendingUp,
  Percent,
  Coins,
  Package,
  Droplets,
  BarChart3,
  Users,
  Activity,
  Flag,
  PieChart,
  MapPin,
  Calendar,
  Briefcase,
  Globe,
  FileText,
  Copy,
  ChevronLeft,
} from 'lucide-react'

function formatPrice(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  return value.toFixed(0)
}

function formatPct(value: number | null): string {
  if (value == null) return '--'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export default function TokenDetailPage() {
  const { assetId } = useParams<{ assetId: string }>()
  const navigate = useNavigate()

  const { data: asset } = useQuery({
    queryKey: ['exploreAsset', assetId],
    queryFn: () => getExploreAssetById(assetId!),
    enabled: !!assetId,
  })

  const { data: stats } = useQuery({
    queryKey: ['tokenDetailStats', assetId],
    queryFn: () => getTokenDetailStats(assetId!),
    enabled: !!assetId,
    refetchInterval: 30_000,
  })

  const tokenConfig = asset?.appTokenId ? getAppToken(asset.appTokenId) : null
  const poolAddress = tokenConfig?.dlmmPool?.address

  const { data: marketDepth } = useMarketDepth({
    poolAddress,
    enabled: !!poolAddress,
  })

  const liquidity = marketDepth ? formatTvl(marketDepth) : stats?.liquidity ?? '--'

  const handleCopyAddress = () => {
    if (tokenConfig?.mint) {
      navigator.clipboard.writeText(tokenConfig.mint)
    }
  }

  if (!asset) {
    return (
      <div className="flex flex-col gap-6">
        <button
          onClick={() => navigate('/explorer')}
          className="flex items-center gap-1 text-[13px] text-[#71717a] hover:text-black dark:hover:text-[#d2d2d2] transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Explorer
        </button>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#71717a] text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  const description = tokenConfig?.metadata?.description
  const websiteUrl = tokenConfig?.metadata?.website
  const metadata = asset.metadata

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/explorer')}
        className="flex items-center gap-1 text-[13px] text-[#71717a] hover:text-black dark:hover:text-[#d2d2d2] transition-colors w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Explorer
      </button>

      {/* Main content card */}
      <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#1a1a1b] border-black/15 dark:border-[rgba(210,210,210,0.1)]">
        {/* Desktop Layout */}
        <div className="hidden md:flex gap-10 p-10">
          {/* Left Panel */}
          <div className="flex flex-col gap-6 w-[360px] shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {asset.appTokenId && (
                  <AppTokenIcon token={asset.appTokenId} size={72} className="shrink-0" />
                )}
                <h1 className="text-[32px] font-extrabold leading-normal text-black dark:text-[#d2d2d2]">
                  {asset.name}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {tokenConfig?.mint && (
                  <button
                    onClick={handleCopyAddress}
                    className="text-[#71717a] hover:text-black dark:hover:text-[#d2d2d2] transition-colors"
                    title="Copy token address"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Company info */}
            {metadata && (
              <div className="flex flex-col gap-2">
                {metadata.fullName && (
                  <h2 className="text-[18px] font-bold leading-[1.5] text-black dark:text-[#d2d2d2]">
                    {metadata.fullName}
                  </h2>
                )}
                <div className="flex items-center gap-6 flex-wrap">
                  {metadata.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-[#71717a]" />
                      <span className="text-[12px] text-[#71717a] leading-4">{metadata.location}</span>
                    </div>
                  )}
                  {metadata.founded && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-[#71717a]" />
                      <span className="text-[12px] text-[#71717a] leading-4">{metadata.founded}</span>
                    </div>
                  )}
                  {metadata.industry && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4 text-[#71717a]" />
                      <span className="text-[12px] text-[#71717a] leading-4">{metadata.industry}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About */}
            {description && (
              <div className="flex flex-col gap-2">
                <h3 className="text-[18px] font-bold leading-[1.5] text-black dark:text-[#d2d2d2]">
                  About
                </h3>
                <p className="text-[14px] leading-[1.5] text-black dark:text-[#d2d2d2]">
                  {description}
                </p>
              </div>
            )}

            {/* Social Links */}
            <div className="flex flex-col gap-2">
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm bg-[#f4f4f5] dark:bg-[#3f3f46] hover:opacity-80 transition-opacity"
                >
                  <Globe className="w-4 h-4 text-black dark:text-[#d2d2d2]" />
                  <span className="text-[14px] leading-4 text-black dark:text-[#d2d2d2]">Website</span>
                </a>
              )}
              {metadata?.twitterUrl && (
                <a
                  href={metadata.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm bg-[#f4f4f5] dark:bg-[#3f3f46] hover:opacity-80 transition-opacity"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-[14px] leading-4 text-black dark:text-[#d2d2d2]">Twitter</span>
                </a>
              )}
              {metadata?.meteoraUrl && (
                <a
                  href={metadata.meteoraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm bg-[#f4f4f5] dark:bg-[#3f3f46] hover:opacity-80 transition-opacity"
                >
                  <Droplets className="w-4 h-4 text-black dark:text-[#d2d2d2]" />
                  <span className="text-[14px] leading-4 text-black dark:text-[#d2d2d2]">Meteora</span>
                </a>
              )}
              {metadata?.transparencyUrl && (
                <button
                  onClick={() => navigate(metadata.transparencyUrl!)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm bg-[#f4f4f5] dark:bg-[#3f3f46] hover:opacity-80 transition-opacity"
                >
                  <FileText className="w-4 h-4 text-black dark:text-[#d2d2d2]" />
                  <span className="text-[14px] leading-4 text-black dark:text-[#d2d2d2]">Transparency</span>
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch bg-black/15 dark:bg-[rgba(210,210,210,0.1)]" />

          {/* Right Panel - Stats */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Trade Button */}
            <Button
              onClick={() => navigate('/trade')}
              className="w-full bg-[#d2fb95] hover:bg-[#c5ed88] text-black rounded-lg px-8 py-4 text-[18px] font-bold h-auto"
            >
              <ArrowLeftRight className="w-6 h-6" />
              Trade {asset.name}
            </Button>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<DollarSign className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="Price"
                value={stats?.price ? formatPrice(stats.price) : '--'}
                hasInfo
              />
              <StatCard
                icon={<PieChart className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="Impl Val"
                value={stats?.impliedValuation ?? '--'}
                hasInfo
              />
              <StatCard
                icon={<Flag className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="Auction Price"
                value={stats?.auctionPrice ? formatPrice(stats.auctionPrice) : '--'}
                hasInfo
              />
              <StatCard
                icon={<PieChart className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="Auction Valuation"
                value={stats?.auctionValuation ?? '--'}
                hasInfo
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="30Day %"
                value={
                  stats?.change30dPct != null ? (
                    <span className={stats.change30dPct >= 0 ? 'text-[#06a800]' : 'text-[#d4183d]'}>
                      {formatPct(stats.change30dPct)}
                    </span>
                  ) : (
                    '--'
                  )
                }
                hasInfo
              />
              <StatCard
                icon={<Percent className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="Premium to Auction Price"
                value={
                  stats?.premiumPct != null ? (
                    <span className={stats.premiumPct >= 0 ? 'text-[#06a800]' : 'text-[#d4183d]'}>
                      {formatPct(stats.premiumPct)}
                    </span>
                  ) : (
                    '--'
                  )
                }
                hasInfo
              />
              <StatCard
                icon={<Coins className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="Mkt Cap"
                value={stats?.marketCapFormatted ?? '--'}
                hasInfo
              />
              <StatCard
                icon={<Package className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="Supply"
                value={stats?.supply ?? '--'}
              />
              <StatCard
                icon={<Droplets className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="Liquidity"
                value={liquidity}
                hasInfo
              />
              <StatCard
                icon={<BarChart3 className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="Volume"
                value={stats?.volumeFormatted ?? '--'}
                hasInfo
              />
              <StatCard
                icon={<Users className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="Holders"
                value={stats?.holders ? formatCount(stats.holders) : '--'}
              />
              <StatCard
                icon={<Activity className="w-5 h-5 text-black dark:text-[#d2d2d2]" />}
                label="Txns"
                value={stats?.txns ? formatCount(stats.txns) : '--'}
                hasInfo
              />
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden p-6 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            {asset.appTokenId && (
              <AppTokenIcon token={asset.appTokenId} size={72} className="shrink-0" />
            )}
            <h1 className="text-[32px] font-extrabold leading-normal text-black dark:text-[#d2d2d2]">
              {asset.name}
            </h1>
          </div>

          {/* Company info */}
          {metadata && (
            <div className="flex flex-col gap-2">
              {metadata.fullName && (
                <h2 className="text-[18px] font-bold leading-[1.5] text-black dark:text-[#d2d2d2]">
                  {metadata.fullName}
                </h2>
              )}
              <div className="flex items-center gap-6 flex-wrap">
                {metadata.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#71717a]" />
                    <span className="text-[12px] text-[#71717a] leading-4">{metadata.location}</span>
                  </div>
                )}
                {metadata.founded && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-[#71717a]" />
                    <span className="text-[12px] text-[#71717a] leading-4">{metadata.founded}</span>
                  </div>
                )}
                {metadata.industry && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-[#71717a]" />
                    <span className="text-[12px] text-[#71717a] leading-4">{metadata.industry}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* About + Icons */}
          {description && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-bold leading-[1.5] text-black dark:text-[#d2d2d2]">
                  About
                </h3>
                <div className="flex items-center gap-4">
                  {tokenConfig?.mint && (
                    <button
                      onClick={handleCopyAddress}
                      className="text-[#71717a] hover:text-black dark:hover:text-[#d2d2d2] transition-colors"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[14px] leading-[1.5] text-black dark:text-[#d2d2d2]">
                {description}
              </p>
            </div>
          )}

          {/* Social Links - Horizontal wrap */}
          <div className="flex flex-wrap gap-2 items-center">
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm bg-[#f4f4f5] dark:bg-[#3f3f46] hover:opacity-80 transition-opacity"
              >
                <Globe className="w-4 h-4 text-black dark:text-[#d2d2d2]" />
                <span className="text-[14px] leading-4 text-black dark:text-[#d2d2d2]">Website</span>
              </a>
            )}
            {metadata?.twitterUrl && (
              <a
                href={metadata.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm bg-[#f4f4f5] dark:bg-[#3f3f46] hover:opacity-80 transition-opacity"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="text-[14px] leading-4 text-black dark:text-[#d2d2d2]">Twitter</span>
              </a>
            )}
            {metadata?.meteoraUrl && (
              <a
                href={metadata.meteoraUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm bg-[#f4f4f5] dark:bg-[#3f3f46] hover:opacity-80 transition-opacity"
              >
                <Droplets className="w-4 h-4 text-black dark:text-[#d2d2d2]" />
                <span className="text-[14px] leading-4 text-black dark:text-[#d2d2d2]">Meteora Pool</span>
              </a>
            )}
            {metadata?.transparencyUrl && (
              <button
                onClick={() => navigate(metadata.transparencyUrl!)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm bg-[#f4f4f5] dark:bg-[#3f3f46] hover:opacity-80 transition-opacity"
              >
                <FileText className="w-4 h-4 text-black dark:text-[#d2d2d2]" />
                <span className="text-[14px] leading-4 text-black dark:text-[#d2d2d2]">Transparency</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-black/15 dark:bg-[rgba(210,210,210,0.1)]" />

          {/* Trade Button */}
          <Button
            onClick={() => navigate('/trade')}
            className="w-full bg-[#d2fb95] hover:bg-[#c5ed88] text-black rounded-lg py-4 text-[16px] font-bold h-auto"
          >
            <ArrowLeftRight className="w-5 h-5" />
            Trade {asset.name}
          </Button>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={<DollarSign className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="Price"
              value={stats?.price ? formatPrice(stats.price) : '--'}
              hasInfo
            />
            <StatCard
              icon={<PieChart className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="Impl Val"
              value={stats?.impliedValuation ?? '--'}
              hasInfo
            />
            <StatCard
              icon={<Flag className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="Auction Price"
              value={stats?.auctionPrice ? formatPrice(stats.auctionPrice) : '--'}
              hasInfo
            />
            <StatCard
              icon={<PieChart className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="Auction Valuation"
              value={stats?.auctionValuation ?? '--'}
              hasInfo
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="30Day %"
              value={
                stats?.change30dPct != null ? (
                  <span className={stats.change30dPct >= 0 ? 'text-[#06a800]' : 'text-[#d4183d]'}>
                    {formatPct(stats.change30dPct)}
                  </span>
                ) : (
                  '--'
                )
              }
              hasInfo
            />
            <StatCard
              icon={<Percent className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="Premium to Auction Price"
              value={
                stats?.premiumPct != null ? (
                  <span className={stats.premiumPct >= 0 ? 'text-[#06a800]' : 'text-[#d4183d]'}>
                    {formatPct(stats.premiumPct)}
                  </span>
                ) : (
                  '--'
                )
              }
              hasInfo
            />
            <StatCard
              icon={<Coins className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="Mkt Cap"
              value={stats?.marketCapFormatted ?? '--'}
              hasInfo
            />
            <StatCard
              icon={<Package className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="Supply"
              value={stats?.supply ?? '--'}
            />
            <StatCard
              icon={<Droplets className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="Liquidity"
              value={liquidity}
              hasInfo
            />
            <StatCard
              icon={<Activity className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="Txns"
              value={stats?.txns ? formatCount(stats.txns) : '--'}
              hasInfo
            />
            <StatCard
              icon={<BarChart3 className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="Volume"
              value={stats?.volumeFormatted ?? '--'}
              hasInfo
            />
            <StatCard
              icon={<Users className="w-4 h-4 text-black dark:text-[#d2d2d2]" />}
              label="Holders"
              value={stats?.holders ? formatCount(stats.holders) : '--'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
