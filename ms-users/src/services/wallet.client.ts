import { signInternalToken } from "../utils/jwt.util";
import { CircuitBreaker, retry } from "../utils/resilience.util";

const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || "http://ms-wallet:3001";
const WALLET_REQUEST_TIMEOUT_MS = 10000; // 10 seconds

interface WalletResponse {
  id: string;
  user_id: string;
  createdAt: string;
}

// Initialize Circuit Breaker for Wallet Service
const walletCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 20000, // 20 seconds
});

walletCircuitBreaker.on("open", () => console.warn("Wallet Service Circuit Breaker OPENED"));
walletCircuitBreaker.on("close", () => console.info("Wallet Service Circuit Breaker CLOSED"));

/**
 * HTTP client for communicating with ms-wallet service
 */
export const walletClient = {
  /**
   * Create a wallet for a user via internal API
   * Includes timeout to prevent hanging requests, retries, and circuit breaker.
   */
  async createWallet(userId: string): Promise<WalletResponse> {
    const token = signInternalToken();

    // Define the request function
    const requestFn = async () => {
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
          // If 5xx error, throw to trigger retry
          if (response.status >= 500) {
            throw new Error(`Server error: ${response.statusText}`);
          }
          // If 4xx error (except maybe 429), don't retry, just throw
          const error = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(`Failed to create wallet: ${error.error || response.statusText}`);
        }

        return await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Execute with Circuit Breaker and Retry
    try {
      return await walletCircuitBreaker.exec(() =>
        retry(requestFn, 3, 500, 2)
      );
    } catch (error) {
      // Re-throw or handle specific errors
      throw error;
    }
  },
};
