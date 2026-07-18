import "./loadEnv.js";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";
import { buildHttpContext, buildWsContext, type Context } from "./context.js";

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = createServer(app);

// --- WebSocket (Subscription) ---
const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });
const serverCleanup = useServer(
  {
    schema,
    context: async (ctx): Promise<Context> => {
      const auth =
        (ctx.connectionParams?.authorization as string | undefined) ??
        (ctx.connectionParams?.Authorization as string | undefined);
      return buildWsContext(auth);
    },
  },
  wsServer
);

// --- Apollo (HTTP: Query/Mutation) ---
const apollo = new ApolloServer<Context>({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

async function main() {
  await apollo.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({ origin: CORS_ORIGIN, credentials: true }),
    bodyParser.json(),
    expressMiddleware(apollo, {
      context: async ({ req }) =>
        buildHttpContext(req.headers.authorization),
    })
  );

  app.get("/", (_req, res) => res.send("동네장터 GraphQL 서버 실행 중 → /graphql"));

  httpServer.listen(PORT, () => {
    console.log(`🥕 HTTP    → http://localhost:${PORT}/graphql`);
    console.log(`🥕 WS(sub) → ws://localhost:${PORT}/graphql`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
