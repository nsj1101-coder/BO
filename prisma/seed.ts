import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: "postgresql://j@localhost:5432/cms_dev_sf" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("admin1234", 10);
  await prisma.admin.upsert({
    where: { loginId: "admin" },
    update: {},
    create: {
      loginId: "admin",
      password: hash,
      name: "관리자",
      role: "super",
    },
  });
  console.log("Seed completed: admin / admin1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
