import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sectionId } = await params;
  const body = await req.json();

  const section = await prisma.pageSection.update({
    where: { id: Number(sectionId) },
    data: body,
    include: { template: true },
  });

  return NextResponse.json(section);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sectionId } = await params;
  await prisma.pageSection.delete({ where: { id: Number(sectionId) } });
  return NextResponse.json({ success: true });
}
