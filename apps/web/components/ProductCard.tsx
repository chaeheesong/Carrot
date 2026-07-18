import Link from "next/link";
import { timeAgo, formatPrice } from "@/lib/format";

export interface ProductNode {
  id: string;
  title: string;
  price: number;
  status: "SELLING" | "SOLD";
  thumbnailUrl: string | null;
  createdAt: string;
  likeCount: number;
  seller: { nickname: string };
}

export function ProductCard({ product }: { product: ProductNode }) {
  const sold = product.status === "SOLD";
  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-gray-100">
        {product.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className={`h-full w-full object-cover transition-transform group-hover:scale-[1.02] ${
              sold ? "opacity-50" : ""
            }`}
          />
        ) : (
          <div className="h-full w-full bg-gray-200" />
        )}
        {sold && (
          <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            거래완료
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="truncate text-sm text-ink">{product.title}</p>
        <p className="mt-0.5 font-bold text-ink">{formatPrice(product.price)}</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          {timeAgo(product.createdAt)} · 찜 {product.likeCount}
        </p>
      </div>
    </Link>
  );
}
