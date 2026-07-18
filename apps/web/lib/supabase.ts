import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = "product-images";

export const isStorageConfigured = Boolean(URL && ANON);

let client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!isStorageConfigured) {
    throw new Error(
      "이미지 업로드가 설정되지 않았습니다. env.md의 '1-C Storage' 단계(버킷 생성 + NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)를 완료해주세요."
    );
  }
  if (!client) client = createClient(URL!, ANON!);
  return client;
}

/** 파일 여러 개를 Storage에 업로드하고 public URL 배열을 반환 */
export async function uploadImages(files: File[]): Promise<string[]> {
  const supabase = getClient();
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw new Error(`이미지 업로드 실패: ${error.message}`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}
