"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { ME, CREATE_PRODUCT } from "@/lib/graphql";
import { uploadImages, isStorageConfigured } from "@/lib/supabase";

const CATEGORY_OPTIONS = [
  { label: "디지털기기", value: "DIGITAL" },
  { label: "가구/인테리어", value: "FURNITURE" },
  { label: "생활가전", value: "APPLIANCE" },
  { label: "유아동", value: "KIDS" },
  { label: "기타", value: "ETC" },
];

export default function NewProductPage() {
  const router = useRouter();
  const { data, loading: meLoading } = useQuery(ME);
  const me = data?.me;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("DIGITAL");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [createProduct] = useMutation(CREATE_PRODUCT);

  // 로그인 안 되어 있으면 로그인으로
  useEffect(() => {
    if (!meLoading && !me) router.replace("/login");
  }, [meLoading, me, router]);

  // 이미지 미리보기 URL 관리
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).slice(0, 5);
    setFiles(picked);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !price) {
      setError("제목과 가격은 필수입니다.");
      return;
    }
    if (files.length > 0 && !isStorageConfigured) {
      setError(
        "이미지 업로드가 아직 설정되지 않았어요. 이미지를 빼고 등록해주세요."
      );
      return;
    }
    setBusy(true);
    try {
      const imageUrls = files.length > 0 ? await uploadImages(files) : [];
      const { data: res } = await createProduct({
        variables: {
          title: title.trim(),
          description: description.trim(),
          price: parseInt(price, 10),
          category,
          imageUrls,
        },
      });
      const id = res?.createProduct?.id;
      router.push(id ? `/products/${id}` : "/");
    } catch (err: any) {
      setError(err?.message ?? "등록 중 오류가 발생했습니다.");
      setBusy(false);
    }
  };

  if (meLoading || !me) {
    return (
      <main className="min-h-screen bg-cream">
        <p className="py-20 text-center text-ink-muted">불러오는 중…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-6">
        <Link href="/" className="text-sm text-ink-muted hover:text-carrot">
          ← 목록으로
        </Link>
        <h1 className="mt-4 text-xl font-bold text-ink">내 물건 팔기</h1>

        {!isStorageConfigured && (
          <div className="mt-4 rounded-lg bg-carrot-light px-4 py-3 text-sm text-ink">
            💡 이미지 업로드(Storage)가 아직 설정되지 않았어요. 지금은{" "}
            <b>이미지 없이</b> 등록할 수 있어요.
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-semibold">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="상품 제목"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-carrot"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-semibold">
                카테고리
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-carrot"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-semibold">
                가격(원)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min={0}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-carrot"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상품 설명을 적어주세요"
              rows={5}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-carrot"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              사진 (최대 5장)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
              className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-carrot-light file:px-4 file:py-2 file:text-carrot"
            />
            {previews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-carrot py-3 font-bold text-white hover:bg-carrot-dark disabled:opacity-60"
          >
            {busy ? "등록 중…" : "등록하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
