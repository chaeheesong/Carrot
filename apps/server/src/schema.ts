export const typeDefs = /* GraphQL */ `
  enum ProductStatus {
    SELLING
    SOLD
  }

  enum Category {
    DIGITAL
    FURNITURE
    APPLIANCE
    KIDS
    ETC
  }

  type User {
    id: ID!
    email: String!
    nickname: String!
    neighborhood: String!
    profileImage: String
    otherProducts(first: Int = 3): [Product!]!
  }

  type Product {
    id: ID!
    title: String!
    description: String!
    price: Int!
    status: ProductStatus!
    category: Category!
    neighborhood: String!
    createdAt: String!
    thumbnailUrl: String
    images: [ProductImage!]!
    seller: User!
    likeCount: Int!
    isLikedByMe: Boolean!
    comments: [Comment!]!
  }

  type ProductImage {
    id: ID!
    url: String!
    order: Int!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    createdAt: String!
  }

  type ChatRoom {
    id: ID!
    product: Product!
    partner: User!
    lastMessage: Message
    unreadCount: Int!
    createdAt: String!
  }

  type Message {
    id: ID!
    content: String!
    sender: User!
    createdAt: String!
    isMine: Boolean!
  }

  # ---- Relay 스타일 페이지네이션 ----
  type ProductEdge {
    node: Product!
    cursor: ID!
  }
  type PageInfo {
    hasNextPage: Boolean!
    endCursor: ID
  }
  type ProductConnection {
    edges: [ProductEdge!]!
    pageInfo: PageInfo!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    products(
      neighborhood: String
      category: Category
      search: String
      after: ID
      first: Int = 20
    ): ProductConnection!
    product(id: ID!): Product
    myChatRooms: [ChatRoom!]!
    chatRoom(id: ID!): ChatRoom
    messages(chatRoomId: ID!, before: ID, first: Int = 30): [Message!]!
  }

  type Mutation {
    signup(
      email: String!
      password: String!
      nickname: String!
      neighborhood: String!
    ): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    createProduct(
      title: String!
      description: String!
      price: Int!
      category: Category!
      imageUrls: [String!]!
    ): Product!
    updateProductStatus(id: ID!, status: ProductStatus!): Product!
    toggleLike(productId: ID!): Product!
    addComment(productId: ID!, content: String!): Comment!

    createOrGetChatRoom(productId: ID!): ChatRoom!
    sendMessage(chatRoomId: ID!, content: String!): Message!
  }

  type Subscription {
    messageAdded(chatRoomId: ID!): Message!
  }
`;
