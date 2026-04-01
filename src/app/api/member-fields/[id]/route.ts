import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/log";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const field = await prisma.memberField.update({
    where: { id: Number(id) },
    data: body,
  });

  await logAction("member_field_update", `필드 수정: ${field.label} (${field.fieldKey})`);
  return NextResponse.json(field);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const field = await prisma.memberField.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });

  await logAction("member_field_delete", `필드 비활성화: ${field.label} (${field.fieldKey})`);
  return NextResponse.json({ success: true });
}
