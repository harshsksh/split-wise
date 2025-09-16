import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

const DEFAULT_JWT_EXPIRES = "7d";

export async function hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(plainPassword, saltRounds);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

type AuthTokenPayload = {
  sub: string; // user id
  email: string;
};

export function signAuthToken(
  payload: AuthTokenPayload,
  options?: { expiresIn?: string | number }
): string {
  const secretEnv = process.env.JWT_SECRET;
  if (!secretEnv) throw new Error("Missing JWT_SECRET");
  const secret: Secret = secretEnv;
  const signOptions: SignOptions = {
    expiresIn: (options?.expiresIn ?? DEFAULT_JWT_EXPIRES) as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret, signOptions);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const secret = process.env.JWT_SECRET as Secret;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return jwt.verify(token, secret) as AuthTokenPayload;
}

export function authCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: "auth_token",
    options: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      path: "/",
      // max-age handled by JWT expiry; you can set an upper bound if desired
    },
  };
}

// Utility function to clear auth cookie on client side
export function clearAuthCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
}


