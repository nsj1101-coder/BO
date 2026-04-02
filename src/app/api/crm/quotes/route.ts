import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const dealId = searchParams.get("dealId");
  const status = searchParams.get("status");

  const where = {
    ...(dealId ? { dealId: Number(dealId) } : {}),
    ...(status ? { status } : {}),
  };

  const [quotes, total] = await Promise.all([
    prisma.crmQuote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { deal: { select: { id: true, title: true } } },
    }),
    prisma.crmQuote.count({ where }),
  ]);

  return NextResponse.json({ quotes, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const year = new Date().getFullYear();
  const lastQuote = await prisma.crmQuote.findFirst({
    where: { quoteNumber: { startsWith: `Q-${year}-` } },
    orderBy: { quoteNumber: "desc" },
  });
  const seq = lastQuote
    ? Number(lastQuote.quoteNumber.split("-")[2]) + 1
    : 1;
  body.quoteNumber = `Q-${year}-${String(seq).padStart(3, "0")}`;

  const quote = await prisma.crmQuote.create({ data: body });
  return NextResponse.json(quote, { status: 201 });
}
