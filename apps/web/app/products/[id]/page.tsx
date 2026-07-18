"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import {
  PRODUCT_DETAIL,
  TOGGLE_LIKE,
  ADD_COMMENT,
  UPDATE_PRODUCT_STATUS,
  CREATE_OR_GET_CHATROOM,
} from "@/lib/graphql";
import { formatPrice, timeAgo } from "@/lib/format";
import { ImageCarousel } from "@/components/ImageCarousel";
import { ProductCard, type ProductNode } from "@/components/ProductCard";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<"desc" | "comments">("desc");
  const [comment, setComment] = useState("");

  const { data, loading, refetch } = useQuery(PRODUCT_DETAIL, {
    variables: { id },
  });
  const [toggleLike] = useMutation(TOGGLE_LIKE);
  const [addComment, { loading: adding }] = useMutation(ADD_COMMENT);
  const [updateStatus] = useMutation(UPDATE_PRODUCT_STATUS);
  const [createOrGetChatRoom, { loading: startingChat }] =
    useMutation(CREATE_OR_GET_CHATROOM);

  const me = data?.me;
  const p = data?.product;

  if (loading && !p) {
    return (
      <main className="min-h-screen bg-cream">
        <p className="py-20 text-center text-ink-muted">불러오는 중…</p>
      </main>
    );
  }
  if (!p) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link href="/" className="text-sm text-ink-muted hover:text-carrot">
            ← 목록으로
          </Link>
          <p className="py-20 text-center text-ink-muted">
            상품을 찾을 수 없어요.
          </p>
        </div>
      </main>
    );
  }

  const sold = p.status === "SOLD";
  const isMine = me && p.seller.id === me.id;
  const otherProducts: ProductNode[] = (p.seller.otherProducts ?? []).filter(
    (x: ProductNode) => x.id !== p.id
  );

  const requireLogin = () => {
    router.push("/login");
  };

  const onToggleLike = async () => {
    if (!me) return requireLogin();
    await toggleLike({
      variables: { productId: p.id },
      optimisticResponse: {
        toggleLike: {
          __typename: "Product",
          id: p.id,
          likeCount: p.likeCount + (p.isLikedByMe ? -1 : 1),
          isLikedByMe: !p.isLikedByMe,
        },
      },
    });
  };

  const onStartChat = async () => {
    if (!me) return requireLogin();
    const { data: res } = await createOrGetChatRoom({
      variables: { productId: p.id },
    });
    const roomId = res?.createOrGetChatRoom?.id;
    if (roomId) router.push(`/chat/${roomId}`);
  };

  const onToggleStatus = async () => {
    await updateStatus({
      variables: { id: p.id, status: sold ? "SELLING" : "SOLD" },
    });
  };

  const onSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return requireLogin();
    if (!comment.trim()) return;
    await addComment({ variables: { productId: p.id, content: comment.trim() } });
    setComment("");
    await refetch();
  };

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <Link href="/" className="text-sm text-ink-muted hover:text-carrot">
          ← 목록으로
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-2">
          {/* 좌: 이미지 */}
          <ImageCarousel images={p.images} sold={sold} />

          {/* 우: 정보 카드 */}
          <div>
            <div className="rounded-card bg-white p-6 shadow-card">
              {sold && (
                <span className="mb-2 inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink-muted">
                  거래완료
                </span>
              )}
              <h1 className="text-xl font-bold text-ink">{p.title}</h1>
              <p className="mt-1 text-2xl font-bold text-ink">
                {formatPrice(p.price)}
              </p>

              <div className="my-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                <div className="h-9 w-9 rounded-full bg-gray-200" />
                <span className="font-medium text-ink">{p.seller.nickname}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onToggleLike}
                  aria-label="찜하기"
                  className={`flex h-11 w-12 items-center justify-center rounded-lg border text-lg ${
                    p.isLikedByMe
                      ? "border-carrot text-carrot"
                      : "border-gray-200 text-ink-muted hover:border-gray-300"
                  }`}
                >
                  {p.isLikedByMe ? "♥" : "♡"}
                </button>

                {isMine ? (
                  <button
                    onClick={onToggleStatus}
                    className="h-11 flex-1 rounded-lg bg-ink font-bold text-white hover:opacity-90"
                  >
                    {sold ? "판매중으로 변경" : "거래완료로 변경"}
                  </button>
                ) : (
                  <button
                    onClick={onStartChat}
                    disabled={startingChat}
                    className="h-11 flex-1 rounded-lg bg-carrot font-bold text-white hover:bg-carrot-dark disabled:opacity-60"
                  >
                    채팅하기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="mt-8 max-w-3xl">
          <div className="flex gap-6 border-b border-gray-200">
            <button
              onClick={() => setTab("desc")}
              className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium ${
                tab === "desc"
                  ? "border-carrot text-ink"
                  : "border-transparent text-ink-muted"
              }`}
            >
              상세설명
            </button>
            <button
              onClick={() => setTab("comments")}
              className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium ${
                tab === "comments"
                  ? "border-carrot text-ink"
                  : "border-transparent text-ink-muted"
              }`}
            >
              문의 댓글 ({p.comments.length})
            </button>
          </div>

          {tab === "desc" ? (
            <p className="whitespace-pre-wrap py-5 text-ink">{p.description}</p>
          ) : (
            <div className="py-5">
              <form onSubmit={onSubmitComment} className="mb-5 flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={me ? "문의를 남겨보세요" : "로그인 후 문의할 수 있어요"}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-carrot"
                />
                <button
                  type="submit"
                  disabled={adding}
                  className="rounded-lg bg-carrot px-5 font-bold text-white hover:bg-carrot-dark disabled:opacity-60"
                >
                  등록
                </button>
              </form>

              {p.comments.length === 0 ? (
                <p className="text-sm text-ink-muted">아직 문의가 없어요.</p>
              ) : (
                <ul className="space-y-4">
                  {p.comments.map((c: any) => (
                    <li key={c.id} className="border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">
                          {c.author.nickname}
                        </span>
                        <span className="text-xs text-ink-muted">
                          {timeAgo(c.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink">{c.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* 판매자의 다른 상품 */}
        {otherProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-bold text-ink">
              {p.seller.nickname}님의 다른 상품
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {otherProducts.map((op) => (
                <ProductCard key={op.id} product={op} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
