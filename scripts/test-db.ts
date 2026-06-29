import "dotenv/config";
import "@/lib/configure-neon";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { getDatabaseConnectionString } from "@/lib/configure-neon";

const adapter = new PrismaNeon({
  connectionString: getDatabaseConnectionString(),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log("user count:", userCount);
    const nonceCount = await prisma.authNonce.count();
    console.log("nonce count:", nonceCount);
  } catch (e) {
    console.error("DB error:", e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
