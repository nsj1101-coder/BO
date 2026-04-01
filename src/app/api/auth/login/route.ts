import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { loginId, password } = await req.json();

  if (!loginId || !password) {
    return NextResponse.json({ error: "아이디와 비밀번호를 입력해주세요." }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { loginId } });
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    return NextResponse.json({ error: "아이디 또는 비밀번호가 일치하지 않습니다." }, { status: 401 });
  }

  if (!admin.isActive) {
    return NextResponse.json({ error: "비활성화된 계정입니다. 관리자에게 문의하세요." }, { status: 403 });
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "";

  await prisma.adminLog.create({
    data: { adminId: admin.id, action: "로그인", detail: `로그인 성공`, ip, userAgent },
  });

  const token = signToken({ id: admin.id, loginId: admin.loginId, name: admin.name, role: admin.role });

  const res = NextResponse.json({ success: true, name: admin.name, permissions: admin.permissions });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return res;
}
