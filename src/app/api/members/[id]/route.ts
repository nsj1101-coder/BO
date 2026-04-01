import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/log";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.member.findUnique({ where: { id: Number(id) } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let extraData: Record<string, string> = {};
  try { extraData = typeof member.extraData === "string" ? JSON.parse(member.extraData) : member.extraData; } catch {}
  if (typeof extraData === "string") try { extraData = JSON.parse(extraData); } catch { extraData = {}; }

  return NextResponse.json({ ...member, extraData });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const member = await prisma.member.update({
    where: { id: Number(id) },
    data: body,
  });

  await logAction("member_update", `회원 수정: ${member.name} (${member.email})`);
  return NextResponse.json(member);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.member.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });

  await logAction("member_delete", `회원 비활성화: ${member.name} (${member.email})`);
  return NextResponse.json({ success: true });
}
