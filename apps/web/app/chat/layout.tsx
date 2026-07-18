"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@apollo/client";
import { MY_CHAT_ROOMS, ME } from "@/lib/graphql";
import { timeAgo } from "@/lib/format";

interface ChatRoomListItem {
  id: string;
  unreadCount: number;
  partner: { nickname: string };
  product: { title: string; thumbnailUrl: string | null };
  lastMessage: { content: string; createdAt: string } | null;
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: meData, loading: meLoading } = useQuery(ME);
  const me = meData?.me;
  const { data } = useQuery(MY_CHAT_ROOMS, { skip: !me });

  const rooms: ChatRoomListItem[] = data?.myChatRooms ?? [];
  const activeId = pathname?.startsWith("/chat/")
    ? pathname.split("/")[2]
    : null;

  if (!meLoading && !me) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <div className="rounded-card bg-white p-10 text-center shadow-card">
          <p className="text-ink">채팅은 로그인 후 이용할 수 있어요.</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-carrot px-6 py-2.5 font-bold text-white"
          >
            로그인
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream py-6">
      <div className="mx-auto max-w-6xl px-2">
        {/* 흰 카드 바깥 좌상단 홈 버튼 */}
        <Link
          href="/"
          className="mb-3 inline-block font-bold text-ink hover:text-carrot"
        >
          ← 홈
        </Link>
        <div className="flex h-[80vh] overflow-hidden rounded-card bg-white shadow-card">
          {/* 좌: 채팅방 리스트 */}
          <aside className="w-72 shrink-0 border-r border-gray-100">
            <div className="flex items-center px-4 py-4">
              <h1 className="font-bold text-ink">채팅</h1>
            </div>
          <ul className="overflow-y-auto">
            {rooms.length === 0 && (
              <li className="px-4 py-6 text-sm text-ink-muted">
                아직 채팅방이 없어요.
              </li>
            )}
            {rooms.map((room) => {
              const active = room.id === activeId;
              return (
                <li key={room.id}>
                  <Link
                    href={`/chat/${room.id}`}
                    className={`flex gap-3 px-4 py-3 ${
                      active ? "bg-carrot-light" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="h-11 w-11 shrink-0 rounded-full bg-gray-200" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-semibold text-ink">
                          {room.partner.nickname}
                        </span>
                        <span className="ml-2 shrink-0 text-[11px] text-ink-muted">
                          {room.lastMessage
                            ? timeAgo(room.lastMessage.createdAt)
                            : ""}
                        </span>
                      </div>
                      <p className="truncate text-xs text-ink-muted">
                        {room.product.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm text-ink">
                          {room.lastMessage?.content ?? "대화를 시작해보세요"}
                        </p>
                        {room.unreadCount > 0 && (
                          <span className="ml-2 shrink-0 rounded-full bg-carrot px-1.5 text-[11px] font-bold text-white">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

          {/* 우: 대화 영역 */}
          <section className="flex min-w-0 flex-1 flex-col">{children}</section>
        </div>
      </div>
    </main>
  );
}
