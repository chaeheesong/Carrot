import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-insecure-secret";

export interface JwtPayload {
  userId: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId } satisfies JwtPayload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

/** Authorization 헤더에서 userId 추출. 없거나 잘못되면 null (게스트). */
export function getUserIdFromToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

/** 로그인 필요한 리졸버에서 사용. userId 없으면 UNAUTHENTICATED 에러. */
export function requireAuth(userId: string | null): string {
  if (!userId) {
    throw new GraphQLError("로그인이 필요합니다.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return userId;
}
