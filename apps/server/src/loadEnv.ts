import dotenv from "dotenv";

// .env 로드 (plain dotenv: 값을 리터럴로 읽어 $, @ 등 특수문자 보존)
dotenv.config();

// DB_PASSWORD를 URL 인코딩해서 DATABASE_URL/DIRECT_URL의 __PW__ 자리에 치환.
// 특수문자(@ : / ? # & $ 공백 등)가 있어도 안전하게 연결 문자열이 만들어진다.
// 배포 환경에서 URL을 통째로 직접 주입한 경우(__PW__ 없음)엔 아무 일도 안 한다.
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
