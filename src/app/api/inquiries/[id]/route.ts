import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/log";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const inquiry = await prisma.inquiry.findUnique({ where: { id: Number(id) } });
  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(inquiry);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, adminMemo } = await request.json();

  const inquiry = await prisma.inquiry.update({
    where: { id: Number(id) },
    data: {
      ...(status !== undefined && { status }),
      ...(adminMemo !== undefined && { adminMemo }),
    },
  });

  await logAction("inquiry_update", `문의 수정: #${id}`);
  return NextResponse.json(inquiry);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.inquiry.delete({ where: { id: Number(id) } });

  await logAction("inquiry_delete", `문의 삭제: #${id}`);
  return NextResponse.json({ success: true });
}
