import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, name, phone, extraData } = body;

  const existing = await prisma.member.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.member.create({
    data: {
      email,
      password: hashed,
      name,
      phone: phone ?? "",
      extraData: typeof extraData === "string" ? extraData : JSON.stringify(extraData || {}),
    },
  });

  return NextResponse.json({ success: true });
}
