import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await prisma.board.findUnique({ where: { id: Number(id) }, include: { _count: { select: { posts: true } } } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(board);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const board = await prisma.board.update({ where: { id: Number(id) }, data: body });
  return NextResponse.json(board);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.board.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
