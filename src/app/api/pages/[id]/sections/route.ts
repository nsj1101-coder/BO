import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const pageId = Number(id);
  const body = await req.json();
  const { templateId, isFixed, fixPosition } = body;

  const original = await prisma.template.findUnique({ where: { id: templateId } });
  if (!original) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const clone = await prisma.template.create({
    data: {
      name: `${original.name}_${pageId}`,
      slug: `${original.slug}-clone-${pageId}-${Date.now()}`,
      category: original.category,
      htmlContent: original.htmlContent,
      cssContent: original.cssContent,
      jsContent: original.jsContent,
      isOriginal: false,
      sourceId: original.id,
    },
  });

  const maxOrder = await prisma.pageSection.aggregate({
    where: { pageId },
    _max: { sortOrder: true },
  });

  const section = await prisma.pageSection.create({
    data: {
      pageId,
      templateId: clone.id,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      isFixed: isFixed || false,
      fixPosition: fixPosition || null,
      htmlContent: clone.htmlContent,
      cssContent: clone.cssContent,
      jsContent: clone.jsContent,
    },
    include: { template: true },
  });

  return NextResponse.json(section, { status: 201 });
}
