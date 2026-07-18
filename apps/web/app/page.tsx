"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { ME, HOME_FEED } from "@/lib/graphql";
import { clearToken } from "@/lib/auth";
import { CategoryChips } from "@/components/CategoryChips";
import { ProductCard, type ProductNode } from "@/components/ProductCard";
import type { CategoryValue } from "@/lib/format";

const DEFAULT_NEIGHBORHOOD = "서울시 강남구";
const NEIGHBORHOODS = [
  "서울시 강남구",
  "서울시 마포구",
  "서울시 송파구",
  "서울시 관악구",
];

export default function HomePage() {
  const router = useRouter();
  const { data: meData } = useQuery(ME);
  const me = meData?.me;

  // 동네: 로그인 유저의 동네로 초기화, 드롭다운으로 변경 가능
  const [neighborhood, setNeighborhood] = useState(DEFAULT_NEIGHBORHOOD);
  const [hoodOpen, setHoodOpen] = useState(false);
  useEffect(() => {
    if (me?.neighborhood) setNeighborhood(me.neighborhood);
  }, [me?.neighborhood]);

  const [category, setCategory] = useState<CategoryValue>(null);

  // 검색: 입력값(searchInput)을 300ms 디바운스해서 실제 검색어(search)로 반영
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, loading, fetchMore } = useQuery(HOME_FEED, {
    variables: {
      neighborhood,
      category,
      search: search || null,
      first: 20,
    },
    notifyOnNetworkStatusChange: true,
  });

  const edges: { node: ProductNode }[] = data?.products?.edges ?? [];
  const pageInfo = data?.products?.pageInfo;

  const loadingMore = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loadingMore.current || !pageInfo?.hasNextPage) return;
    loadingMore.current = true;
    try {
      await fetchMore({ variables: { after: pageInfo.endCursor } });
    } finally {
      loadingMore.current = false;
    }
  }, [fetchMore, pageInfo?.hasNextPage, pageInfo?.endCursor]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <main className="min-h-screen bg-cream">
      {/* 헤더 */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="relative flex items-baseline gap-2">
          <span className="font-bold text-ink">{neighborhood}</span>
          <button
            onClick={() => setHoodOpen((o) => !o)}
            className="text-sm font-medium text-carrot hover:underline"
          >
            동네변경 ▾
          </button>
          {hoodOpen && (
            <>
              {/* 바깥 클릭 닫기 */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setHoodOpen(false)}
              />
              <div className="absolute left-0 top-8 z-20 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-card">
                {NEIGHBORHOODS.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setNeighborhood(n);
                      setHoodOpen(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-cream ${
                      n === neighborhood
                        ? "font-bold text-carrot"
                        : "text-ink"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          {me && (
            <Link
              href="/products/new"
              className="rounded-lg bg-carrot px-3 py-1.5 font-bold text-white hover:bg-carrot-dark"
            >
              판매하기
            </Link>
          )}
          <Link href="/chat" className="font-medium text-ink hover:text-carrot">
            채팅
          </Link>
          {me ? (
            <button
              onClick={() => {
                clearToken();
                router.refresh();
                window.location.reload();
              }}
              className="text-ink-muted hover:text-carrot"
            >
              {me.nickname} · 로그아웃
            </button>
          ) : (
            <Link href="/login" className="font-medium text-carrot">
              로그인
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-16">
        {/* 검색바 */}
        <div className="relative py-2">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
            🔍
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="상품명으로 검색"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 outline-none focus:border-carrot"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              aria-label="검색어 지우기"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>

        {/* 카테고리 칩 */}
        <div className="py-2">
          <CategoryChips active={category} onChange={setCategory} />
        </div>

        {/* 상품 그리드 */}
        {edges.length === 0 && loading ? (
          <p className="py-16 text-center text-ink-muted">불러오는 중…</p>
        ) : edges.length === 0 ? (
          <p className="py-16 text-center text-ink-muted">
            {search
              ? `'${search}' 검색 결과가 없어요.`
              : "아직 등록된 상품이 없어요."}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {edges.map(({ node }) => (
              <ProductCard key={node.id} product={node} />
            ))}
          </div>
        )}

        {/* 무한 스크롤 센티넬 */}
        <div ref={sentinelRef} className="h-10" />
        {loading && edges.length > 0 && (
          <p className="text-center text-sm text-ink-muted">더 불러오는 중…</p>
        )}
      </div>
    </main>
  );
}
