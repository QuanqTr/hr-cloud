import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "hr_salt_2024").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

const sessions = new Map<string, { userId: number; role: string; expiresAt: Date }>();

export function createSession(userId: number, role: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  sessions.set(token, { userId, role, expiresAt });
  return token;
}

export function getSession(token: string): { userId: number; role: string } | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    sessions.delete(token);
    return null;
  }
  return { userId: session.userId, role: session.role };
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.session_token;
  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "Not authenticated" });
    return;
  }
  const session = getSession(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized", message: "Session expired" });
    return;
  }
  (req as any).userId = session.userId;
  (req as any).userRole = session.role;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = (req as any).userRole;
    if (!roles.includes(role)) {
      res.status(403).json({ error: "Forbidden", message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
