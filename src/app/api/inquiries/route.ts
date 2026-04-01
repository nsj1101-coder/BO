import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const status = searchParams.get("status");

  const where = status ? { status } : {};

  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inquiry.count({ where }),
  ]);

  return NextResponse.json({
    inquiries,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const { name, phone, email, content } = await request.json();

  const inquiry = await prisma.inquiry.create({
    data: { name, phone: phone ?? "", email: email ?? "", content },
  });

  return NextResponse.json(inquiry);
}
