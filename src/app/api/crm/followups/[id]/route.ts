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
  const followup = await prisma.crmFollowup.findUnique({
    where: { id: Number(id) },
    include: {
      lead: true,
      customer: true,
      assignee: { select: { id: true, name: true } },
    },
  });
  if (!followup) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(followup);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (body.status === "completed" && !body.completedAt) {
    body.completedAt = new Date();
  }

  const followup = await prisma.crmFollowup.update({ where: { id: Number(id) }, data: body });
  return NextResponse.json(followup);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.crmFollowup.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
