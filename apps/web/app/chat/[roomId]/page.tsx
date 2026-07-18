"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import {
  CHAT_ROOM_VIEW,
  SEND_MESSAGE,
  MESSAGE_ADDED,
} from "@/lib/graphql";
import { formatPrice } from "@/lib/format";

const PAGE = 30;

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  sender: { nickname: string };
}

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [text, setText] = useState("");
  const [reachedTop, setReachedTop] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastIdRef = useRef<string | null>(null);

  const { data, loading, subscribeToMore, fetchMore } = useQuery(
    CHAT_ROOM_VIEW,
    { variables: { id: roomId, first: PAGE } }
  );
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);

  const room = data?.chatRoom;
  const messages: Message[] = data?.messages ?? [];

  // 실시간 수신 (Subscription)
  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToMore({
      document: MESSAGE_ADDED,
      variables: { chatRoomId: roomId },
      updateQuery: (prev, { subscriptionData }) => {
        const m = subscriptionData.data?.messageAdded;
        if (!m) return prev;
        const existing: Message[] = prev.messages ?? [];
        if (existing.some((x) => x.id === m.id)) return prev;
        return { ...prev, messages: [...existing, m] };
      },
    });
    return () => unsub();
  }, [roomId, subscribeToMore]);

  // 새 메시지 도착 시 맨 아래로 스크롤
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.id !== lastIdRef.current) {
      lastIdRef.current = last.id;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadOlder = async () => {
    if (!messages.length) return;
    const { data: more } = await fetchMore({
      variables: { id: roomId, before: messages[0].id, first: PAGE },
      updateQuery: (prev, { fetchMoreResult }) => {
        const older: Message[] = fetchMoreResult?.messages ?? [];
        const ids = new Set((prev.messages ?? []).map((m: Message) => m.id));
        const dedup = older.filter((m) => !ids.has(m.id));
        return { ...prev, messages: [...dedup, ...(prev.messages ?? [])] };
      },
    });
    if ((more?.messages?.length ?? 0) < PAGE) setReachedTop(true);
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    // 전송 후 메시지는 Subscription으로 수신되어 목록에 반영됨(중복 방지 dedupe)
    await sendMessage({ variables: { chatRoomId: roomId, content } });
  };

  if (loading && !room) {
    return (
      <div className="flex h-full items-center justify-center text-ink-muted">
        불러오는 중…
      </div>
    );
  }
  if (!room) {
    return (
      <div className="flex h-full items-center justify-center text-ink-muted">
        채팅방을 찾을 수 없어요.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 헤더: 상대 + 상품 미니카드 */}
      <header className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          <span className="font-semibold text-ink">{room.partner.nickname}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5">
          {room.product.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={room.product.thumbnailUrl}
              alt=""
              className="h-8 w-8 rounded object-cover"
            />
          )}
          <div className="text-right">
            <p className="max-w-[160px] truncate text-xs text-ink-muted">
              {room.product.title}
            </p>
            <p className="text-sm font-bold text-ink">
              {formatPrice(room.product.price)}
            </p>
          </div>
        </div>
      </header>

      {/* 메시지 목록 */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {!reachedTop && messages.length >= PAGE && (
          <button
            onClick={loadOlder}
            className="mx-auto block text-xs text-ink-muted hover:text-carrot"
          >
            ↑ 이전 메시지 불러오기
          </button>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                m.isMine
                  ? "bg-carrot text-white"
                  : "bg-gray-100 text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">
            첫 메시지를 보내보세요.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <form
        onSubmit={onSend}
        className="flex gap-2 border-t border-gray-100 px-5 py-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-lg bg-gray-50 px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-carrot"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-carrot px-5 font-bold text-white hover:bg-carrot-dark disabled:opacity-60"
        >
          전송
        </button>
      </form>
    </div>
  );
}
