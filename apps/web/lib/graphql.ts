import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        nickname
        neighborhood
      }
    }
  }
`;

export const SIGNUP = gql`
  mutation Signup(
    $email: String!
    $password: String!
    $nickname: String!
    $neighborhood: String!
  ) {
    signup(
      email: $email
      password: $password
      nickname: $nickname
      neighborhood: $neighborhood
    ) {
      token
      user {
        id
        nickname
        neighborhood
      }
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      nickname
      neighborhood
    }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct(
    $title: String!
    $description: String!
    $price: Int!
    $category: Category!
    $imageUrls: [String!]!
  ) {
    createProduct(
      title: $title
      description: $description
      price: $price
      category: $category
      imageUrls: $imageUrls
    ) {
      id
    }
  }
`;

export const MY_CHAT_ROOMS = gql`
  query MyChatRooms {
    myChatRooms {
      id
      unreadCount
      partner {
        nickname
      }
      product {
        title
        thumbnailUrl
        price
      }
      lastMessage {
        content
        createdAt
      }
    }
  }
`;

export const CHAT_ROOM_VIEW = gql`
  query ChatRoomView($id: ID!, $before: ID, $first: Int) {
    chatRoom(id: $id) {
      id
      partner {
        nickname
      }
      product {
        title
        price
        thumbnailUrl
      }
    }
    messages(chatRoomId: $id, before: $before, first: $first) {
      id
      content
      createdAt
      isMine
      sender {
        nickname
      }
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($chatRoomId: ID!, $content: String!) {
    sendMessage(chatRoomId: $chatRoomId, content: $content) {
      id
    }
  }
`;

export const MESSAGE_ADDED = gql`
  subscription MessageAdded($chatRoomId: ID!) {
    messageAdded(chatRoomId: $chatRoomId) {
      id
      content
      createdAt
      isMine
      sender {
        nickname
      }
    }
  }
`;

export const PRODUCT_DETAIL = gql`
  query ProductDetail($id: ID!) {
    me {
      id
    }
    product(id: $id) {
      id
      title
      description
      price
      status
      category
      createdAt
      likeCount
      isLikedByMe
      images {
        id
        url
      }
      seller {
        id
        nickname
        otherProducts(first: 4) {
          id
          title
          price
          status
          thumbnailUrl
          createdAt
          likeCount
          seller {
            nickname
          }
        }
      }
      comments {
        id
        content
        createdAt
        author {
          nickname
        }
      }
    }
  }
`;

export const TOGGLE_LIKE = gql`
  mutation ToggleLike($productId: ID!) {
    toggleLike(productId: $productId) {
      id
      likeCount
      isLikedByMe
    }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($productId: ID!, $content: String!) {
    addComment(productId: $productId, content: $content) {
      id
      content
      createdAt
      author {
        nickname
      }
    }
  }
`;

export const UPDATE_PRODUCT_STATUS = gql`
  mutation UpdateProductStatus($id: ID!, $status: ProductStatus!) {
    updateProductStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const CREATE_OR_GET_CHATROOM = gql`
  mutation CreateOrGetChatRoom($productId: ID!) {
    createOrGetChatRoom(productId: $productId) {
      id
    }
  }
`;

export const HOME_FEED = gql`
  query HomeFeed(
    $neighborhood: String
    $category: Category
    $search: String
    $after: ID
    $first: Int
  ) {
    products(
      neighborhood: $neighborhood
      category: $category
      search: $search
      after: $after
      first: $first
    ) {
      edges {
        node {
          id
          title
          price
          status
          category
          thumbnailUrl
          createdAt
          likeCount
          seller {
            nickname
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
