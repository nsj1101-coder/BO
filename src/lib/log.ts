import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";

export async function logAction(action: string, detail: string) {
  const session = await getSession();
  if (!session) return;

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") || hdrs.get("x-real-ip") || "unknown";
  const userAgent = hdrs.get("user-agent") || "";

  await prisma.adminLog.create({
    data: { adminId: session.id, action, detail, ip, userAgent },
  });
}
