import { PubSub } from "graphql-subscriptions";

// 데모용 in-memory PubSub. 여러 인스턴스로 스케일하면
// graphql-redis-subscriptions 등으로 교체해야 함(env.md 참고).
export const pubsub = new PubSub();

export const MESSAGE_ADDED = "MESSAGE_ADDED";
