import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function checkAccess() {
  const session = await getSession();
  if (!session) return null;
  const admin = await prisma.admin.findUnique({ where: { id: session.id } });
  if (!admin) return null;
  if (admin.role !== "super" && !admin.canManageAdmins) return null;
  return admin;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAccess();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const target = await prisma.admin.findUnique({
    where: { id: Number(id) },
    select: {
      id: true, loginId: true, name: true, role: true, isActive: true,
      permissions: true, canManageAdmins: true, createdAt: true, updatedAt: true,
    },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(target);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAccess();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const targetId = Number(id);
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.role !== undefined) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.permissions !== undefined) data.permissions = body.permissions;
  if (body.canManageAdmins !== undefined) data.canManageAdmins = body.canManageAdmins;
  if (body.password) data.password = await bcrypt.hash(body.password, 10);

  const updated = await prisma.admin.update({ where: { id: targetId }, data });

  await prisma.adminLog.create({
    data: { adminId: admin.id, action: "계정 수정", detail: `${updated.name}(${updated.loginId}) 정보 수정` },
  });

  return NextResponse.json({ id: updated.id, name: updated.name });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAccess();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const targetId = Number(id);

  if (targetId === admin.id) return NextResponse.json({ error: "자기 자신은 삭제할 수 없습니다." }, { status: 400 });

  const target = await prisma.admin.findUnique({ where: { id: targetId } });
  if (target?.role === "super") return NextResponse.json({ error: "최고 관리자는 삭제할 수 없습니다." }, { status: 400 });

  await prisma.admin.delete({ where: { id: targetId } });

  await prisma.adminLog.create({
    data: { adminId: admin.id, action: "계정 삭제", detail: `${target?.name}(${target?.loginId}) 계정 삭제` },
  });

  return NextResponse.json({ success: true });
}
