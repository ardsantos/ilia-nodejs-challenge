import { EventEmitter } from "events";

interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeout: number; // in ms
}

enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN",
}

export class CircuitBreaker extends EventEmitter {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private nextAttempt: number = Date.now();
    private options: CircuitBreakerOptions;

    constructor(options: CircuitBreakerOptions) {
        super();
        this.options = options;
    }

    async exec<T>(request: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() > this.nextAttempt) {
                this.state = CircuitState.HALF_OPEN;
            } else {
                throw new Error(`CircuitBreaker is OPEN. Request blocked.`);
            }
        }

        try {
            const result = await request();
            this.success();
            return result;
        } catch (err) {
            this.failure(err);
            throw err;
        }
    }

    private success() {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.CLOSED;
            this.emit("close");
        }
    }

    private failure(err: any) {
        this.failureCount++;
        if (
            this.state === CircuitState.CLOSED &&
            this.failureCount >= this.options.failureThreshold
        ) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.options.resetTimeout;
            this.emit("open");
        }
    }
}

export async function retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 100,
    backoffFactor: number = 2
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return retry(fn, retries - 1, delay * backoffFactor, backoffFactor);
    }
}
