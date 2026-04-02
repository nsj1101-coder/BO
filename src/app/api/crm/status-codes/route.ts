import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statusCodes = await prisma.crmStatusCode.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(statusCodes);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const statusCode = await prisma.crmStatusCode.create({ data: body });
  return NextResponse.json(statusCode, { status: 201 });
}
