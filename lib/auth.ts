import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ALG = "HS256";
const COOKIE_NAME = "admin_token";
const ISSUER = "gcinsight";
const EXPIRATION = "24h";

/**
 * JWT署名に使うシークレットを取得する。
 * ADMIN_JWT_SECRET が未設定の場合は ADMIN_PASSWORD をフォールバックに使う。
 */
function getSecret(): Uint8Array {
  const raw = process.env.ADMIN_JWT_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!raw) {
    throw new Error("ADMIN_JWT_SECRET or ADMIN_PASSWORD must be set");
  }
  return new TextEncoder().encode(raw);
}

/** 管理パスワードを検証する */
export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD environment variable is required");
  }
  return password === expected;
}

/** JWTトークンを生成する（有効期限24時間） */
export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(getSecret());
}

/** JWTトークンを検証する。無効な場合はnullを返す */
export async function verifyAdminToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
    });
    return payload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
