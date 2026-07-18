"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN, SIGNUP } from "@/lib/graphql";
import { setToken } from "@/lib/auth";

const NEIGHBORHOODS = [
  "서울시 강남구",
  "서울시 마포구",
  "서울시 송파구",
  "서울시 관악구",
];

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [error, setError] = useState<string | null>(null);

  const [login, { loading: loggingIn }] = useMutation(LOGIN);
  const [signup, { loading: signingUp }] = useMutation(SIGNUP);
  const loading = loggingIn || signingUp;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        const { data } = await login({ variables: { email, password } });
        setToken(data.login.token);
      } else {
        const { data } = await signup({
          variables: { email, password, nickname, neighborhood },
        });
        setToken(data.signup.token);
      }
      // 전체 새로고침으로 이동 → Apollo 캐시 초기화 후 새 토큰으로 me 재조회
      window.location.assign("/");
    } catch (err: any) {
      setError(err?.message ?? "오류가 발생했습니다.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-card bg-white shadow-card p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-ink">동네장터</h1>
          <p className="text-sm text-ink-muted mt-1">우리 동네 중고거래</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-semibold mb-1">닉네임</label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-carrot"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="동네주민"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">이메일</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-carrot"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">비밀번호</label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-carrot"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-sm font-semibold mb-1">동네</label>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-carrot bg-white"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              >
                {NEIGHBORHOODS.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 text-red-500 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-carrot hover:bg-carrot-dark text-white font-bold py-3 transition-colors disabled:opacity-60"
          >
            {mode === "login" ? "로그인" : "회원가입"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="w-full text-center text-sm text-ink-muted mt-4 hover:text-carrot"
        >
          {mode === "login"
            ? "계정이 없으신가요? 회원가입"
            : "이미 계정이 있으신가요? 로그인"}
        </button>
      </div>
    </main>
  );
}
