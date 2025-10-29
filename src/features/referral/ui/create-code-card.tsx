import { FormEvent, useMemo, useState } from 'react'
import { useAffiliateData, useCreateReferralCode } from '../hooks/use-referral-queries'
import { useReferralAuth } from '../hooks/use-referral-auth'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Plus, Share2, Loader2, Download, Send, Twitter, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { UrlKeyAlertDialog } from './url-key-alert-dialog'
import { getUrlKeyAlertHandlers } from '../lib/url-key-alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ReferralCode } from '../lib/api-client'
import { ReferralImagePreview } from './referral-image-preview'

const SHARE_IMAGE_BASE = import.meta.env.VITE_REFERRAL_SHARE_IMAGE_BASE || '/api/referral/image'

export default function CreateCodeCard() {
  const { connected, publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()
  const { data: affiliateData, isLoading } = useAffiliateData(connected, walletAddress)
  const createCodeMutation = useCreateReferralCode()
  const { isAuthenticated, isAuthenticating, authenticate, showUrlKeyAlert, setShowUrlKeyAlert } = useReferralAuth()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [customCode, setCustomCode] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [shareDialogCode, setShareDialogCode] = useState<ReferralCode | null>(null)
  const [selectedBackground, setSelectedBackground] = useState(1)

  const trimmedCustomCode = useMemo(() => customCode.trim(), [customCode])
  const normalizedCustomCode = useMemo(() => trimmedCustomCode.toUpperCase(), [trimmedCustomCode])
  const isCustomCodeProvided = trimmedCustomCode.length > 0
  const isCustomCodeLengthValid = !isCustomCodeProvided ||
    (trimmedCustomCode.length >= 6 && trimmedCustomCode.length <= 12)
  const isCreatePending = createCodeMutation.isPending || isAuthenticating
  const isCreateDisabled = isCreatePending || (isCustomCodeProvided && !isCustomCodeLengthValid)
  const isShareDialogOpen = shareDialogCode !== null

  const shareLink = useMemo(() => {
    if (!shareDialogCode) {
      return ''
    }

    if (typeof window === 'undefined') {
      return ''
    }

    // Use /s endpoint for social media sharing with OG tags
    return `${window.location.origin}/s?code=${shareDialogCode.codeSlug}&bg=${selectedBackground}`
  }, [shareDialogCode, selectedBackground])

  const shareImageUrl = useMemo(() => {
    if (!shareDialogCode) {
      return ''
    }

    const base = SHARE_IMAGE_BASE.endsWith('/') ? SHARE_IMAGE_BASE.slice(0, -1) : SHARE_IMAGE_BASE
    return `${base}?code=${encodeURIComponent(shareDialogCode.codeSlug)}&bg=${selectedBackground}`
  }, [shareDialogCode, selectedBackground])

  const handleUrlKeyConfirm = async () => {
    const handlers = getUrlKeyAlertHandlers()
    if (handlers?.handleConfirm) {
      await handlers.handleConfirm()
    }
  }

  const handleUrlKeyCancel = () => {
    const handlers = getUrlKeyAlertHandlers()
    if (handlers?.handleCancel) {
      handlers.handleCancel()
    }
  }

  const referralCodes = affiliateData?.referralCodes || []
  const hasNoCodes = referralCodes.length === 0

  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateDialogOpen(open)
    if (!open && !isCreatePending) {
      setCustomCode('')
      setFormError(null)
    }
  }

  const handleShareDialogOpenChange = (open: boolean) => {
    if (!open) {
      setShareDialogCode(null)
      setSelectedBackground(1)
    }
  }

  const handlePreviousBackground = () => {
    setSelectedBackground((prev) => (prev > 1 ? prev - 1 : 6))
  }

  const handleNextBackground = () => {
    setSelectedBackground((prev) => (prev < 6 ? prev + 1 : 1))
  }

  const handleSubmitCreateCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (isCreateDisabled) {
      return
    }

    // If not authenticated, require sign message first
    if (!isAuthenticated) {
      const signedIn = await authenticate()
      if (!signedIn) {
        return
      }
    }

    if (isCustomCodeProvided && !isCustomCodeLengthValid) {
      const validationMessage = 'Custom codes must be between 6 and 12 characters'
      setFormError(validationMessage)
      toast.error(validationMessage)
      return
    }

    const payload = isCustomCodeProvided ? { codeSlug: normalizedCustomCode } : {}

    setFormError(null)

    try {
      await createCodeMutation.mutateAsync(payload)
      setCustomCode('')
      setIsCreateDialogOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create referral code'
      setFormError(message)
      console.error('Failed to create referral code', error)
    }
  }

  const copyToClipboard = async (text: string, successMessage = 'Copied to clipboard!') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(successMessage)
    } catch (error) {
      console.error('Failed to copy to clipboard', error)
      toast.error('Unable to copy to clipboard')
    }
  }

  const openShareDialog = (code: ReferralCode) => {
    setShareDialogCode(code)
  }

  const handleCopyShareCode = () => {
    if (!shareDialogCode) return
    void copyToClipboard(shareDialogCode.codeSlug, 'Referral code copied!')
  }

  const handleCopyShareLink = () => {
    if (!shareLink) {
      toast.error('Referral link unavailable')
      return
    }
    void copyToClipboard(shareLink, 'Referral link copied!')
  }

  const handleDownloadShareImage = async () => {
    if (!shareDialogCode || !shareImageUrl) {
      toast.error('Share image unavailable')
      return
    }

    try {
      const response = await fetch(shareImageUrl)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${shareDialogCode.codeSlug}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Share image downloaded!')
    } catch (error) {
      console.error('Failed to download share image', error)
      toast.error('Unable to download share image')
    }
  }

  const handleShareTelegram = () => {
    if (!shareDialogCode || !shareLink) {
      toast.error('Referral link unavailable')
      return
    }

    const text = `Own a piece of the future, before everyone else; on-chain without KYC`
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`
    window.open(telegramUrl, '_blank', 'noopener,noreferrer')
  }

  const handleShareTwitter = () => {
    if (!shareDialogCode || !shareLink) {
      toast.error('Referral link unavailable')
      return
    }

    // Twitter will automatically fetch the image from OG tags at the /s endpoint
    const text = `Join me on owning a piece of the future, before everyone else; on-chain without KYC via @Tessera_PE`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-black dark:text-white">My referral codes</h2>
        <Card className="rounded-[24px] border border-[#E4E4E7] bg-[#F7F7FA] shadow-none dark:border-[#27272A] dark:bg-[#111111]">
          <CardContent className="p-6">
            <p className="text-black/50 dark:text-white/50">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Section header with create button */}
        <div className="flex items-center justify-between gap-1">
          <h2 className="text-lg font-semibold text-black dark:text-white">My referral codes</h2>
          {!hasNoCodes && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={isCreatePending}
              size="sm"
              className="flex h-10 items-center gap-2 rounded-lg bg-black px-4 text-xs font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              {isCreatePending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              {isCreatePending ? 'Creating...' : 'Create new code'}
            </Button>
          )}
        </div>

        <Card className="rounded-[24px] border border-[#E4E4E7] bg-[#F7F7FA] shadow-none dark:border-[#27272A] dark:bg-[#111111]">
          <CardContent className="flex flex-col gap-5 p-5">
            {hasNoCodes ? (
              /* Empty state */
              <div className="flex min-h-[200px] items-center justify-center rounded-[16px] border border-dashed border-[#D4D4D8] bg-white px-6 py-10 text-center dark:border-[#3F3F46] dark:bg-[#1F1F23]">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  disabled={isCreatePending}
                  size="sm"
                  className="flex h-10 items-center gap-2 rounded-lg bg-black px-6 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  {isCreatePending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                  {isCreatePending ? 'Creating...' : 'Create new code to earn Rewards'}
                </Button>
              </div>
            ) : (
              /* Filled state - Table of codes */
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2">
                  <div className="flex-1">
                    <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#6B7280] dark:text-[#A1A1AA]">
                      Referral Code
                    </span>
                  </div>
                  <div className="flex flex-1 flex-row justify-center">
                    <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#6B7280] dark:text-[#A1A1AA]">
                      Traders Referred
                    </span>
                  </div>
                  <div className="w-[88px]" aria-hidden />
                </div>

                <div className="mx-2 h-px bg-[#E2E4E9] dark:bg-[#27272A]" />

                <div className="flex flex-col gap-2">
                  {referralCodes.map((code, index) => (
                    <div
                      key={code.id}
                      className={`flex items-center gap-3 rounded-[16px] px-3 py-4 transition-colors ${
                        index % 2 === 0
                          ? 'bg-white dark:bg-[#1F1F23]'
                          : 'bg-[#F1F2F6] dark:bg-[#131318]'
                      }`}
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <span className="text-sm font-semibold uppercase tracking-[0.08em] text-[#111827] dark:text-[#E4E4E7]">
                          {code.codeSlug}
                        </span>
                        <button
                          onClick={() => void copyToClipboard(code.codeSlug)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E5E7EB] text-[#4B5563] transition hover:bg-[#D1D5DB] dark:bg-[#27272A] dark:text-[#D1D5DB]"
                          title="Copy code"
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <div className="flex flex-1 flex-row justify-center">
                        <span className="text-sm font-medium text-[#111827] dark:text-white">
                          {code.referredTraderCount ?? 0}
                        </span>
                      </div>
                      <div className="flex w-[88px] justify-end">
                        <Button
                          size="sm"
                          onClick={() => openShareDialog(code)}
                          className="flex h-9 items-center gap-2 rounded-lg bg-black px-4 text-xs font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination (if needed in the future) */}
                {referralCodes.length > 10 && (
                  <div className="flex items-center justify-center gap-[5px] mt-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-10 w-10 rounded-full bg-black p-0 text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                      1
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-10 w-10 rounded-full bg-[rgba(212,212,216,0.4)] p-0 text-black hover:bg-[rgba(212,212,216,0.6)] dark:bg-[rgba(255,255,255,0.1)] dark:text-white dark:hover:bg-[rgba(255,255,255,0.18)]"
                    >
                      2
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <UrlKeyAlertDialog
        open={showUrlKeyAlert}
        onOpenChange={setShowUrlKeyAlert}
        onConfirm={handleUrlKeyConfirm}
        onCancel={handleUrlKeyCancel}
      />

      <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle>Create referral code</DialogTitle>
            <DialogDescription>
              Enter a custom code between 6 and 12 characters or leave the field blank to generate one automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCreateCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-left">
              <Label htmlFor="custom-referral-code">Custom code</Label>
              <Input
                id="custom-referral-code"
                value={customCode}
                onChange={(event) => {
                  setCustomCode(event.target.value)
                  if (formError) {
                    setFormError(null)
                  }
                }}
                placeholder="TESSERA1"
                maxLength={12}
                aria-invalid={isCustomCodeProvided && !isCustomCodeLengthValid}
                aria-describedby={
                  isCustomCodeProvided && !isCustomCodeLengthValid
                    ? 'custom-referral-code-error'
                    : 'custom-referral-code-helper'
                }
                disabled={isCreatePending}
              />
              <p
                id="custom-referral-code-helper"
                className="text-xs text-muted-foreground"
              >
                Leave blank to generate a random code.
              </p>
              {isCustomCodeProvided && !isCustomCodeLengthValid && (
                <p
                  id="custom-referral-code-error"
                  className="text-xs font-medium text-destructive"
                >
                  Custom codes must be between 6 and 12 characters.
                </p>
              )}
              {formError && !(isCustomCodeProvided && !isCustomCodeLengthValid) && (
                <p
                  className="text-xs font-medium text-destructive"
                  role="alert"
                >
                  {formError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
                disabled={isCreatePending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreateDisabled}>
                {isCreatePending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCreatePending ? 'Creating...' : 'Create code'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isShareDialogOpen} onOpenChange={handleShareDialogOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle>Share</DialogTitle>
            <DialogDescription>
              Invite users and earn points by sharing your referral code.
            </DialogDescription>
          </DialogHeader>

          {shareDialogCode && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <ReferralImagePreview
                  imageUrl={shareImageUrl}
                  codeSlug={shareDialogCode.codeSlug}
                />

                {/* Background carousel navigation */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handlePreviousBackground}
                    className="h-8 w-8 rounded-full bg-[#F4F4F5] hover:bg-[#E4E4E7] dark:bg-[#27272A] dark:hover:bg-[#3F3F46]"
                    aria-label="Previous background"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  {/* Dot indicators */}
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 6].map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setSelectedBackground(bg)}
                        className={`h-2 w-2 rounded-full transition-all ${
                          selectedBackground === bg
                            ? 'bg-black dark:bg-white w-6'
                            : 'bg-[#D4D4D8] dark:bg-[#52525B]'
                        }`}
                        aria-label={`Select background ${bg}`}
                      />
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleNextBackground}
                    className="h-8 w-8 rounded-full bg-[#F4F4F5] hover:bg-[#E4E4E7] dark:bg-[#27272A] dark:hover:bg-[#3F3F46]"
                    aria-label="Next background"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 text-left">
                  <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Referral code
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={shareDialogCode.codeSlug} className="font-semibold uppercase" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyShareCode}
                      className="h-10 w-10 rounded-xl"
                      aria-label="Copy referral code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Referral link
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={shareLink} className="font-medium" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyShareLink}
                      className="h-10 w-10 rounded-xl"
                      aria-label="Copy referral link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCopyShareLink}
                  className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-[#E4E4E7] bg-white text-xs font-semibold text-[#111827] hover:bg-[#F4F4F5] dark:border-[#27272A] dark:bg-[#111111] dark:text-white dark:hover:bg-[#1F1F23]"
                >
                  <Copy className="h-5 w-5" />
                  Copy URL
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDownloadShareImage}
                  className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-[#E4E4E7] bg-white text-xs font-semibold text-[#111827] hover:bg-[#F4F4F5] dark:border-[#27272A] dark:bg-[#111111] dark:text-white dark:hover:bg-[#1F1F23]"
                >
                  <Download className="h-5 w-5" />
                  Download
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleShareTelegram}
                  className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-[#E4E4E7] bg-white text-xs font-semibold text-[#111827] hover:bg-[#F4F4F5] dark:border-[#27272A] dark:bg-[#111111] dark:text-white dark:hover:bg-[#1F1F23]"
                >
                  <Send className="h-5 w-5" />
                  Telegram
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleShareTwitter}
                  className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-[#E4E4E7] bg-white text-xs font-semibold text-[#111827] hover:bg-[#F4F4F5] dark:border-[#27272A] dark:bg-[#111111] dark:text-white dark:hover:bg-[#1F1F23]"
                >
                  <Twitter className="h-5 w-5" />
                  X
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
