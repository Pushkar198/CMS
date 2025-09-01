import type { Request } from 'express';
import type { SessionData } from 'express-session';

// Extend express session interface to include user
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
    username?: string;
  }
}

export interface AuthenticatedRequest extends Request {
  session: SessionData;
}