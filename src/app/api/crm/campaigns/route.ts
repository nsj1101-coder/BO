import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const campaignType = searchParams.get("campaignType");

  const where = {
    ...(status ? { status } : {}),
    ...(campaignType ? { campaignType } : {}),
  };

  const [campaigns, total] = await Promise.all([
    prisma.crmCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.crmCampaign.count({ where }),
  ]);

  return NextResponse.json({ campaigns, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const campaign = await prisma.crmCampaign.create({ data: body });
  return NextResponse.json(campaign, { status: 201 });
}
