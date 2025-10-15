const API_BASE = import.meta.env.VITE_API_BASE || '';

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  detail?: string;
};

// Auth types
export type NonceResponse = {
  nonce: string;
  walletAddress: string;
  issuedAt: string;
  expiresAt: string;
  ttlSeconds: number;
  message: string;
};

export type VerifyResponse = {
  token: string;
  tokenType: string;
  walletAddress: string;
  issuedAt: string;
  expiresAt: string;
  ttlSeconds: number;
};

// Referral types
export type ReferralCode = {
  id: number;
  codeSlug: string;
  status: string;
  activeLayer: number;
  walletAddress: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TraderMetrics = {
  tradingVolume: number;
  feeRebateTotal: number;
  tradingPoints: number;
  feeDiscountPct: number;
  snapshotAt: string;
};

export type TraderData = {
  walletAddress: string;
  metrics: TraderMetrics;
  referral: {
    referrerCode: string;
    referrerWallet: string;
    boundAt: string;
    lastModified: string;
  } | null;
};

export type AffiliateData = {
  walletAddress: string;
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  metrics: {
    rebatesTotal: number;
    referralPoints: number;
    snapshotAt: string;
  };
  referralCodes: ReferralCode[];
  tree: {
    l1TraderCount: number;
    l2TraderCount: number;
    l3TraderCount: number;
    totalTraderCount: number;
    l1Traders: string[];
    l2Traders: string[];
    l3Traders: string[];
  };
};

// API Client
export class ReferralApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
    // Try to load token from localStorage with validation
    if (typeof window !== 'undefined') {
      this.loadAndValidateToken();
    }
  }

  private loadAndValidateToken() {
    const token = localStorage.getItem('referral_session_token');
    const expiresAt = localStorage.getItem('referral_session_expires_at');

    if (token && expiresAt) {
      const expirationTime = new Date(expiresAt).getTime();
      const now = Date.now();

      if (expirationTime > now) {
        // Token is still valid
        this.token = token;
      } else {
        // Token has expired, clean it up
        localStorage.removeItem('referral_session_token');
        localStorage.removeItem('referral_session_expires_at');
        this.token = null;
      }
    } else if (token) {
      // Legacy token without expiration info, remove it
      localStorage.removeItem('referral_session_token');
      this.token = null;
    }
  }

  setToken(token: string | null, expiresAt?: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('referral_session_token', token);
        if (expiresAt) {
          localStorage.setItem('referral_session_expires_at', expiresAt);
        }
      } else {
        localStorage.removeItem('referral_session_token');
        localStorage.removeItem('referral_session_expires_at');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isTokenValid(): boolean {
    if (!this.token) return false;

    if (typeof window !== 'undefined') {
      const expiresAt = localStorage.getItem('referral_session_expires_at');
      if (expiresAt) {
        const expirationTime = new Date(expiresAt).getTime();
        return expirationTime > Date.now();
      }
    }

    return false; // If no expiration info, consider invalid
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    // Validate token before using it
    if (this.token && !this.isTokenValid()) {
      this.setToken(null); // Clear expired token
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 errors by clearing expired tokens
      if (response.status === 401) {
        this.setToken(null);
      }
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async getNonce(walletAddress: string): Promise<NonceResponse> {
    return this.request(`/api/auth/nonce?wallet=${encodeURIComponent(walletAddress)}`);
  }

  async verifySignature(payload: {
    walletAddress: string;
    nonce: string;
    signature: string;
    timestamp: string;
    signatureEncoding?: 'base64' | 'base58';
  }): Promise<VerifyResponse> {
    return this.request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Referral code endpoints
  async createReferralCode(payload: {
    codeSlug?: string;
    activeLayer?: number;
  }): Promise<{ code: ReferralCode }> {
    return this.request('/api/referral/code', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Trader endpoints
  async getTraderData(): Promise<TraderData> {
    return this.request('/api/referral/trader');
  }

  async bindToReferralCode(referralCode: string): Promise<{ success: boolean; binding: { traderWallet: string; referrerCode: string; referrerWallet: string; boundAt: string } }> {
    return this.request('/api/referral/trader/bind', {
      method: 'POST',
      body: JSON.stringify({ referralCode }),
    });
  }

  // Affiliate endpoints
  async getAffiliateData(): Promise<AffiliateData> {
    return this.request('/api/referral/affiliate');
  }

  async getAffiliateDataPublic(walletAddress: string): Promise<AffiliateData> {
    return this.request(`/api/referral/affiliate?wallet=${encodeURIComponent(walletAddress)}`);
  }

}

// Export singleton instance
export const apiClient = new ReferralApiClient();
