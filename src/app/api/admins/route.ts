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

export async function GET() {
  const admin = await checkAccess();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, loginId: true, name: true, role: true, isActive: true,
      permissions: true, canManageAdmins: true, createdAt: true, updatedAt: true,
      _count: { select: { logs: true } },
    },
  });

  return NextResponse.json(admins);
}

export async function POST(req: NextRequest) {
  const admin = await checkAccess();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await req.json();
  const { loginId, password, name, role, permissions, canManageAdmins } = body;

  if (!loginId || !password || !name) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  const exists = await prisma.admin.findUnique({ where: { loginId } });
  if (exists) return NextResponse.json({ error: "이미 존재하는 아이디입니다." }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  const newAdmin = await prisma.admin.create({
    data: {
      loginId,
      password: hash,
      name,
      role: role || "admin",
      permissions: permissions || "all",
      canManageAdmins: canManageAdmins || false,
    },
  });

  await prisma.adminLog.create({
    data: { adminId: admin.id, action: "계정 생성", detail: `${newAdmin.name}(${newAdmin.loginId}) 계정 생성` },
  });

  return NextResponse.json({ id: newAdmin.id, loginId: newAdmin.loginId, name: newAdmin.name }, { status: 201 });
}
