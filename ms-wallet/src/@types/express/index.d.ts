// Extend Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
