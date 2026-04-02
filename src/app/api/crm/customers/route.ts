import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const grade = searchParams.get("grade");

  const where = {
    ...(grade ? { grade } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
            { companyName: { contains: search } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.crmCustomer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { leads: true } } },
    }),
    prisma.crmCustomer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const customer = await prisma.crmCustomer.create({ data: body });
  return NextResponse.json(customer, { status: 201 });
}
