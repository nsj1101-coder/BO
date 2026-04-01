import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const boards = await prisma.board.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { posts: true } } } });
  return NextResponse.json(boards);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const board = await prisma.board.create({ data: body });
  return NextResponse.json(board, { status: 201 });
}
