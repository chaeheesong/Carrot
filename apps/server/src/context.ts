import { prisma } from "./prisma.js";
import { getUserIdFromToken } from "./auth.js";

export interface Context {
  prisma: typeof prisma;
  userId: string | null;
}

/** HTTP 요청용 컨텍스트 (Query/Mutation) */
export function buildHttpContext(authHeader?: string): Context {
  return {
    prisma,
    userId: getUserIdFromToken(authHeader),
  };
}

/** WebSocket 연결용 컨텍스트 (Subscription). connectionParams.authorization 사용 */
export function buildWsContext(authorization?: string): Context {
  return {
    prisma,
    userId: getUserIdFromToken(authorization),
  };
}
