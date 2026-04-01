import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/log";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const consultation = await prisma.consultation.findUnique({ where: { id: Number(id) } });
  if (!consultation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(consultation);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, adminMemo } = await request.json();

  const consultation = await prisma.consultation.update({
    where: { id: Number(id) },
    data: {
      ...(status !== undefined && { status }),
      ...(adminMemo !== undefined && { adminMemo }),
    },
  });

  await logAction("consultation_update", `상담 수정: #${id}`);
  return NextResponse.json(consultation);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.consultation.delete({ where: { id: Number(id) } });

  await logAction("consultation_delete", `상담 삭제: #${id}`);
  return NextResponse.json({ success: true });
}
