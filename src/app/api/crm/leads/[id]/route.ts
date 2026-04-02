import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lead = await prisma.crmLead.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      assignee: { select: { id: true, name: true } },
      consultations: { orderBy: { createdAt: "desc" } },
      followups: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.crmLead.findUnique({ where: { id: Number(id) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.statusCode && body.statusCode !== existing.statusCode) {
    await prisma.crmLeadStatusHistory.create({
      data: {
        leadId: Number(id),
        fromStatus: existing.statusCode,
        toStatus: body.statusCode,
        changedBy: session.id,
      },
    });
  }

  const lead = await prisma.crmLead.update({ where: { id: Number(id) }, data: body });
  return NextResponse.json(lead);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.crmLead.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
