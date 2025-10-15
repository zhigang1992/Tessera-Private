import { Address } from 'gill'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { AppModal } from '@/components/app-modal'
import { toast } from 'sonner'
import { CopyCheck } from 'lucide-react'

export function AccountUiModalReceive({ address }: { address: Address }) {
  function handleCopy() {
    const text = address.toString()
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.error('Clipboard not available in this environment')
      return
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast('Address copied to clipboard', {
          icon: <CopyCheck size={16} />,
          description: 'You can now paste it to receive assets.',
        })
      })
      .catch((error) => {
        console.error('Failed to copy address', error)
        toast.error('Failed to copy address')
      })
  }
  return (
    <AppModal title="Receive" submitLabel="Copy Address" submit={handleCopy}>
      <p>Receive assets by sending them to your public key:</p>
      <div className="flex items-center gap-2">
        <AppExplorerLink address={address.toString()} label={address.toString()} />
      </div>
    </AppModal>
  )
}
