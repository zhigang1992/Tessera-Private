import { Address } from 'gill'
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { toastTx } from '@/components/toast-tx'
import { useSolana } from '@/components/solana/use-solana'
import { useInvalidateGetBalanceQuery } from './use-invalidate-get-balance-query'
import { useInvalidateGetSignaturesQuery } from './use-invalidate-get-signatures-query'

export function useTransferSolMutation({ address }: { address: Address }) {
  const { connection, publicKey, sendTransaction } = useSolana()
  const invalidateBalanceQuery = useInvalidateGetBalanceQuery({ address })
  const invalidateSignaturesQuery = useInvalidateGetSignaturesQuery({ address })

  return useMutation({
    mutationFn: async (input: { destination: Address; amount: number }) => {
      if (!publicKey) {
        throw new Error('Wallet not connected')
      }

      try {
        const destination = new PublicKey(input.destination.toString())
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: destination,
            lamports: Math.round(input.amount * LAMPORTS_PER_SOL),
          }),
        )

        const signature = await sendTransaction(transaction, connection, {
          preflightCommitment: 'confirmed',
        })

        await connection.confirmTransaction(signature, 'confirmed')

        return signature
      } catch (error) {
        console.error('Transaction failed', error)
        throw error
      }
    },
    onSuccess: async (tx) => {
      if (tx) {
        toastTx(tx)
      }
      await Promise.all([invalidateBalanceQuery(), invalidateSignaturesQuery()])
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`)
    },
  })
}
