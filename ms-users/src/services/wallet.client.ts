import { signInternalToken } from "../utils/jwt.util";

const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || "http://ms-wallet:3001";
const WALLET_REQUEST_TIMEOUT_MS = 10000; // 10 seconds

interface WalletResponse {
  id: string;
  user_id: string;
  createdAt: string;
}

/**
 * HTTP client for communicating with ms-wallet service
 */
export const walletClient = {
  /**
   * Create a wallet for a user via internal API
   * Includes timeout to prevent hanging requests
   */
  async createWallet(userId: string): Promise<WalletResponse> {
    const token = signInternalToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WALLET_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${WALLET_SERVICE_URL}/internal/wallets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-token": token,
        },
        body: JSON.stringify({ user_id: userId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(`Failed to create wallet: ${error.error || response.statusText}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
