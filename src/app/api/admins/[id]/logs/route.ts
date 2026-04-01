import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.admin.findUnique({ where: { id: session.id } });
  if (!admin || (admin.role !== "super" && !admin.canManageAdmins)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  const logs = await prisma.adminLog.findMany({
    where: { adminId: Number(id) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(logs);
}
