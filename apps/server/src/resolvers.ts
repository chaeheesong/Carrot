import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import { withFilter } from "graphql-subscriptions";
import type { Context } from "./context.js";
import { requireAuth, signToken } from "./auth.js";
import { pubsub, MESSAGE_ADDED } from "./pubsub.js";

const iso = (d: Date) => d.toISOString();

export const resolvers = {
  Query: {
    me: (_p: unknown, _a: unknown, ctx: Context) => {
      if (!ctx.userId) return null;
      return ctx.prisma.user.findUnique({ where: { id: ctx.userId } });
    },

    products: async (
      _p: unknown,
      args: {
        neighborhood?: string;
        category?: string;
        search?: string;
        after?: string;
        first?: number;
      },
      ctx: Context
    ) => {
      const take = Math.min(args.first ?? 20, 50);
      const where = {
        ...(args.neighborhood ? { neighborhood: args.neighborhood } : {}),
        ...(args.category ? { category: args.category as any } : {}),
        ...(args.search
          ? { title: { contains: args.search, mode: "insensitive" as const } }
          : {}),
      };
      const items = await ctx.prisma.product.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: take + 1,
        ...(args.after
          ? { cursor: { id: args.after }, skip: 1 }
          : {}),
      });
      const hasNextPage = items.length > take;
      const nodes = hasNextPage ? items.slice(0, take) : items;
      return {
        edges: nodes.map((node) => ({ node, cursor: node.id })),
        pageInfo: {
          hasNextPage,
          endCursor: nodes.length ? nodes[nodes.length - 1].id : null,
        },
      };
    },

    product: (_p: unknown, args: { id: string }, ctx: Context) =>
      ctx.prisma.product.findUnique({ where: { id: args.id } }),

    myChatRooms: (_p: unknown, _a: unknown, ctx: Context) => {
      const userId = requireAuth(ctx.userId);
      return ctx.prisma.chatRoom.findMany({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        orderBy: { createdAt: "desc" },
      });
    },

    chatRoom: async (_p: unknown, args: { id: string }, ctx: Context) => {
      const userId = requireAuth(ctx.userId);
      const room = await ctx.prisma.chatRoom.findUnique({
        where: { id: args.id },
      });
      if (!room || (room.buyerId !== userId && room.sellerId !== userId)) {
        throw new GraphQLError("접근 권한이 없습니다.", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      return room;
    },

    messages: async (
      _p: unknown,
      args: { chatRoomId: string; before?: string; first?: number },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.userId);
      const room = await ctx.prisma.chatRoom.findUnique({
        where: { id: args.chatRoomId },
      });
      if (!room || (room.buyerId !== userId && room.sellerId !== userId)) {
        throw new GraphQLError("접근 권한이 없습니다.", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      const take = Math.min(args.first ?? 30, 100);
      const rows = await ctx.prisma.message.findMany({
        where: { chatRoomId: args.chatRoomId },
        orderBy: { createdAt: "desc" },
        take,
        ...(args.before ? { cursor: { id: args.before }, skip: 1 } : {}),
      });
      // 오래된 → 최신 순으로 반환
      return rows.reverse();
    },
  },

  Mutation: {
    signup: async (
      _p: unknown,
      args: {
        email: string;
        password: string;
        nickname: string;
        neighborhood: string;
      },
      ctx: Context
    ) => {
      const exists = await ctx.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (exists) {
        throw new GraphQLError("이미 가입된 이메일입니다.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const user = await ctx.prisma.user.create({
        data: {
          email: args.email,
          password: await bcrypt.hash(args.password, 10),
          nickname: args.nickname,
          neighborhood: args.neighborhood,
        },
      });
      return { token: signToken(user.id), user };
    },

    login: async (
      _p: unknown,
      args: { email: string; password: string },
      ctx: Context
    ) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: args.email },
      });
      const ok = user && (await bcrypt.compare(args.password, user.password));
      if (!user || !ok) {
        throw new GraphQLError("이메일 또는 비밀번호가 올바르지 않습니다.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      return { token: signToken(user.id), user };
    },

    createProduct: async (
      _p: unknown,
      args: {
        title: string;
        description: string;
        price: number;
        category: string;
        imageUrls: string[];
      },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.userId);
      const me = await ctx.prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      return ctx.prisma.product.create({
        data: {
          title: args.title,
          description: args.description,
          price: args.price,
          category: args.category as any,
          neighborhood: me.neighborhood,
          sellerId: userId,
          images: {
            create: args.imageUrls.map((url, order) => ({ url, order })),
          },
        },
      });
    },

    updateProductStatus: async (
      _p: unknown,
      args: { id: string; status: string },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.userId);
      const product = await ctx.prisma.product.findUnique({
        where: { id: args.id },
      });
      if (!product) throw new GraphQLError("상품을 찾을 수 없습니다.");
      if (product.sellerId !== userId) {
        throw new GraphQLError("판매자만 변경할 수 있습니다.", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      return ctx.prisma.product.update({
        where: { id: args.id },
        data: { status: args.status as any },
      });
    },

    toggleLike: async (
      _p: unknown,
      args: { productId: string },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.userId);
      const key = { userId_productId: { userId, productId: args.productId } };
      const existing = await ctx.prisma.like.findUnique({ where: key });
      if (existing) {
        await ctx.prisma.like.delete({ where: key });
      } else {
        await ctx.prisma.like.create({
          data: { userId, productId: args.productId },
        });
      }
      return ctx.prisma.product.findUniqueOrThrow({
        where: { id: args.productId },
      });
    },

    addComment: async (
      _p: unknown,
      args: { productId: string; content: string },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.userId);
      return ctx.prisma.comment.create({
        data: {
          productId: args.productId,
          authorId: userId,
          content: args.content,
        },
      });
    },

    createOrGetChatRoom: async (
      _p: unknown,
      args: { productId: string },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.userId);
      const product = await ctx.prisma.product.findUnique({
        where: { id: args.productId },
      });
      if (!product) throw new GraphQLError("상품을 찾을 수 없습니다.");
      if (product.sellerId === userId) {
        throw new GraphQLError("본인 상품에는 채팅할 수 없습니다.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      return ctx.prisma.chatRoom.upsert({
        where: {
          productId_buyerId: { productId: args.productId, buyerId: userId },
        },
        create: {
          productId: args.productId,
          buyerId: userId,
          sellerId: product.sellerId,
        },
        update: {},
      });
    },

    sendMessage: async (
      _p: unknown,
      args: { chatRoomId: string; content: string },
      ctx: Context
    ) => {
      const userId = requireAuth(ctx.userId);
      const room = await ctx.prisma.chatRoom.findUnique({
        where: { id: args.chatRoomId },
      });
      if (!room || (room.buyerId !== userId && room.sellerId !== userId)) {
        throw new GraphQLError("접근 권한이 없습니다.", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      const message = await ctx.prisma.message.create({
        data: {
          chatRoomId: args.chatRoomId,
          senderId: userId,
          content: args.content,
        },
      });
      pubsub.publish(MESSAGE_ADDED, { messageAdded: message });
      return message;
    },
  },

  Subscription: {
    messageAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([MESSAGE_ADDED]),
        (payload: { messageAdded: { chatRoomId: string } }, variables: {
          chatRoomId: string;
        }) => payload.messageAdded.chatRoomId === variables.chatRoomId
      ),
    },
  },

  // ---------- Field resolvers ----------
  Product: {
    createdAt: (p: { createdAt: Date }) => iso(p.createdAt),
    thumbnailUrl: async (p: { id: string }, _a: unknown, ctx: Context) => {
      const img = await ctx.prisma.productImage.findFirst({
        where: { productId: p.id },
        orderBy: { order: "asc" },
      });
      return img?.url ?? null;
    },
    images: (p: { id: string }, _a: unknown, ctx: Context) =>
      ctx.prisma.productImage.findMany({
        where: { productId: p.id },
        orderBy: { order: "asc" },
      }),
    seller: (p: { sellerId: string }, _a: unknown, ctx: Context) =>
      ctx.prisma.user.findUnique({ where: { id: p.sellerId } }),
    likeCount: (p: { id: string }, _a: unknown, ctx: Context) =>
      ctx.prisma.like.count({ where: { productId: p.id } }),
    isLikedByMe: async (p: { id: string }, _a: unknown, ctx: Context) => {
      if (!ctx.userId) return false;
      const like = await ctx.prisma.like.findUnique({
        where: { userId_productId: { userId: ctx.userId, productId: p.id } },
      });
      return !!like;
    },
    comments: (p: { id: string }, _a: unknown, ctx: Context) =>
      ctx.prisma.comment.findMany({
        where: { productId: p.id },
        orderBy: { createdAt: "asc" },
      }),
  },

  User: {
    otherProducts: (
      u: { id: string },
      args: { first?: number },
      ctx: Context
    ) =>
      ctx.prisma.product.findMany({
        where: { sellerId: u.id },
        orderBy: { createdAt: "desc" },
        take: args.first ?? 3,
      }),
  },

  Comment: {
    createdAt: (c: { createdAt: Date }) => iso(c.createdAt),
    author: (c: { authorId: string }, _a: unknown, ctx: Context) =>
      ctx.prisma.user.findUnique({ where: { id: c.authorId } }),
  },

  ChatRoom: {
    createdAt: (r: { createdAt: Date }) => iso(r.createdAt),
    product: (r: { productId: string }, _a: unknown, ctx: Context) =>
      ctx.prisma.product.findUnique({ where: { id: r.productId } }),
    partner: (
      r: { buyerId: string; sellerId: string },
      _a: unknown,
      ctx: Context
    ) => {
      const partnerId = r.buyerId === ctx.userId ? r.sellerId : r.buyerId;
      return ctx.prisma.user.findUnique({ where: { id: partnerId } });
    },
    lastMessage: (r: { id: string }, _a: unknown, ctx: Context) =>
      ctx.prisma.message.findFirst({
        where: { chatRoomId: r.id },
        orderBy: { createdAt: "desc" },
      }),
    unreadCount: (r: { id: string }, _a: unknown, ctx: Context) =>
      ctx.prisma.message.count({
        where: {
          chatRoomId: r.id,
          senderId: { not: ctx.userId ?? "" },
          readAt: null,
        },
      }),
  },

  Message: {
    createdAt: (m: { createdAt: Date }) => iso(m.createdAt),
    isMine: (m: { senderId: string }, _a: unknown, ctx: Context) =>
      m.senderId === ctx.userId,
    sender: (m: { senderId: string }, _a: unknown, ctx: Context) =>
      ctx.prisma.user.findUnique({ where: { id: m.senderId } }),
  },
};
