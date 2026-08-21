import { IUser } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: IUser | null;
      userId?: string;
      clerkUserId?: string;
      auth?: {
        userId?: string;
        sessionClaims?: any;
      };
    }
  }
}
