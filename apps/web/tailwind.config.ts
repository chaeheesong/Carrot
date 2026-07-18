import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 와이어프레임 기반 디자인 토큰
        carrot: {
          DEFAULT: "#FF7E36", // primary 오렌지
          dark: "#F06A1E",
          light: "#FFE9DC",
        },
        cream: {
          DEFAULT: "#F5F0EA", // 배경
          card: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#333333",
          muted: "#9AA0A6",
        },
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
