import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const templates = await prisma.template.findMany({
    where: {
      isOriginal: true,
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, category, htmlContent, cssContent, jsContent, folderId } = body;

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Date.now();

  const template = await prisma.template.create({
    data: {
      name,
      slug,
      folderId: folderId || null,
      category: category || "general",
      htmlContent: htmlContent || "",
      cssContent: cssContent || "",
      jsContent: jsContent || "",
      isOriginal: true,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
