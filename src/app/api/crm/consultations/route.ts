import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const customerId = searchParams.get("customerId");
  const leadId = searchParams.get("leadId");
  const result = searchParams.get("result");

  const where = {
    ...(customerId ? { customerId: Number(customerId) } : {}),
    ...(leadId ? { leadId: Number(leadId) } : {}),
    ...(result ? { result } : {}),
  };

  const [consultations, total] = await Promise.all([
    prisma.crmConsultation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lead: { select: { id: true, customerName: true, statusCode: true } },
        customer: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.crmConsultation.count({ where }),
  ]);

  return NextResponse.json({ consultations, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const consultation = await prisma.crmConsultation.create({ data: body });
  return NextResponse.json(consultation, { status: 201 });
}
