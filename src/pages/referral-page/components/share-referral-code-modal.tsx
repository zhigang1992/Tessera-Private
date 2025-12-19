import { useState, useMemo, useCallback } from 'react'
import { Copy, Download, Send, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ReferralImagePreview } from '@/features/referral/ui/referral-image-preview'
import {
  getShareLink,
  getShareImageUrl,
  shareOnTwitter,
  shareOnTelegram,
  downloadShareImage,
  copyToClipboard,
} from '../utils/share'

interface ShareReferralCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codeSlug: string | null
}

export function ShareReferralCodeModal({ open, onOpenChange, codeSlug }: ShareReferralCodeModalProps) {
  const [selectedBackground, setSelectedBackground] = useState(1)

  const shareLink = useMemo(() => {
    if (!codeSlug) return ''
    return getShareLink(codeSlug, selectedBackground)
  }, [codeSlug, selectedBackground])

  const shareImageUrl = useMemo(() => {
    if (!codeSlug) return ''
    return getShareImageUrl(codeSlug, selectedBackground)
  }, [codeSlug, selectedBackground])

  const handlePreviousBackground = useCallback(() => {
    setSelectedBackground((prev) => (prev > 1 ? prev - 1 : 6))
  }, [])

  const handleNextBackground = useCallback(() => {
    setSelectedBackground((prev) => (prev < 6 ? prev + 1 : 1))
  }, [])

  const handleCopyShareCode = useCallback(async () => {
    if (!codeSlug) return
    const success = await copyToClipboard(codeSlug)
    if (success) {
      toast.success('Referral code copied!')
    } else {
      toast.error('Unable to copy to clipboard')
    }
  }, [codeSlug])

  const handleCopyShareLink = useCallback(async () => {
    if (!shareLink) {
      toast.error('Referral link unavailable')
      return
    }
    const success = await copyToClipboard(shareLink)
    if (success) {
      toast.success('Referral link copied!')
    } else {
      toast.error('Unable to copy to clipboard')
    }
  }, [shareLink])

  const handleDownloadShareImage = useCallback(async () => {
    if (!codeSlug) {
      toast.error('Share image unavailable')
      return
    }
    const success = await downloadShareImage(codeSlug, selectedBackground)
    if (success) {
      toast.success('Share image downloaded!')
    } else {
      toast.error('Unable to download share image')
    }
  }, [codeSlug, selectedBackground])

  const handleShareTelegram = useCallback(() => {
    if (!codeSlug) {
      toast.error('Referral link unavailable')
      return
    }
    shareOnTelegram(codeSlug, selectedBackground)
  }, [codeSlug, selectedBackground])

  const handleShareTwitter = useCallback(() => {
    if (!codeSlug) {
      toast.error('Referral link unavailable')
      return
    }
    shareOnTwitter(codeSlug, selectedBackground)
  }, [codeSlug, selectedBackground])

  if (!codeSlug) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="gap-1 text-left">
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>Invite users and earn points by sharing your referral code.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <ReferralImagePreview imageUrl={shareImageUrl} codeSlug={codeSlug} />

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
                      selectedBackground === bg ? 'bg-black dark:bg-white w-6' : 'bg-[#D4D4D8] dark:bg-[#52525B]'
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
                <Input readOnly value={codeSlug} className="font-semibold uppercase" />
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
              <svg width="16" height="15" viewBox="0 0 21 20" className="fill-current">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M17.5739 0L11.6749 6.71331L6.96349 0H0.132941L7.8777 11.0353L0 20H2.9381L9.18215 12.8939L14.1695 20H21L12.9796 8.57219L20.5118 0H17.5739ZM15.4593 17.8844L10.5532 11.0141L9.71346 9.83769L4.23962 2.17192H5.65923L10.3573 8.75137L11.111 9.80694L16.8789 17.8844H15.4593ZM10.0768 11.1605L3.32526 1.70549L9.32304 10.1049L10.0768 11.1605Z"
                />
              </svg>
              X
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
