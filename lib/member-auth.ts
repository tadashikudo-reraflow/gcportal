import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ALG = "HS256";
export const MEMBER_COOKIE = "member_token";
const ISSUER = "gcinsight-member";
const EXPIRATION = "30d";

function getSecret(): Uint8Array {
  const raw =
    process.env.MEMBER_JWT_SECRET ??
    process.env.ADMIN_JWT_SECRET ??
    process.env.ADMIN_PASSWORD;
  if (!raw) throw new Error("MEMBER_JWT_SECRET is required");
  return new TextEncoder().encode(raw + ":member");
}

export async function createMemberToken(email: string): Promise<string> {
  return new SignJWT({ email, role: "member" })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(getSecret());
}

export async function verifyMemberToken(
  token: string
): Promise<(JWTPayload & { email: string }) | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: ISSUER });
    if (typeof payload.email !== "string") return null;
    return payload as JWTPayload & { email: string };
  } catch {
    return null;
  }
}
