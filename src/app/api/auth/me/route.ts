import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.id },
    select: { id: true, loginId: true, name: true, role: true, permissions: true, canManageAdmins: true },
  });

  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(admin);
}
