export const CATEGORIES = [
  { label: "전체", value: null },
  { label: "디지털기기", value: "DIGITAL" },
  { label: "가구/인테리어", value: "FURNITURE" },
  { label: "생활가전", value: "APPLIANCE" },
  { label: "유아동", value: "KIDS" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

/** ISO 문자열 → "방금 전 / N분 전 / N시간 전 / N일 전" */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return "방금 전";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}개월 전`;
  return `${Math.floor(month / 12)}년 전`;
}

/** 12000 → "12,000원" */
export function formatPrice(won: number): string {
  return `${won.toLocaleString("ko-KR")}원`;
}
