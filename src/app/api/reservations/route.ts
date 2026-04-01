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

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reservation.count({ where }),
  ]);

  return NextResponse.json({
    reservations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const { data } = await request.json();

  const reservation = await prisma.reservation.create({
    data: { data: typeof data === "string" ? data : JSON.stringify(data) },
  });

  return NextResponse.json(reservation);
}
