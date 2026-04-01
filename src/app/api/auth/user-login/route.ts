import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const member = await prisma.member.findUnique({ where: { email } });
  if (!member) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." }, { status: 401 });
  }

  if (!member.isActive) {
    return NextResponse.json({ error: "비활성화된 계정입니다." }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, member.password);
  if (!valid) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." }, { status: 401 });
  }

  const token = signToken({
    id: member.id,
    loginId: member.email,
    name: member.name,
    role: "member",
  });

  const cookieStore = await cookies();
  cookieStore.set("member_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return NextResponse.json({ success: true, name: member.name });
}
