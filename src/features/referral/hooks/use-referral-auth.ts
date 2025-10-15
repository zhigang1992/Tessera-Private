import { useCallback, useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import type { MessageSignerWalletAdapterProps } from '@solana/wallet-adapter-base'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/api-client'
import { toast } from 'sonner'
import { setUrlKeyAlertHandlers } from '../lib/url-key-alert'
import { referralKeys } from './use-referral-queries'

export function useReferralAuth() {
  const { publicKey, connected, wallet, signMessage: walletSignMessage } = useWallet()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [showUrlKeyAlert, setShowUrlKeyAlert] = useState(false)
  const queryClient = useQueryClient()

  // Check if we have a valid session on every render
  const isAuthenticated = Boolean(apiClient.getToken() && apiClient.isTokenValid())
  const sessionToken = apiClient.getToken()

  const walletAddress = publicKey?.toBase58() ?? null

  // Clear auth when wallet disconnects
  useEffect(() => {
    if (!connected) {
      apiClient.setToken(null)
      queryClient.resetQueries({ queryKey: referralKeys.all })
    }
  }, [connected, queryClient])

  useEffect(() => {
    const sessionWalletAddress = apiClient.getSessionWalletAddress()
    const hasToken = Boolean(apiClient.getToken())

    if (!walletAddress) {
      if (hasToken) {
        apiClient.setToken(null)
        queryClient.resetQueries({ queryKey: referralKeys.all })
      }
      return
    }

    if (!hasToken) {
      return
    }

    if (!sessionWalletAddress || sessionWalletAddress !== walletAddress) {
      apiClient.setToken(null)
      queryClient.resetQueries({ queryKey: referralKeys.all })
    }
  }, [walletAddress, queryClient])

  const authenticate = useCallback(async () => {
    const adapterName = wallet?.adapter?.name
    console.log('authenticate called', { walletAddress, wallet: adapterName })

    if (!walletAddress) {
      console.error('No account address')
      toast.error('Please connect your wallet first')
      return false
    }

    const signMessage = walletSignMessage
    if (!signMessage) {
      console.error('Wallet does not support message signing')
      toast.error('Wallet does not support message signing')
      return false
    }

    const isUrlKeyWallet = adapterName === 'URL Key Wallet'

    const performAuth = () => performAuthentication(walletAddress, signMessage)

    if (isUrlKeyWallet) {
      return new Promise<boolean>((resolve) => {
        setShowUrlKeyAlert(true)

        const handleConfirm = async () => {
          setShowUrlKeyAlert(false)
          setUrlKeyAlertHandlers(undefined)
          const success = await performAuth()
          resolve(success)
        }

        const handleCancel = () => {
          setShowUrlKeyAlert(false)
          setUrlKeyAlertHandlers(undefined)
          resolve(false)
        }

        setUrlKeyAlertHandlers({ handleConfirm, handleCancel })
      })
    }

    return await performAuth()

    async function performAuthentication(
      address: string,
      signMessageFn: MessageSignerWalletAdapterProps['signMessage'],
    ) {
      setIsAuthenticating(true)
      try {
        console.log('Getting nonce for', address)
        const nonceData = await apiClient.getNonce(address)
        console.log('Nonce received:', nonceData)

        const message = new TextEncoder().encode(nonceData.message)
        console.log('Signing message with connected wallet...')
        const signatureBytes = await signMessageFn(message)
        console.log('Signature received')

        const verifyResponse = await apiClient.verifySignature({
          walletAddress: address,
          nonce: nonceData.nonce,
          signature: Buffer.from(signatureBytes).toString('base64'),
          timestamp: nonceData.issuedAt,
          signatureEncoding: 'base64',
        })

        apiClient.setToken(verifyResponse.token, verifyResponse.expiresAt, verifyResponse.walletAddress)
        return true
      } catch (error) {
        console.error('Authentication error:', error)
        toast.error(error instanceof Error ? error.message : 'Authentication failed')
        return false
      } finally {
        setIsAuthenticating(false)
      }
    }
  }, [walletAddress, wallet, walletSignMessage])

  const logout = useCallback(() => {
    apiClient.setToken(null)
    toast.success('Logged out')
  }, [])

  return {
    isAuthenticated,
    isAuthenticating,
    sessionToken,
    authenticate,
    logout,
    walletAddress,
    showUrlKeyAlert,
    setShowUrlKeyAlert,
  }
}
