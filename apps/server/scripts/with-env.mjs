// Prisma CLI를 .env와 함께 실행하는 래퍼.
// 사용: node scripts/with-env.mjs npx prisma migrate dev
// DB_PASSWORD를 URL 인코딩해서 DATABASE_URL/DIRECT_URL의 __PW__ 자리에 치환한 뒤,
// 나머지 인자를 그대로 자식 프로세스로 실행한다. (특수문자 비번 안전)
import dotenv from "dotenv";
import { spawn } from "node:child_process";

dotenv.config();

const pw = process.env.DB_PASSWORD;
if (pw) {
  const enc = encodeURIComponent(pw);
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    const v = process.env[key];
    if (v && v.includes("__PW__")) {
      process.env[key] = v.split("__PW__").join(enc);
    }
  }
}

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error("실행할 명령이 없습니다. 예: node scripts/with-env.mjs npx prisma migrate dev");
  process.exit(1);
}

const child = spawn(cmd, args, {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
