"use client";

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import {
  getMainDefinition,
  relayStylePagination,
} from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import { getToken } from "./auth";

const HTTP_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL ?? "http://localhost:4000/graphql";
const WS_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ?? "ws://localhost:4000/graphql";

const httpLink = new HttpLink({ uri: HTTP_URL });

const authLink = setContext((_, { headers }) => {
  const token = getToken();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

function createWsLink() {
  return new GraphQLWsLink(
    createClient({
      url: WS_URL,
      connectionParams: () => {
        const token = getToken();
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    })
  );
}

export function makeApolloClient() {
  const httpAuthLink = from([authLink, httpLink]);

  // 브라우저에서만 WS 링크를 붙이고, subscription만 WS로 라우팅
  const link =
    typeof window === "undefined"
      ? httpAuthLink
      : split(
          ({ query }) => {
            const def = getMainDefinition(query);
            return (
              def.kind === "OperationDefinition" &&
              def.operation === "subscription"
            );
          },
          createWsLink(),
          httpAuthLink
        );

  return new ApolloClient({
    link,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // 무한 스크롤: 같은 (동네, 카테고리, 검색어)면 edges를 이어붙임
            products: relayStylePagination([
              "neighborhood",
              "category",
              "search",
            ]),
          },
        },
      },
    }),
    // 캐시를 먼저 보여주되 네트워크로 항상 재검증 → 로그인/채팅목록/찜 상태
    // 등이 오래된 캐시로 인해 안 보이는 문제 방지
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-and-network" },
    },
  });
}
