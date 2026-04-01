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

  const [consultations, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.consultation.count({ where }),
  ]);

  return NextResponse.json({
    consultations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const { data } = await request.json();

  const consultation = await prisma.consultation.create({
    data: { data: typeof data === "string" ? data : JSON.stringify(data) },
  });

  return NextResponse.json(consultation);
}
