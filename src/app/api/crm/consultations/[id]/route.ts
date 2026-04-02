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
  const consultation = await prisma.crmConsultation.findUnique({
    where: { id: Number(id) },
    include: {
      lead: true,
      customer: true,
      assignee: { select: { id: true, name: true } },
    },
  });
  if (!consultation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(consultation);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const consultation = await prisma.crmConsultation.update({ where: { id: Number(id) }, data: body });
  return NextResponse.json(consultation);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.crmConsultation.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
