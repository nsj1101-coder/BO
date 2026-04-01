import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orders } = await req.json() as { orders: { id: number; sortOrder: number }[] };

  await Promise.all(
    orders.map((o) =>
      prisma.pageSection.update({ where: { id: o.id }, data: { sortOrder: o.sortOrder } })
    )
  );

  return NextResponse.json({ success: true });
}
