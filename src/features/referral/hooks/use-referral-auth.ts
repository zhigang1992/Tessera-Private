import { useState, useCallback, useEffect } from 'react';
import { useSignMessage, useWalletUi } from '@wallet-ui/react';
import { SolanaSignMessage } from '@solana/wallet-standard-features';
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

  const signMessage = useSignMessage(account!);

  const authenticate = useCallback(async () => {
    console.log('authenticate called', { account, wallet });

    if (!account?.address) {
      console.error('No account address');
      toast.error('Please connect your wallet first');
      return false;
    }

    if (!account.features.includes(SolanaSignMessage)) {
      console.error('Wallet does not support message signing');
      toast.error('Wallet does not support message signing');
      return false;
    }

    const isUrlKeyWallet = wallet?.name === 'URL Key Wallet';

    const performAuth = () => performAuthentication();

    if (isUrlKeyWallet) {
      return new Promise<boolean>((resolve) => {
        setShowUrlKeyAlert(true);

        const handleConfirm = async () => {
          setShowUrlKeyAlert(false);
          const success = await performAuth();
          resolve(success);
        };

        const handleCancel = () => {
          setShowUrlKeyAlert(false);
          resolve(false);
        };

        (window as any)._urlKeyAlertHandlers = { handleConfirm, handleCancel };
      });
    }

    return await performAuth();

    async function performAuthentication() {
      setIsAuthenticating(true);
      try {
        console.log('Getting nonce for', account!.address);
        const nonceData = await apiClient.getNonce(account!.address);
        console.log('Nonce received:', nonceData);

        const message = new TextEncoder().encode(nonceData.message);
        console.log('Signing message with connected wallet...');
        const { signature } = await signMessage({ message });
        console.log('Signature result received');
        const signatureBytes = signature;
        console.log('Signature received');

        const verifyResponse = await apiClient.verifySignature({
          walletAddress: account!.address,
          nonce: nonceData.nonce,
          signature: Buffer.from(signatureBytes).toString('base64'),
          timestamp: nonceData.issuedAt,
          signatureEncoding: 'base64',
        });

        apiClient.setToken(verifyResponse.token, verifyResponse.expiresAt);
        return true;
      } catch (error) {
        console.error('Authentication error:', error);
        toast.error(error instanceof Error ? error.message : 'Authentication failed');
        return false;
      } finally {
        setIsAuthenticating(false);
      }
    }
  }, [account, wallet, signMessage]);

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
