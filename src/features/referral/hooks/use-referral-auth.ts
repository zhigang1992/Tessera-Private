import { useState, useCallback, useEffect } from 'react';
import { useWalletUi } from '@wallet-ui/react';
import { apiClient } from '../lib/api-client';
import { toast } from 'sonner';

export function useReferralAuth() {
  const { account, connected, wallet } = useWalletUi();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showUrlKeyAlert, setShowUrlKeyAlert] = useState(false);

  // Check if we have a valid session on every render
  const isAuthenticated = Boolean(apiClient.getToken() && apiClient.isTokenValid());
  const sessionToken = apiClient.getToken();

  // Clear auth when wallet disconnects
  useEffect(() => {
    if (!connected) {
      apiClient.setToken(null);
    }
  }, [connected]);

  const authenticate = useCallback(async () => {
    console.log('authenticate called', { account, wallet });

    if (!account?.address) {
      console.error('No account address');
      toast.error('Please connect your wallet first');
      return false;
    }

    // Get the wallet from window.solana or window.phantom
    const standardWallet = (window as { phantom?: { solana?: unknown } }).phantom?.solana || (window as { solana?: unknown }).solana;
    console.log('Using window.solana for signing:', standardWallet);

    if (!standardWallet || typeof (standardWallet as { signMessage?: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array }> }).signMessage !== 'function') {
      console.error('Wallet does not support message signing');
      toast.error('Wallet does not support message signing');
      return false;
    }

    // Check if using URL Key Wallet
    const isUrlKeyWallet = (standardWallet as { isUrlKeyWallet?: boolean }).isUrlKeyWallet;

    if (isUrlKeyWallet) {
      // Show alert dialog for URL key wallet
      return new Promise<boolean>((resolve) => {
        setShowUrlKeyAlert(true);

        const handleConfirm = async () => {
          setShowUrlKeyAlert(false);
          const success = await performAuthentication();
          resolve(success);
        };

        const handleCancel = () => {
          setShowUrlKeyAlert(false);
          resolve(false);
        };

        // Store handlers for the dialog
        (window as any)._urlKeyAlertHandlers = { handleConfirm, handleCancel };
      });
    } else {
      return await performAuthentication();
    }

    async function performAuthentication() {
      setIsAuthenticating(true);
      try {
        // Step 1: Get nonce
        console.log('Getting nonce for', account!.address);
        const nonceData = await apiClient.getNonce(account!.address);
        console.log('Nonce received:', nonceData);

        // Step 2: Sign the message using window.solana
        const message = new TextEncoder().encode(nonceData.message);
        console.log('Signing message with window.solana...');
        const signatureResult = await (standardWallet as any).signMessage(message, 'utf8');
        console.log('Signature result:', signatureResult);
        const signatureBytes = signatureResult.signature;
        console.log('Signature received');

        // Step 3: Verify signature and get session token
        const verifyResponse = await apiClient.verifySignature({
          walletAddress: account!.address,
          nonce: nonceData.nonce,
          signature: Buffer.from(signatureBytes).toString('base64'),
          timestamp: nonceData.issuedAt,
          signatureEncoding: 'base64',
        });

        // Save token with expiration
        apiClient.setToken(verifyResponse.token, verifyResponse.expiresAt);

        toast.success('Authentication successful!');
        return true;
      } catch (error) {
        console.error('Authentication error:', error);
        toast.error(error instanceof Error ? error.message : 'Authentication failed');
        return false;
      } finally {
        setIsAuthenticating(false);
      }
    }
  }, [account, wallet]);

  const logout = useCallback(() => {
    apiClient.setToken(null);
    toast.success('Logged out');
  }, []);

  return {
    isAuthenticated,
    isAuthenticating,
    sessionToken,
    authenticate,
    logout,
    walletAddress: account?.address || null,
    showUrlKeyAlert,
    setShowUrlKeyAlert,
  };
}
