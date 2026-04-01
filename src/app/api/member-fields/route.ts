import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/log";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fields = await prisma.memberField.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(fields);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { fieldKey, label, fieldType, required, options, sortOrder } = body;

  const field = await prisma.memberField.create({
    data: { fieldKey, label, fieldType, required, options: options ?? "", sortOrder: sortOrder ?? 0 },
  });

  await logAction("member_field_create", `필드 생성: ${label} (${fieldKey})`);
  return NextResponse.json(field);
}
