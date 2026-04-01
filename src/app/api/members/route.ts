import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ],
    }),
  };

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.member.count({ where }),
  ]);

  return NextResponse.json({
    members,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
