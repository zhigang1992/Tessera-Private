import { useState, useCallback, useEffect } from 'react';
import { useWalletUi } from '@wallet-ui/react';
import { apiClient } from '../lib/api-client';
import { toast } from 'sonner';

export function useReferralAuth() {
  const { account, connected, signMessage } = useWalletUi();
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
    if (!account?.address || !signMessage) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setIsAuthenticating(true);
    try {
      // Step 1: Get nonce
      const nonceData = await apiClient.getNonce(account.address);

      // Step 2: Sign the message
      const message = new TextEncoder().encode(nonceData.message);
      const signature = await signMessage(message);

      // Step 3: Verify signature and get session token
      const verifyResponse = await apiClient.verifySignature({
        walletAddress: account.address,
        nonce: nonceData.nonce,
        signature: Buffer.from(signature).toString('base64'),
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
  }, [account?.address, signMessage]);

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
