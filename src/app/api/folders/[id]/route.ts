import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const folder = await prisma.templateFolder.update({
    where: { id: Number(id) },
    data: { name: body.name, description: body.description, color: body.color },
  });

  return NextResponse.json(folder);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.template.updateMany({
    where: { folderId: Number(id) },
    data: { folderId: null },
  });

  await prisma.templateFolder.delete({ where: { id: Number(id) } });

  return NextResponse.json({ success: true });
}
