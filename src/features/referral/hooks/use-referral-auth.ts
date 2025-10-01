import { useState, useCallback, useEffect } from 'react';
import { useWalletUi } from '@wallet-ui/react';
import { apiClient } from '../lib/api-client';
import { toast } from 'sonner';

export function useReferralAuth() {
  const { account, connected, wallet } = useWalletUi();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Check if we have a valid session on mount
  useEffect(() => {
    const token = apiClient.getToken();
    if (token) {
      setSessionToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  // Clear auth when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setIsAuthenticated(false);
      setSessionToken(null);
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
    const standardWallet = (window as any).phantom?.solana || (window as any).solana;
    console.log('Using window.solana for signing:', standardWallet);

    if (!standardWallet || typeof standardWallet.signMessage !== 'function') {
      console.error('Wallet does not support message signing');
      toast.error('Wallet does not support message signing');
      return false;
    }

    setIsAuthenticating(true);
    try {
      // Step 1: Get nonce
      console.log('Getting nonce for', account.address);
      const nonceData = await apiClient.getNonce(account.address);
      console.log('Nonce received:', nonceData);

      // Step 2: Sign the message using window.solana
      const message = new TextEncoder().encode(nonceData.message);
      console.log('Signing message with window.solana...');
      const signatureResult = await standardWallet.signMessage(message, 'utf8');
      console.log('Signature result:', signatureResult);
      const signatureBytes = signatureResult.signature;
      console.log('Signature received');

      // Step 3: Verify signature and get session token
      const verifyResponse = await apiClient.verifySignature({
        walletAddress: account.address,
        nonce: nonceData.nonce,
        signature: Buffer.from(signatureBytes).toString('base64'),
        timestamp: nonceData.issuedAt,
        signatureEncoding: 'base64',
      });

      // Save token
      apiClient.setToken(verifyResponse.token);
      setSessionToken(verifyResponse.token);
      setIsAuthenticated(true);

      toast.success('Authentication successful!');
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [account, wallet]);

  const logout = useCallback(() => {
    apiClient.setToken(null);
    setSessionToken(null);
    setIsAuthenticated(false);
    toast.success('Logged out');
  }, []);

  return {
    isAuthenticated,
    isAuthenticating,
    sessionToken,
    authenticate,
    logout,
    walletAddress: account?.address || null,
  };
}
