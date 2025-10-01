const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8788';

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
  };
};

export type LeaderboardEntry = {
  rank: number;
  walletAddress: string;
  displayName: string | null;
  referralPoints: number;
  rebatesTotal: number;
  traderCounts: {
    l1: number;
    l2: number;
    l3: number;
    total: number;
  };
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  snapshotAt: string;
  cached: boolean;
};

// API Client
export class ReferralApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
    // Try to load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('referral_session_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('referral_session_token', token);
      } else {
        localStorage.removeItem('referral_session_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
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

  async bindToReferralCode(referralCode: string): Promise<{ success: boolean; binding: any }> {
    return this.request('/api/referral/trader/bind', {
      method: 'POST',
      body: JSON.stringify({ referralCode }),
    });
  }

  // Affiliate endpoints
  async getAffiliateData(): Promise<AffiliateData> {
    return this.request('/api/referral/affiliate');
  }

  // Leaderboard endpoints
  async getLeaderboard(limit = 100): Promise<LeaderboardResponse> {
    return this.request(`/api/referral/leaderboard?limit=${limit}`);
  }

  // Email verification endpoints
  async requestEmailVerification(email: string): Promise<{ success: boolean; verificationLink: string }> {
    return this.request('/api/referral/email/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/referral/email/verify?token=${encodeURIComponent(token)}`);
  }
}

// Export singleton instance
export const apiClient = new ReferralApiClient();
