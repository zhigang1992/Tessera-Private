import { useState, useCallback, useEffect } from 'react';
import { useWalletUi } from '@wallet-ui/react';
import { getWalletAccountFeature } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as getWalletAccountForUiWalletAccountUnsafe } from '@wallet-standard/ui-registry';
import { SolanaSignMessage, type SolanaSignMessageFeature } from '@solana/wallet-standard-features';
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

    let signMessageFeature: SolanaSignMessageFeature[typeof SolanaSignMessage] | undefined;
    let standardAccount: ReturnType<typeof getWalletAccountForUiWalletAccountUnsafe> | undefined;

    try {
      signMessageFeature = getWalletAccountFeature(account, SolanaSignMessage) as SolanaSignMessageFeature[typeof SolanaSignMessage];
      standardAccount = getWalletAccountForUiWalletAccountUnsafe(account);
    } catch (error) {
      console.error('Wallet does not support message signing', error);
      toast.error('Wallet does not support message signing');
      return false;
    }

    if (!signMessageFeature || !standardAccount) {
      return false;
    }

    const isUrlKeyWallet = wallet?.name === 'URL Key Wallet';

    const performAuth = () => performAuthentication(signMessageFeature, standardAccount);

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

    async function performAuthentication(
      feature: SolanaSignMessageFeature[typeof SolanaSignMessage],
      selectedAccount: ReturnType<typeof getWalletAccountForUiWalletAccountUnsafe>,
    ) {
      setIsAuthenticating(true);
      try {
        console.log('Getting nonce for', account!.address);
        const nonceData = await apiClient.getNonce(account!.address);
        console.log('Nonce received:', nonceData);

        const message = new TextEncoder().encode(nonceData.message);
        console.log('Signing message with connected wallet...');
        const [signatureResult] = await feature.signMessage({ account: selectedAccount, message });

        if (!signatureResult?.signature) {
          throw new Error('Wallet did not return a signature');
        }

        console.log('Signature result:', signatureResult);
        const signatureBytes = signatureResult.signature;
        console.log('Signature received');

        const verifyResponse = await apiClient.verifySignature({
          walletAddress: account!.address,
          nonce: nonceData.nonce,
          signature: Buffer.from(signatureBytes).toString('base64'),
          timestamp: nonceData.issuedAt,
          signatureEncoding: 'base64',
        });

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
