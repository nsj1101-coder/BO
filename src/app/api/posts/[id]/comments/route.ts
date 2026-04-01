import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const comment = await prisma.comment.create({ data: { ...body, postId: Number(id) } });
  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });
  await prisma.comment.delete({ where: { id: Number(commentId) } });
  return NextResponse.json({ success: true });
}
