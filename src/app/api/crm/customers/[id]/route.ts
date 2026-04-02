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
  const customer = await prisma.crmCustomer.findUnique({
    where: { id: Number(id) },
    include: {
      leads: { orderBy: { createdAt: "desc" } },
      consultations: { orderBy: { createdAt: "desc" } },
      followups: { orderBy: { createdAt: "desc" } },
      deals: { orderBy: { createdAt: "desc" } },
      mainAssignee: { select: { id: true, name: true } },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const customer = await prisma.crmCustomer.update({ where: { id: Number(id) }, data: body });
  return NextResponse.json(customer);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.crmCustomer.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
