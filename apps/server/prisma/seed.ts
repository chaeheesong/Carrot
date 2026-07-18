import "../src/loadEnv.js";
import { PrismaClient, Category, ProductStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const NEIGHBORHOOD = "서울시 강남구";

// 키워드 기반 실사진 (LoremFlickr). lock 값을 고정해 매번 같은 사진이 나오게 함.
const img = (keyword: string, lock: number) =>
  `https://loremflickr.com/600/600/${keyword}?lock=${lock}`;

async function main() {
  console.log("🌱 seeding...");
  await prisma.message.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash("password123", 10);
  const seller = await prisma.user.create({
    data: {
      email: "june@demo.com",
      password: pw,
      nickname: "june_h",
      neighborhood: NEIGHBORHOOD,
    },
  });
  const buyer = await prisma.user.create({
    data: {
      email: "minji@demo.com",
      password: pw,
      nickname: "민지",
      neighborhood: NEIGHBORHOOD,
    },
  });

  const MAPO = "서울시 마포구";
  const items: Array<{
    title: string;
    price: number;
    category: Category;
    keyword: string;
    hood?: string; // 미지정 시 강남구
    status?: ProductStatus;
  }> = [
    // --- 서울시 강남구 ---
    { title: "아이맥 27인치 팝니다", price: 450000, category: Category.DIGITAL, keyword: "imac,computer" },
    { title: "캠핑 의자 거의 새것", price: 18000, category: Category.FURNITURE, keyword: "camping,chair", status: ProductStatus.SOLD },
    { title: "등산화 260mm", price: 32000, category: Category.ETC, keyword: "hiking,boots" },
    { title: "모니터암", price: 12000, category: Category.DIGITAL, keyword: "monitor,desk" },
    { title: "기계식 키보드", price: 9000, category: Category.DIGITAL, keyword: "keyboard,mechanical" },
    { title: "3인용 패브릭 소파", price: 80000, category: Category.FURNITURE, keyword: "sofa,couch" },
    { title: "공기청정기", price: 55000, category: Category.APPLIANCE, keyword: "air,purifier" },
    { title: "유아 원목 책상", price: 40000, category: Category.KIDS, keyword: "wooden,desk" },
    { title: "전자레인지", price: 25000, category: Category.APPLIANCE, keyword: "microwave,kitchen" },
    { title: "아기 바운서", price: 30000, category: Category.KIDS, keyword: "baby,chair" },
    // --- 서울시 마포구 (동네 전환 시연용) ---
    { title: "닌텐도 스위치 OLED", price: 250000, category: Category.DIGITAL, keyword: "nintendo,console", hood: MAPO },
    { title: "원목 4인 식탁", price: 90000, category: Category.FURNITURE, keyword: "dining,table", hood: MAPO },
    { title: "로드 자전거", price: 70000, category: Category.ETC, keyword: "bicycle", hood: MAPO },
  ];

  let i = 0;
  for (const it of items) {
    await prisma.product.create({
      data: {
        title: it.title,
        description: `${it.title} - 상태 좋습니다. 직거래 환영해요.`,
        price: it.price,
        category: it.category,
        status: it.status ?? ProductStatus.SELLING,
        neighborhood: it.hood ?? NEIGHBORHOOD,
        sellerId: seller.id,
        images: {
          create: [0, 1, 2].map((order) => ({
            url: img(it.keyword, i * 3 + order + 1),
            order,
          })),
        },
      },
    });
    i++;
  }

  console.log(`✅ seeded users(2) + products(${items.length})`);
  console.log("   로그인 데모 계정: june@demo.com / minji@demo.com (pw: password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
