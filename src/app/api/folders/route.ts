import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folders = await prisma.templateFolder.findMany({
    include: {
      templates: {
        where: { isOriginal: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const unfiled = await prisma.template.findMany({
    where: { isOriginal: true, folderId: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ folders, unfiled });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, color } = await req.json();

  const folder = await prisma.templateFolder.create({
    data: { name, description: description || "", color: color || "#3182F6" },
  });

  return NextResponse.json(folder, { status: 201 });
}
