import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";

  const where = {
    ...(boardId ? { boardId: Number(boardId) } : {}),
    ...(search ? { OR: [{ title: { contains: search } }, { content: { contains: search } }] } : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { board: { select: { name: true, boardType: true } }, _count: { select: { comments: true } } },
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const post = await prisma.post.create({ data: body });
  return NextResponse.json(post, { status: 201 });
}
