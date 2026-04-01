import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/log";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({ where: { id: Number(id) } });
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(reservation);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, adminMemo } = await request.json();

  const reservation = await prisma.reservation.update({
    where: { id: Number(id) },
    data: {
      ...(status !== undefined && { status }),
      ...(adminMemo !== undefined && { adminMemo }),
    },
  });

  await logAction("reservation_update", `예약 수정: #${id}`);
  return NextResponse.json(reservation);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.reservation.delete({ where: { id: Number(id) } });

  await logAction("reservation_delete", `예약 삭제: #${id}`);
  return NextResponse.json({ success: true });
}
